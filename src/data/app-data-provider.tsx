import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";

import type {
  ActionDraftInteraction,
  DailyReviewSession,
  Intent,
  RecallInteraction,
  ReviewItemDecision,
  ScreenshotGroup,
  ScreenshotItem,
} from "@/contracts/domain";
import { resolveItemReviewDate, resolveReviewDate } from "@/domain/review-date";
import { browserScreenshotSource } from "@/services/browser-screenshot-source";
import { DeviceDeletionCoordinator } from "@/services/device-deletion-coordinator";
import type { DeviceDeletionOutcome } from "@/services/device-deletion-coordinator";
import { ExpoDevicePhotoLibrary } from "@/services/expo-media-library-adapter";
import { getDeviceScreenshotSource } from "@/services/device-screenshot-source";
import {
  ScreenshotImportCoordinator,
  type ScreenshotImportStatus,
} from "@/services/screenshot-import-coordinator";
import { useOnboarding } from "@/onboarding/onboarding-provider";

import { AsyncStorageDriver } from "./async-storage-driver";
import { mockSeed } from "./mock-data";
import { createRepositories, DailyReviewCoordinator, emptyRepositorySeed } from "./repositories";

type PhotoImportUiStatus = "idle" | "syncing" | ScreenshotImportStatus;

interface AppDataContextValue {
  items: ScreenshotItem[];
  groups: ScreenshotGroup[];
  allGroups: ScreenshotGroup[];
  sessions: DailyReviewSession[];
  activeSession?: DailyReviewSession;
  reviewDecisions: ReviewItemDecision[];
  recallInteractions: RecallInteraction[];
  actionDraftInteractions: ActionDraftInteraction[];
  loading: boolean;
  error: string | null;
  photoImportStatus: PhotoImportUiStatus;
  syncScreenshots(): Promise<void>;
  selectBrowserScreenshots(): Promise<number>;
  startReview(groupLimit?: number): Promise<DailyReviewSession>;
  approveSessionGroup(sessionId: string, groupId: string, intent: Intent): Promise<void>;
  changeSessionGroupIntent(sessionId: string, groupId: string, intent: Intent): Promise<void>;
  setSessionItemDecision(
    sessionId: string,
    groupId: string,
    itemId: string,
    outcome: "saved" | "removed",
    intent?: Intent,
  ): Promise<void>;
  undoSessionItemRemoval(sessionId: string, groupId: string, itemId: string): Promise<void>;
  separateSessionGroup(sessionId: string, groupId: string): Promise<void>;
  mergeSessionGroup(sessionId: string, groupId: string): Promise<void>;
  search(query: string): Promise<ScreenshotItem[]>;
  removeItemFromApp(itemId: string): Promise<void>;
  deleteItemFromDevice(itemId: string): Promise<DeviceDeletionOutcome>;
  recordActionDraftInteraction(
    suggestionId: string,
    type: ActionDraftInteraction["type"],
  ): Promise<void>;
  openPhotoSettings(): Promise<boolean>;
  resetDemo(): Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const { state: onboarding, loading: onboardingLoading, recordManualSelection } = useOnboarding();
  const [repositories] = useState(() => createRepositories(new AsyncStorageDriver()));
  const [photoLibrary] = useState(() => new ExpoDevicePhotoLibrary());
  const [screenshotSource] = useState(() => getDeviceScreenshotSource());
  const [deviceDeletion] = useState(
    () => new DeviceDeletionCoordinator(repositories.store, photoLibrary),
  );
  const [screenshotImport] = useState(
    () => new ScreenshotImportCoordinator(repositories.store, screenshotSource),
  );

  const [items, setItems] = useState<ScreenshotItem[]>([]);
  const [groups, setGroups] = useState<ScreenshotGroup[]>([]);
  const [allGroups, setAllGroups] = useState<ScreenshotGroup[]>([]);
  const [sessions, setSessions] = useState<DailyReviewSession[]>([]);
  const [activeSession, setActiveSession] = useState<DailyReviewSession | undefined>();
  const [reviewDecisions, setReviewDecisions] = useState<ReviewItemDecision[]>([]);
  const [recallInteractions, setRecallInteractions] = useState<RecallInteraction[]>([]);
  const [actionDraftInteractions, setActionDraftInteractions] = useState<ActionDraftInteraction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [photoImportStatus, setPhotoImportStatus] = useState<PhotoImportUiStatus>("idle");

