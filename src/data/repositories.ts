import type {
  ActionDraftInteraction,
  Collection,
  DailyRecallSnapshot,
  DailyReviewSession,
  DeviceDeletionRequest,
  Intent,
  RecallInteraction,
  ReviewItemDecision,
  ScreenshotGroup,
  ScreenshotItem,
  UserCorrection,
} from "@/contracts/domain";
import { resolveItemReviewDate, type ReviewImportMode } from "@/domain/review-date";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";

import type { StorageDriver } from "./storage-driver";

export interface RepositorySeed {
  items: ScreenshotItem[];
  groups: ScreenshotGroup[];
  collections: Collection[];
  sessions: DailyReviewSession[];
  corrections?: UserCorrection[];
  decisions?: ReviewItemDecision[];
  deviceDeletionRequests?: DeviceDeletionRequest[];
  recallInteractions?: RecallInteraction[];
  recallSnapshots?: DailyRecallSnapshot[];
  actionDraftInteractions?: ActionDraftInteraction[];
}

export const emptyRepositorySeed = (): RepositorySeed => ({
  items: [],
  groups: [],
  collections: [],
  sessions: [],
  corrections: [],
  decisions: [],
  deviceDeletionRequests: [],
  recallInteractions: [],
  recallSnapshots: [],
  actionDraftInteractions: [],
});

export interface PersistedSnapshot extends RepositorySeed {
  corrections: UserCorrection[];
  decisions: ReviewItemDecision[];
  deviceDeletionRequests: DeviceDeletionRequest[];
  recallInteractions: RecallInteraction[];
  recallSnapshots: DailyRecallSnapshot[];
  actionDraftInteractions: ActionDraftInteraction[];
  schemaVersion: 5;
}

export interface ScreenshotItemRepository {
  list(options?: { includeRemoved?: boolean }): Promise<ScreenshotItem[]>;
  get(id: string): Promise<ScreenshotItem | undefined>;
  save(item: ScreenshotItem): Promise<void>;
  saveMany(items: ScreenshotItem[]): Promise<void>;
  search(query: string): Promise<ScreenshotItem[]>;
  removeFromApp(id: string, removedAt?: string): Promise<void>;
  restore(id: string): Promise<void>;
}

export interface ScreenshotGroupRepository {
  list(): Promise<ScreenshotGroup[]>;
  get(id: string): Promise<ScreenshotGroup | undefined>;
  save(group: ScreenshotGroup): Promise<void>;
  pending(): Promise<ScreenshotGroup[]>;
}

export interface CollectionRepository {
  list(): Promise<Collection[]>;
  get(id: string): Promise<Collection | undefined>;
  save(collection: Collection): Promise<void>;
}

export interface DailyReviewSessionRepository {
  list(): Promise<DailyReviewSession[]>;
  get(id: string): Promise<DailyReviewSession | undefined>;
  activeForDate(reviewDate: string): Promise<DailyReviewSession | undefined>;
  save(session: DailyReviewSession): Promise<void>;
}

export interface ReviewItemDecisionRepository {
  list(sessionId?: string): Promise<ReviewItemDecision[]>;
}

export interface RecallInteractionRepository {
  list(itemId?: string): Promise<RecallInteraction[]>;
  append(interaction: RecallInteraction): Promise<void>;
}

export interface DailyRecallSnapshotRepository {
  get(recallDate: string): Promise<DailyRecallSnapshot | undefined>;
  save(snapshot: DailyRecallSnapshot): Promise<void>;
}

export interface ActionDraftInteractionRepository {
  list(): Promise<ActionDraftInteraction[]>;
  append(interaction: ActionDraftInteraction): Promise<void>;
}

const STORAGE_KEY = "catch.phase1.snapshot.v1";

const clone = <T>(value: T): T => {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
};

const emptySnapshot = (): PersistedSnapshot => ({
  schemaVersion: 5,
  items: [],
  groups: [],
  collections: [],
  sessions: [],
  corrections: [],
  decisions: [],
  deviceDeletionRequests: [],
  recallInteractions: [],
  recallSnapshots: [],
  actionDraftInteractions: [],
});

type LegacyDailyReviewSession = Omit<
  DailyReviewSession,
  "initialGroupIds" | "initialItemIds" | "revision"
>;

type SchemaFourSnapshot = Omit<PersistedSnapshot, "schemaVersion" | "actionDraftInteractions"> & {
  schemaVersion: 4;
  actionDraftInteractions?: ActionDraftInteraction[];
};

type SchemaThreeSnapshot = Omit<
  SchemaFourSnapshot,
  "schemaVersion" | "recallInteractions" | "recallSnapshots" | "actionDraftInteractions"
> & {
  schemaVersion: 3;
  recallInteractions?: RecallInteraction[];
  recallSnapshots?: DailyRecallSnapshot[];
};

type SchemaTwoSnapshot = Omit<
  SchemaThreeSnapshot,
  "schemaVersion" | "deviceDeletionRequests" | "recallInteractions" | "recallSnapshots"
> & {
  schemaVersion: 2;
  deviceDeletionRequests?: DeviceDeletionRequest[];
};

type LegacySnapshot = Omit<SchemaTwoSnapshot, "schemaVersion" | "decisions" | "sessions"> & {
  schemaVersion: 1;
  decisions?: ReviewItemDecision[];
  sessions: LegacyDailyReviewSession[];
};

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const migrateSnapshot = (
  parsed:
    | PersistedSnapshot
    | SchemaFourSnapshot
    | SchemaThreeSnapshot
    | SchemaTwoSnapshot
    | LegacySnapshot,
): PersistedSnapshot => {
  if (parsed.schemaVersion === 5) return parsed;
  if (
    parsed.schemaVersion !== 1 &&
    parsed.schemaVersion !== 2 &&
    parsed.schemaVersion !== 3 &&
    parsed.schemaVersion !== 4
  ) {
    throw new Error("지원하지 않는 로컬 데이터 버전입니다.");
  }

  const sessions: DailyReviewSession[] =
    parsed.schemaVersion === 1
      ? parsed.sessions.map((session) => {
          const initialGroupIds = [...session.groupIds];
          const initialItemIds = unique(
            initialGroupIds.flatMap(
              (groupId) => parsed.groups.find((group) => group.id === groupId)?.itemIds ?? [],
            ),
          );
          return { ...session, initialGroupIds, initialItemIds, revision: 0 };
        })
      : parsed.sessions;
  const deviceDeletionRequests = [...(parsed.deviceDeletionRequests ?? [])];
  const recallInteractions =
    "recallInteractions" in parsed ? (parsed.recallInteractions ?? []) : [];
  const recallSnapshots = "recallSnapshots" in parsed ? (parsed.recallSnapshots ?? []) : [];
  const actionDraftInteractions =
    "actionDraftInteractions" in parsed ? (parsed.actionDraftInteractions ?? []) : [];
  const items = parsed.items.map((item) => {
    if (item.status !== "deleted_from_device") return item;
    deviceDeletionRequests.push({
      id: `legacy-device-delete-${item.id}`,
      itemId: item.id,
      deviceAssetId: item.deviceAssetId ?? "unknown",
      previousStatus: "removed",
      state: "legacy_unverified",
      requestedAt: item.removedAt ?? item.importedAt,
    });
    return { ...item, status: "removed" as const, deletedFromDeviceAt: undefined };
  });

  return {
    ...parsed,
    schemaVersion: 5,
    items,
    sessions,
    decisions: parsed.decisions ?? [],
    deviceDeletionRequests,
    recallInteractions,
    recallSnapshots,
    actionDraftInteractions,
  };
};

const backfillOptionalSeedFields = (snapshot: PersistedSnapshot, seed: RepositorySeed): boolean => {
  let changed = false;
  const optionalExampleIds = new Set(["example-flagpick-salomon-pulse-belt"]);
  const persistedItemIds = new Set(snapshot.items.map((item) => item.id));
  for (const seedItem of seed.items) {
    if (optionalExampleIds.has(seedItem.id) && !persistedItemIds.has(seedItem.id)) {
      snapshot.items.push(clone(seedItem));
      changed = true;
    }
  }
  const seedItems = new Map(seed.items.map((item) => [item.id, item]));
  for (const item of snapshot.items) {
    const seedItem = seedItems.get(item.id);
    if (
      item.analysis &&
      !item.analysis.summaryEvidence &&
      seedItem?.analysis?.summaryEvidence &&
      item.analysis.summary === seedItem.analysis.summary &&
      item.analysis.analyzerVersion === seedItem.analysis.analyzerVersion
    ) {
      item.analysis.summaryEvidence = clone(seedItem.analysis.summaryEvidence);
      changed = true;
    }
  }
  const seedGroups = new Map(seed.groups.map((group) => [group.id, group]));
  for (const group of snapshot.groups) {
    const seedGroup = seedGroups.get(group.id);
    if (!group.summary && seedGroup?.summary) {
      group.summary = seedGroup.summary;
      changed = true;
    }
  }
  return changed;
};