  const refresh = useCallback(
    async (importMode = onboarding.importMode) => {
      const nextItems = await repositories.items.list();
      const reviewDate = resolveReviewDate(nextItems, importMode);
      const [
        nextPendingGroups,
        nextAllGroups,
        nextSessions,
        nextActiveSession,
        nextDecisions,
        nextRecallInteractions,
        nextActionDraftInteractions,
      ] = await Promise.all([
        repositories.groups.pending(),
        repositories.groups.list(),
        repositories.sessions.list(),
        repositories.sessions.activeForDate(reviewDate),
        repositories.decisions.list(),
        repositories.recallInteractions.list(),
        repositories.actionDraftInteractions.list(),
      ]);
      const actionableGroups = nextPendingGroups.filter((group) =>
        group.itemIds.every((itemId) => {
          const item = nextItems.find((candidate) => candidate.id === itemId);
          return (
            item?.status === "ready_for_review" &&
            Boolean(item.analysis) &&
            resolveItemReviewDate(item, importMode) === reviewDate
          );
        }),
      );
      setItems(nextItems);
      setGroups(actionableGroups);
      setAllGroups(nextAllGroups);
      setSessions(nextSessions);
      setActiveSession(nextActiveSession);
      setReviewDecisions(nextDecisions);
      setRecallInteractions(nextRecallInteractions);
      setActionDraftInteractions(nextActionDraftInteractions);
    },
    [onboarding.importMode, repositories],
  );

  const syncScreenshots = useCallback(async () => {
    if (!initialized || onboarding.importMode === "demo") return;
    setPhotoImportStatus("syncing");
    try {
      const result = await screenshotImport.sync();
      setPhotoImportStatus(result.status);
      await refresh();
    } catch (reason) {
      setPhotoImportStatus("failed");
      setError(reason instanceof Error ? reason.message : "스크린샷을 가져오지 못했어요.");
    }
  }, [initialized, onboarding.importMode, refresh, screenshotImport]);