export class LocalDataStore {
  private snapshot = emptySnapshot();
  private initialized = false;
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly storage: StorageDriver) {}

  async initialize(seed: RepositorySeed): Promise<void> {
    if (this.initialized) return;
    const persisted = await this.storage.getItem(STORAGE_KEY);
    if (persisted) {
      const parsed = JSON.parse(persisted) as
        | PersistedSnapshot
        | SchemaFourSnapshot
        | SchemaThreeSnapshot
        | SchemaTwoSnapshot
        | LegacySnapshot;
      this.snapshot = migrateSnapshot(parsed);
      const backfilled = backfillOptionalSeedFields(this.snapshot, seed);
      if (parsed.schemaVersion !== 5 || backfilled) await this.persist();
    } else {
      this.snapshot = {
        schemaVersion: 5,
        items: clone(seed.items),
        groups: clone(seed.groups),
        collections: clone(seed.collections),
        sessions: clone(seed.sessions),
        corrections: clone(seed.corrections ?? []),
        decisions: clone(seed.decisions ?? []),
        deviceDeletionRequests: clone(seed.deviceDeletionRequests ?? []),
        recallInteractions: clone(seed.recallInteractions ?? []),
        recallSnapshots: clone(seed.recallSnapshots ?? []),
        actionDraftInteractions: clone(seed.actionDraftInteractions ?? []),
      };
      await this.persist();
    }
    this.initialized = true;
  }

  read<T>(reader: (snapshot: PersistedSnapshot) => T): T {
    this.assertInitialized();
    return clone(reader(this.snapshot));
  }

  async mutate<T>(writer: (snapshot: PersistedSnapshot) => T): Promise<T> {
    const operation = this.mutationQueue.then(async () => {
      this.assertInitialized();
      const draft = clone(this.snapshot);
      const result = writer(draft);
      await this.storage.setItem(STORAGE_KEY, JSON.stringify(draft));
      this.snapshot = draft;
      return clone(result);
    });
    this.mutationQueue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  async reset(seed: RepositorySeed): Promise<void> {
    this.initialized = false;
    await this.storage.removeItem(STORAGE_KEY);
    await this.initialize(seed);
  }

  private assertInitialized(): void {
    if (!this.initialized) throw new Error("LocalDataStore.initialize()가 먼저 호출되어야 합니다.");
  }

  private persist(): Promise<void> {
    return this.storage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
  }
}

const upsert = <T extends { id: string }>(values: T[], next: T): void => {
  const index = values.findIndex((value) => value.id === next.id);
  if (index >= 0) values[index] = clone(next);
  else values.push(clone(next));
};

const normalize = (value: string): string => value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");

class LocalScreenshotItemRepository implements ScreenshotItemRepository {
  constructor(private readonly store: LocalDataStore) {}

  async list(options?: { includeRemoved?: boolean }): Promise<ScreenshotItem[]> {
    return this.store.read((snapshot) =>
      snapshot.items.filter(
        (item) =>
          options?.includeRemoved ||
          (item.status !== "removed" && item.status !== "deleted_from_device"),
      ),
    );
  }

  async get(id: string): Promise<ScreenshotItem | undefined> {
    return this.store.read((snapshot) => snapshot.items.find((item) => item.id === id));
  }

  async save(item: ScreenshotItem): Promise<void> {
    await this.store.mutate((snapshot) => upsert(snapshot.items, item));
  }

  async saveMany(items: ScreenshotItem[]): Promise<void> {
    await this.store.mutate((snapshot) => items.forEach((item) => upsert(snapshot.items, item)));
  }

  async search(query: string): Promise<ScreenshotItem[]> {
    const terms = normalize(query).split(" ").filter(Boolean);
    if (terms.length === 0) {
      return (await this.list()).filter((item) => !isScreenshotSensitive(item));
    }
    return this.store.read((snapshot) =>
      snapshot.items
        .filter(
          (item) =>
            (item.status === "saved" || item.status === "completed") &&
            !isScreenshotSensitive(item),
        )
        .map((item) => {
          const searchable = normalize(
            [
              item.analysis?.title,
              item.analysis?.summary,
              item.analysis?.ocrText,
              item.source.appName,
              item.source.domain,
              item.intent,
              item.contentType,
              item.capturedAt,
              ...(item.analysis?.keywords ?? []),
            ]
              .filter(Boolean)
              .join(" "),
          );
          return { item, score: terms.filter((term) => searchable.includes(term)).length };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || b.item.capturedAt.localeCompare(a.item.capturedAt))
        .map(({ item }) => item),
    );
  }

  async removeFromApp(id: string, removedAt = new Date().toISOString()): Promise<void> {
    await this.store.mutate((snapshot) => {
      const item = snapshot.items.find((candidate) => candidate.id === id);
      if (!item) throw new Error(`스크린샷 ${id}을 찾을 수 없습니다.`);
      item.status = "removed";
      item.removedAt = removedAt;
    });
  }

  async restore(id: string): Promise<void> {
    await this.store.mutate((snapshot) => {
      const item = snapshot.items.find((candidate) => candidate.id === id);
      if (!item) throw new Error(`스크린샷 ${id}을 찾을 수 없습니다.`);
      if (item.status !== "removed") return;
      item.status = item.intent ? "saved" : "ready_for_review";
      delete item.removedAt;
    });
  }
}

class LocalScreenshotGroupRepository implements ScreenshotGroupRepository {
  constructor(private readonly store: LocalDataStore) {}

  async list(): Promise<ScreenshotGroup[]> {
    return this.store.read((snapshot) => snapshot.groups);
  }

  async get(id: string): Promise<ScreenshotGroup | undefined> {
    return this.store.read((snapshot) => snapshot.groups.find((group) => group.id === id));
  }

  async save(group: ScreenshotGroup): Promise<void> {
    await this.store.mutate((snapshot) => upsert(snapshot.groups, group));
  }

  async pending(): Promise<ScreenshotGroup[]> {
    return this.store.read((snapshot) =>
      snapshot.groups.filter((group) => !group.approvedAt && !group.supersededAt),
    );
  }
}

class LocalCollectionRepository implements CollectionRepository {
  constructor(private readonly store: LocalDataStore) {}

  async list(): Promise<Collection[]> {
    return this.store.read((snapshot) => snapshot.collections);
  }

  async get(id: string): Promise<Collection | undefined> {
    return this.store.read((snapshot) => snapshot.collections.find((value) => value.id === id));
  }

  async save(collection: Collection): Promise<void> {
    await this.store.mutate((snapshot) => upsert(snapshot.collections, collection));
  }
}

class LocalDailyReviewSessionRepository implements DailyReviewSessionRepository {
  constructor(private readonly store: LocalDataStore) {}

  async list(): Promise<DailyReviewSession[]> {
    return this.store.read((snapshot) => snapshot.sessions);
  }

  async get(id: string): Promise<DailyReviewSession | undefined> {
    return this.store.read((snapshot) => snapshot.sessions.find((session) => session.id === id));
  }

  async activeForDate(reviewDate: string): Promise<DailyReviewSession | undefined> {
    return this.store.read((snapshot) =>
      snapshot.sessions.find(
        (session) => session.reviewDate === reviewDate && !session.completedAt,
      ),
    );
  }

  async save(session: DailyReviewSession): Promise<void> {
    await this.store.mutate((snapshot) => upsert(snapshot.sessions, session));
  }
}

class LocalReviewItemDecisionRepository implements ReviewItemDecisionRepository {
  constructor(private readonly store: LocalDataStore) {}

  async list(sessionId?: string): Promise<ReviewItemDecision[]> {
    return this.store.read((snapshot) =>
      snapshot.decisions.filter((decision) => !sessionId || decision.sessionId === sessionId),
    );
  }
}

class LocalRecallInteractionRepository implements RecallInteractionRepository {
  constructor(private readonly store: LocalDataStore) {}

  async list(itemId?: string): Promise<RecallInteraction[]> {
    return this.store.read((snapshot) =>
      snapshot.recallInteractions.filter((interaction) => !itemId || interaction.itemId === itemId),
    );
  }

  async append(interaction: RecallInteraction): Promise<void> {
    await this.store.mutate((snapshot) => {
      if (snapshot.recallInteractions.some((candidate) => candidate.id === interaction.id)) return;
      snapshot.recallInteractions.push(clone(interaction));
    });
  }
}

class LocalDailyRecallSnapshotRepository implements DailyRecallSnapshotRepository {
  constructor(private readonly store: LocalDataStore) {}

  async get(recallDate: string): Promise<DailyRecallSnapshot | undefined> {
    return this.store.read((snapshot) =>
      snapshot.recallSnapshots.find((candidate) => candidate.recallDate === recallDate),
    );
  }

  async save(next: DailyRecallSnapshot): Promise<void> {
    await this.store.mutate((snapshot) => upsert(snapshot.recallSnapshots, next));
  }
}

class LocalActionDraftInteractionRepository implements ActionDraftInteractionRepository {
  constructor(private readonly store: LocalDataStore) {}

  async list(): Promise<ActionDraftInteraction[]> {
    return this.store.read((snapshot) => snapshot.actionDraftInteractions);
  }

  async append(interaction: ActionDraftInteraction): Promise<void> {
    await this.store.mutate((snapshot) => {
      if (snapshot.actionDraftInteractions.some((candidate) => candidate.id === interaction.id)) {
        return;
      }
      snapshot.actionDraftInteractions.push(clone(interaction));
    });
  }
}

export interface AppRepositories {
  store: LocalDataStore;
  items: ScreenshotItemRepository;
  groups: ScreenshotGroupRepository;
  collections: CollectionRepository;
  sessions: DailyReviewSessionRepository;
  decisions: ReviewItemDecisionRepository;
  recallInteractions: RecallInteractionRepository;
  recallSnapshots: DailyRecallSnapshotRepository;
  actionDraftInteractions: ActionDraftInteractionRepository;
}

export function createRepositories(storage: StorageDriver): AppRepositories {
  const store = new LocalDataStore(storage);
  return {
    store,
    items: new LocalScreenshotItemRepository(store),
    groups: new LocalScreenshotGroupRepository(store),
    collections: new LocalCollectionRepository(store),
    sessions: new LocalDailyReviewSessionRepository(store),
    decisions: new LocalReviewItemDecisionRepository(store),
    recallInteractions: new LocalRecallInteractionRepository(store),
    recallSnapshots: new LocalDailyRecallSnapshotRepository(store),
    actionDraftInteractions: new LocalActionDraftInteractionRepository(store),
  };
}

export class ReviewCoordinator {
  constructor(private readonly store: LocalDataStore) {}