  const selectBrowserScreenshots = useCallback(async () => {
    setError(null);
    try {
      const count = await browserScreenshotSource.selectScreenshots();
      if (count === 0) return 0;

      if (onboarding.importMode === "demo") {
        setPhotoImportStatus("syncing");
        await repositories.store.reset(emptyRepositorySeed());
        await recordManualSelection(count);
        const result = await new ScreenshotImportCoordinator(
          repositories.store,
          browserScreenshotSource,
        ).sync();
        setPhotoImportStatus(result.status);
        await refresh("manual");
      } else {
        await syncScreenshots();
      }
      return count;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "스크린샷을 가져오지 못했어요.");
      throw reason;
    }
  }, [onboarding.importMode, recordManualSelection, refresh, repositories, syncScreenshots]);

  useEffect(() => {
    const onboardingHasDataScope = Boolean(onboarding.importMode && onboarding.reviewTime);
    if (onboardingLoading || !onboardingHasDataScope || initialized) return;
    let active = true;
    const boot = async () => {
      try {
        const seed = onboarding.importMode === "demo" ? mockSeed : emptyRepositorySeed();
        await repositories.store.initialize(seed);
        await deviceDeletion.reconcilePending();
        if (!active) return;
        if (onboarding.importMode !== "demo") {
          setPhotoImportStatus("syncing");
          const result = await screenshotImport.sync();
          if (active) setPhotoImportStatus(result.status);
        }
        if (active) {
          await refresh();
          setInitialized(true);
        }
      } catch (reason) {
        if (active)
          setError(reason instanceof Error ? reason.message : "데이터를 불러오지 못했어요.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void boot();
    return () => {
      active = false;
    };
  }, [
    deviceDeletion,
    initialized,
    onboarding.importMode,
    onboardingLoading,
    onboarding.reviewTime,
    refresh,
    repositories,
    screenshotImport,
  ]);

  useEffect(() => {
    if (!initialized || onboarding.importMode === "demo") return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncScreenshots();
    });
    return () => subscription.remove();
  }, [initialized, onboarding.importMode, syncScreenshots]);

  const search = useCallback(
    async (query: string) => {
      return repositories.items.search(query);
    },
    [repositories],
  );

  const removeItemFromApp = useCallback(
    async (itemId: string) => {
      setError(null);
      try {
        await repositories.items.removeFromApp(itemId);
        await refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Echo에서 제거하지 못했어요.");
        throw reason;
      }
    },
    [refresh, repositories],
  );

  const deleteItemFromDevice = useCallback(
    async (itemId: string) => {
      setError(null);
      try {
        const result = await deviceDeletion.deleteItem(itemId);
        await refresh();
        return result;
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "기기 사진을 삭제하지 못했어요.");
        throw reason;
      }
    },
    [deviceDeletion, refresh],
  );

  const openPhotoSettings = useCallback(() => photoLibrary.openSettings(), [photoLibrary]);

  const recordActionDraftInteraction = useCallback(
    async (suggestionId: string, type: ActionDraftInteraction["type"]) => {
      const occurredAt = new Date().toISOString();
      await repositories.actionDraftInteractions.append({
        id: `action-draft-${type}-${suggestionId}-${occurredAt}`,
        suggestionId,
        type,
        occurredAt,
      });
      await refresh();
    },
    [refresh, repositories],
  );

  const startReview = useCallback(
    async (groupLimit?: number) => {
      setError(null);
      try {
        const session = await new DailyReviewCoordinator(repositories.store).startOrResume(
          resolveReviewDate(items, onboarding.importMode),
          undefined,
          groupLimit,
          onboarding.importMode,
        );
        await refresh();
        return session;
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "리뷰를 시작하지 못했어요.";
        setError(message);
        throw reason;
      }
    },
    [items, onboarding.importMode, refresh, repositories],
  );

  const approveSessionGroup = useCallback(
    async (sessionId: string, groupId: string, intent: Intent) => {
      setError(null);
      try {
        await new DailyReviewCoordinator(repositories.store).approveCurrentGroup(
          sessionId,
          groupId,
          intent,
        );
        await refresh();
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "묶음을 저장하지 못했어요.";
        setError(message);
        throw reason;
      }
    },
    [refresh, repositories],
  );

  const changeSessionGroupIntent = useCallback(
    async (sessionId: string, groupId: string, intent: Intent) => {
      setError(null);
      try {
        await new DailyReviewCoordinator(repositories.store).changeCurrentGroupIntent(
          sessionId,
          groupId,
          intent,
        );
        await refresh();
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "분류를 바꾸지 못했어요.";
        setError(message);
        throw reason;
      }
    },
    [refresh, repositories],
  );

  const setSessionItemDecision = useCallback(
    async (
      sessionId: string,
      groupId: string,
      itemId: string,
      outcome: "saved" | "removed",
      intent?: Intent,
    ) => {
      setError(null);
      try {
        await new DailyReviewCoordinator(repositories.store).setCurrentItemDecision(
          sessionId,
          groupId,
          itemId,
          outcome,
          intent,
        );
        await refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "개별 변경을 저장하지 못했어요.");
        throw reason;
      }
    },
    [refresh, repositories],
  );

  const undoSessionItemRemoval = useCallback(
    async (sessionId: string, groupId: string, itemId: string) => {
      setError(null);
      try {
        await new DailyReviewCoordinator(repositories.store).undoCurrentItemRemoval(
          sessionId,
          groupId,
          itemId,
        );
        await refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "제거를 되돌리지 못했어요.");
        throw reason;
      }
    },
    [refresh, repositories],
  );

  const separateSessionGroup = useCallback(
    async (sessionId: string, groupId: string) => {
      setError(null);
      try {
        await new DailyReviewCoordinator(repositories.store).separateCurrentGroup(
          sessionId,
          groupId,
        );
        await refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "묶음을 나누지 못했어요.");
        throw reason;
      }
    },
    [refresh, repositories],
  );

  const mergeSessionGroup = useCallback(
    async (sessionId: string, groupId: string) => {
      setError(null);
      try {
        await new DailyReviewCoordinator(repositories.store).mergeSplitGroup(sessionId, groupId);
        await refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "묶음을 다시 합치지 못했어요.");
        throw reason;
      }
    },
    [refresh, repositories],
  );

  const resetDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await repositories.store.reset(mockSeed);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "데모 데이터를 초기화하지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [refresh, repositories]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      items,
      groups,
      allGroups,
      sessions,
      activeSession,
      reviewDecisions,
      recallInteractions,
      actionDraftInteractions,
      loading,
      error,
      photoImportStatus,
      syncScreenshots,
      selectBrowserScreenshots,
      startReview,
      approveSessionGroup,
      changeSessionGroupIntent,
      setSessionItemDecision,
      undoSessionItemRemoval,
      separateSessionGroup,
      mergeSessionGroup,
      search,
      removeItemFromApp,
      deleteItemFromDevice,
      recordActionDraftInteraction,
      openPhotoSettings,
      resetDemo,
    }),
    [
      activeSession,
      actionDraftInteractions,
      allGroups,
      approveSessionGroup,
      changeSessionGroupIntent,
      mergeSessionGroup,
      error,
      photoImportStatus,
      groups,
      items,
      loading,
      deleteItemFromDevice,
      recordActionDraftInteraction,
      openPhotoSettings,
      removeItemFromApp,
      resetDemo,
      reviewDecisions,
      recallInteractions,
      search,
      sessions,
      selectBrowserScreenshots,
      separateSessionGroup,
      setSessionItemDecision,
      startReview,
      syncScreenshots,
      undoSessionItemRemoval,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const value = useContext(AppDataContext);
  if (!value) throw new Error("useAppData는 AppDataProvider 안에서 사용해야 합니다.");
  return value;
}