  async approveGroup(groupId: string, intent: Intent, approvedAt = new Date().toISOString()) {
    return this.store.mutate((snapshot) => {
      const group = snapshot.groups.find((candidate) => candidate.id === groupId);
      if (!group) throw new Error(`묶음 ${groupId}을 찾을 수 없습니다.`);
      const missingItemIds = group.itemIds.filter(
        (itemId) => !snapshot.items.some((candidate) => candidate.id === itemId),
      );
      if (missingItemIds.length > 0) {
        throw new Error(`묶음에 없는 스크린샷이 있습니다: ${missingItemIds.join(", ")}`);
      }

      let correctedItemCount = 0;
      for (const itemId of group.itemIds) {
        const item = snapshot.items.find((candidate) => candidate.id === itemId)!;
        const previousIntent = item.intent ?? item.analysis?.suggestedIntent;
        if (previousIntent && previousIntent !== intent) correctedItemCount += 1;
        item.intent = intent;
        item.contentType = item.analysis?.contentType ?? item.contentType;
        item.status = "saved";
      }
      group.approvedIntent = intent;
      group.approvedAt = approvedAt;
      return { itemCount: group.itemIds.length, correctedItemCount };
    });
  }
}

const advancePastApprovedGroups = (
  session: DailyReviewSession,
  groups: ScreenshotGroup[],
): void => {
  while (session.currentGroupIndex < session.groupIds.length) {
    const groupId = session.groupIds[session.currentGroupIndex];
    if (!groups.find((group) => group.id === groupId)?.approvedAt) break;
    session.currentGroupIndex += 1;
  }
};

const getActiveSessionAndCurrentGroup = (
  snapshot: PersistedSnapshot,
  sessionId: string,
  groupId: string,
): { session: DailyReviewSession; group: ScreenshotGroup } => {
  const session = snapshot.sessions.find((candidate) => candidate.id === sessionId);
  if (!session || session.completedAt) throw new Error("진행 중인 리뷰를 찾을 수 없습니다.");
  advancePastApprovedGroups(session, snapshot.groups);
  if (session.groupIds[session.currentGroupIndex] !== groupId) {
    throw new Error("현재 확인 중인 묶음만 변경할 수 있습니다.");
  }
  const group = snapshot.groups.find((candidate) => candidate.id === groupId);
  if (!group || group.supersededAt) throw new Error(`묶음 ${groupId}을 찾을 수 없습니다.`);
  return { session, group };
};

const getGroupItems = (snapshot: PersistedSnapshot, group: ScreenshotGroup): ScreenshotItem[] => {
  const items = group.itemIds.map((itemId) =>
    snapshot.items.find((candidate) => candidate.id === itemId),
  );
  const missingItemIds = group.itemIds.filter((_, index) => !items[index]);
  if (missingItemIds.length > 0) {
    throw new Error(`묶음에 없는 스크린샷이 있습니다: ${missingItemIds.join(", ")}`);
  }
  return items as ScreenshotItem[];
};

const baselineIntent = (item: ScreenshotItem): Intent | undefined =>
  item.intent ?? item.analysis?.suggestedIntent;

const recalculateSessionCounts = (
  snapshot: PersistedSnapshot,
  session: DailyReviewSession,
): void => {
  const initialItemIds = new Set(session.initialItemIds);
  const committed = snapshot.decisions.filter(
    (decision) =>
      decision.sessionId === session.id &&
      Boolean(decision.committedAt) &&
      initialItemIds.has(decision.itemId),
  );
  session.reviewedItemCount = unique(committed.map((decision) => decision.itemId)).length;
  session.removedItemCount = unique(
    committed
      .filter((decision) => decision.outcome === "removed")
      .map((decision) => decision.itemId),
  ).length;
  session.correctedItemCount = unique(
    committed
      .filter(
        (decision) =>
          decision.outcome === "saved" &&
          Boolean(decision.baselineIntent) &&
          decision.intent !== decision.baselineIntent,
      )
      .map((decision) => decision.itemId),
  ).length;
};

const addGroupCorrection = (
  snapshot: PersistedSnapshot,
  sessionId: string,
  itemId: string,
  previousValue: string,
  nextValue: string,
  createdAt: string,
): void => {
  snapshot.corrections.push({
    id: `correction-${sessionId}-${itemId}-${snapshot.corrections.length + 1}`,
    itemId,
    field: "group",
    previousValue,
    nextValue,
    source: "review",
    createdAt,
  });
};

export class DailyReviewCoordinator {
  constructor(private readonly store: LocalDataStore) {}

  async startOrResume(
    reviewDate: string,
    startedAt = new Date().toISOString(),
    groupLimit?: number,
    importMode?: ReviewImportMode,
  ): Promise<DailyReviewSession> {
    return this.store.mutate((snapshot) => {
      const existing = snapshot.sessions.find(
        (session) => session.reviewDate === reviewDate && !session.completedAt,
      );
      if (existing) {
        advancePastApprovedGroups(existing, snapshot.groups);
        if (existing.currentGroupIndex >= existing.groupIds.length)
          existing.completedAt = startedAt;
        return existing;
      }

      const eligibleGroupIds = snapshot.groups
        .filter(
          (group) =>
            !group.approvedAt &&
            !group.supersededAt &&
            group.itemIds.every((itemId) => {
              const item = snapshot.items.find((candidate) => candidate.id === itemId);
              return (
                item?.status === "ready_for_review" &&
                Boolean(item.analysis) &&
                resolveItemReviewDate(item, importMode) === reviewDate
              );
            }),
        )
        .map((group) => group.id);
      const groupIds = groupLimit
        ? eligibleGroupIds.slice(0, Math.max(1, groupLimit))
        : eligibleGroupIds;
      if (groupIds.length === 0) throw new Error("오늘 확인할 묶음이 없어요.");

      const session: DailyReviewSession = {
        id: `session-${reviewDate}-${snapshot.sessions.length + 1}`,
        reviewDate,
        initialGroupIds: [...groupIds],
        initialItemIds: unique(
          groupIds.flatMap(
            (groupId) => snapshot.groups.find((group) => group.id === groupId)?.itemIds ?? [],
          ),
        ),
        groupIds,
        currentGroupIndex: 0,
        revision: 0,
        startedAt,
        reviewedItemCount: 0,
        correctedItemCount: 0,
        removedItemCount: 0,
      };
      snapshot.sessions.push(session);
      return session;
    });
  }

  async changeCurrentGroupIntent(
    sessionId: string,
    groupId: string,
    intent: Intent,
  ): Promise<ScreenshotGroup> {
    return this.store.mutate((snapshot) => {
      const { session, group } = getActiveSessionAndCurrentGroup(snapshot, sessionId, groupId);
      group.reviewIntent = intent;
      session.revision += 1;
      return group;
    });
  }

  async setCurrentItemDecision(
    sessionId: string,
    groupId: string,
    itemId: string,
    outcome: "saved" | "removed",
    intent?: Intent,
    updatedAt = new Date().toISOString(),
  ): Promise<ReviewItemDecision> {
    return this.store.mutate((snapshot) => {
      const { session, group } = getActiveSessionAndCurrentGroup(snapshot, sessionId, groupId);
      const item = getGroupItems(snapshot, group).find((candidate) => candidate.id === itemId);
      if (!item) throw new Error("현재 묶음에 없는 캡처입니다.");
      const existing = snapshot.decisions.find(
        (decision) => decision.sessionId === sessionId && decision.itemId === itemId,
      );
      if (existing?.committedAt) throw new Error("이미 정리를 마친 캡처입니다.");
      const selectedIntent =
        intent ?? existing?.intent ?? group.reviewIntent ?? group.suggestedIntent;
      const decision: ReviewItemDecision = {
        id: existing?.id ?? `decision-${sessionId}-${itemId}`,
        sessionId,
        groupId,
        itemId,
        outcome,
        intent: selectedIntent,
        baselineIntent: existing?.baselineIntent ?? baselineIntent(item),
        createdAt: existing?.createdAt ?? updatedAt,
        updatedAt,
      };
      upsert(snapshot.decisions, decision);
      session.revision += 1;
      return decision;
    });
  }

  async undoCurrentItemRemoval(
    sessionId: string,
    groupId: string,
    itemId: string,
    updatedAt = new Date().toISOString(),
  ): Promise<ReviewItemDecision> {
    return this.store.mutate((snapshot) => {
      const { session, group } = getActiveSessionAndCurrentGroup(snapshot, sessionId, groupId);
      const item = getGroupItems(snapshot, group).find((candidate) => candidate.id === itemId);
      if (!item) throw new Error("현재 묶음에 없는 캡처입니다.");
      const decision = snapshot.decisions.find(
        (candidate) => candidate.sessionId === sessionId && candidate.itemId === itemId,
      );
      if (!decision || decision.committedAt || decision.outcome !== "removed") {
        throw new Error("되돌릴 제거 작업이 없습니다.");
      }
      decision.outcome = "saved";
      decision.intent = decision.intent ?? group.reviewIntent ?? group.suggestedIntent;
      decision.updatedAt = updatedAt;
      session.revision += 1;
      return decision;
    });
  }

  async separateCurrentGroup(
    sessionId: string,
    groupId: string,
    separatedAt = new Date().toISOString(),
  ): Promise<{ session: DailyReviewSession; groupIds: string[] }> {
    return this.store.mutate((snapshot) => {
      const { session, group } = getActiveSessionAndCurrentGroup(snapshot, sessionId, groupId);
      const items = getGroupItems(snapshot, group);
      if (items.length < 2) throw new Error("한 장 묶음은 더 나눌 수 없습니다.");
      if (
        snapshot.decisions.some(
          (decision) => decision.sessionId === sessionId && group.itemIds.includes(decision.itemId),
        )
      ) {
        throw new Error("개별 변경을 적용하기 전에 묶음을 조정해 주세요.");
      }

      const childGroups = items.map((item, index): ScreenshotGroup => {
        const id = `${group.id}-part-${index + 1}-${session.revision + 1}`;
        return {
          id,
          type: "manual",
          itemIds: [item.id],
          representativeItemId: item.id,
          suggestedIntent: item.analysis?.suggestedIntent ?? group.suggestedIntent,
          reviewIntent: group.reviewIntent,
          title: item.isSensitive
            ? "민감한 캡처 한 장"
            : (item.analysis?.title ?? `${index + 1}번째 캡처`),
          summary: item.isSensitive ? "민감한 내용이 포함된 캡처예요." : item.analysis?.summary,
          reason: item.isSensitive
            ? "민감한 내용은 숨긴 채 따로 확인해요."
            : "원래 묶음에서 따로 보관하도록 나눴어요.",
          confidence: item.analysis?.intentConfidence ?? group.confidence,
          createdAt: separatedAt,
          splitFromGroupId: group.id,
        };
      });
      group.supersededAt = separatedAt;
      group.supersededByGroupIds = childGroups.map((child) => child.id);
      snapshot.groups.push(...childGroups);
      session.groupIds.splice(
        session.currentGroupIndex,
        1,
        ...childGroups.map((child) => child.id),
      );
      for (const [index, item] of items.entries()) {
        item.groupIds = unique([
          ...item.groupIds.filter((candidate) => candidate !== group.id),
          childGroups[index].id,
        ]);
        addGroupCorrection(
          snapshot,
          sessionId,
          item.id,
          group.id,
          childGroups[index].id,
          separatedAt,
        );
      }
      session.revision += 1;
      return { session, groupIds: childGroups.map((child) => child.id) };
    });
  }

  async mergeSplitGroup(
    sessionId: string,
    groupId: string,
    mergedAt = new Date().toISOString(),
  ): Promise<{ session: DailyReviewSession; group: ScreenshotGroup }> {
    return this.store.mutate((snapshot) => {
      const { session, group } = getActiveSessionAndCurrentGroup(snapshot, sessionId, groupId);
      if (!group.splitFromGroupId) throw new Error("다시 합칠 원래 묶음이 없습니다.");
      const original = snapshot.groups.find(
        (candidate) => candidate.id === group.splitFromGroupId && candidate.supersededAt,
      );
      if (!original) throw new Error("원래 묶음을 찾을 수 없습니다.");
      const siblingIds = session.groupIds.filter((candidateId) => {
        const candidate = snapshot.groups.find((value) => value.id === candidateId);
        return candidate?.splitFromGroupId === original.id && !candidate.approvedAt;
      });
      const firstSiblingIndex = session.groupIds.findIndex(
        (candidate) => candidate === siblingIds[0],
      );
      if (
        siblingIds.length < 2 ||
        firstSiblingIndex !== session.currentGroupIndex ||
        siblingIds.some(
          (candidateId, index) => session.groupIds[firstSiblingIndex + index] !== candidateId,
        )
      ) {
        throw new Error("승인하기 전의 분리된 묶음만 다시 합칠 수 있습니다.");
      }
      const siblingItemIds = unique(
        siblingIds.flatMap(
          (candidateId) =>
            snapshot.groups.find((candidate) => candidate.id === candidateId)?.itemIds ?? [],
        ),
      );
      if (
        snapshot.decisions.some(
          (decision) =>
            decision.sessionId === sessionId && siblingItemIds.includes(decision.itemId),
        )
      ) {
        throw new Error("개별 변경이 없는 분리 묶음만 다시 합칠 수 있습니다.");
      }

      for (const siblingId of siblingIds) {
        const sibling = snapshot.groups.find((candidate) => candidate.id === siblingId)!;
        sibling.supersededAt = mergedAt;
        sibling.supersededByGroupIds = [original.id];
      }
      delete original.supersededAt;
      delete original.supersededByGroupIds;
      session.groupIds.splice(firstSiblingIndex, siblingIds.length, original.id);
      for (const itemId of siblingItemIds) {
        const item = snapshot.items.find((candidate) => candidate.id === itemId)!;
        const previousGroupId = item.groupIds.find((candidate) => siblingIds.includes(candidate));
        item.groupIds = unique([
          ...item.groupIds.filter((candidate) => !siblingIds.includes(candidate)),
          original.id,
        ]);
        if (previousGroupId) {
          addGroupCorrection(snapshot, sessionId, item.id, previousGroupId, original.id, mergedAt);
        }
      }
      session.revision += 1;
      return { session, group: original };
    });
  }

  async approveCurrentGroup(
    sessionId: string,
    groupId: string,
    intent: Intent,
    approvedAt = new Date().toISOString(),
  ): Promise<{
    session: DailyReviewSession;
    itemCount: number;
    correctedItemCount: number;
    removedItemCount: number;
    alreadyApproved: boolean;
  }> {
    return this.store.mutate((snapshot) => {
      const session = snapshot.sessions.find((candidate) => candidate.id === sessionId);
      if (!session) throw new Error("진행 중인 리뷰를 찾을 수 없습니다.");
      const alreadyApprovedGroup = snapshot.groups.find(
        (candidate) => candidate.id === groupId && candidate.approvedAt,
      );
      if (alreadyApprovedGroup && session.groupIds.includes(groupId)) {
        return {
          session,
          itemCount: 0,
          correctedItemCount: 0,
          removedItemCount: 0,
          alreadyApproved: true,
        };
      }
      const active = getActiveSessionAndCurrentGroup(snapshot, sessionId, groupId);
      const activeSession = active.session;
      const group = active.group;
      const groupItems = getGroupItems(snapshot, group);
      const draftDecisions = snapshot.decisions.filter(
        (decision) => decision.sessionId === sessionId && group.itemIds.includes(decision.itemId),
      );
      let correctedItemCount = 0;
      let removedItemCount = 0;
      const savedIntents: Intent[] = [];
      for (const item of groupItems) {
        if (item.status === "deleted_from_device") {
          throw new Error("기기에서 삭제된 캡처는 현재 묶음에서 다시 보관할 수 없습니다.");
        }
        const existingDecision = draftDecisions.find((decision) => decision.itemId === item.id);
        const previousIntent = existingDecision?.baselineIntent ?? baselineIntent(item);
        const outcome = existingDecision?.outcome ?? "saved";
        const finalIntent = existingDecision?.intent ?? intent;
        const decision: ReviewItemDecision = {
          id: existingDecision?.id ?? `decision-${sessionId}-${item.id}`,
          sessionId,
          groupId,
          itemId: item.id,
          outcome,
          intent: outcome === "saved" ? finalIntent : undefined,
          baselineIntent: previousIntent,
          createdAt: existingDecision?.createdAt ?? approvedAt,
          updatedAt: approvedAt,
          committedAt: approvedAt,
        };
        upsert(snapshot.decisions, decision);

        if (outcome === "removed") {
          removedItemCount += 1;
          item.status = "removed";
          item.removedAt = approvedAt;
          continue;
        }
        savedIntents.push(finalIntent);
        if (previousIntent && previousIntent !== finalIntent) {
          correctedItemCount += 1;
          snapshot.corrections.push({
            id: `correction-${sessionId}-${item.id}-${snapshot.corrections.length + 1}`,
            itemId: item.id,
            field: "intent",
            previousValue: previousIntent,
            nextValue: finalIntent,
            source: existingDecision ? "review" : "bulk_action",
            createdAt: approvedAt,
          });
        }
        item.intent = finalIntent;
        item.contentType = item.analysis?.contentType ?? item.contentType;
        item.status = "saved";
        delete item.removedAt;
      }

      const uniqueSavedIntents = unique(savedIntents);
      if (uniqueSavedIntents.length === 1) group.approvedIntent = uniqueSavedIntents[0];
      else delete group.approvedIntent;
      group.resolutionMode = draftDecisions.length > 0 ? "individual" : "batch";
      delete group.reviewIntent;
      group.approvedAt = approvedAt;
      activeSession.currentGroupIndex += 1;
      activeSession.revision += 1;
      advancePastApprovedGroups(activeSession, snapshot.groups);
      recalculateSessionCounts(snapshot, activeSession);
      if (
        activeSession.currentGroupIndex >= activeSession.groupIds.length &&
        activeSession.reviewedItemCount === activeSession.initialItemIds.length
      ) {
        activeSession.completedAt = approvedAt;
      }

      return {
        session: activeSession,
        itemCount: group.itemIds.length,
        correctedItemCount,
        removedItemCount,
        alreadyApproved: false,
      };
    });
  }
}
