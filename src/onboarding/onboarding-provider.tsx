import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AsyncStorageDriver } from "@/data/async-storage-driver";

import {
  defaultOnboardingState,
  type OnboardingState,
  OnboardingStore,
  type PhotoAccessStatus,
  type ReviewTimePreset,
} from "./onboarding-store";
import { OnboardingFlow } from "./onboarding-flow";
import { NativePhotoAccessAdapter, type PhotoAccessAdapter } from "./photo-access-adapter";

interface OnboardingContextValue {
  state: OnboardingState;
  loading: boolean;
  error: string | null;
  markValueSeen(): Promise<void>;
  requestPhotoAccess(mode: "full" | "limited"): Promise<PhotoAccessStatus>;
  denyPhotoAccess(): Promise<void>;
  selectManually(): Promise<number>;
  recordManualSelection(count: number): Promise<void>;
  continueWithDemo(): Promise<void>;
  openSettings(): Promise<boolean>;
  setReviewTime(value: ReviewTimePreset): Promise<void>;
  complete(): Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
  adapter = new NativePhotoAccessAdapter(),
}: PropsWithChildren<{ adapter?: PhotoAccessAdapter }>) {
  const [store] = useState(() => new OnboardingStore(new AsyncStorageDriver()));
  const [photoAccessAdapter] = useState(() => adapter);
  const [flow] = useState(() => new OnboardingFlow(store, photoAccessAdapter));
  const [state, setState] = useState(defaultOnboardingState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void store
      .load()
      .then((next) => {
        if (active) setState(next);
      })
      .catch((reason) => {
        if (active)
          setError(reason instanceof Error ? reason.message : "시작 정보를 불러오지 못했어요.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [store]);

  const run = useCallback(async (action: () => Promise<OnboardingState>) => {
    setError(null);
    try {
      setState(await action());
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "시작 정보를 저장하지 못했어요.";
      setError(message);
      throw reason;
    }
  }, []);

  const markValueSeen = useCallback(() => run(() => flow.markValueSeen()), [flow, run]);

  const requestPhotoAccess = useCallback(
    async (mode: "full" | "limited") => {
      let access: PhotoAccessStatus = "not_determined";
      await run(async () => {
        const next = await flow.requestPhotoAccess(mode);
        access = next.photoAccess;
        return next;
      });
      return access;
    },
    [flow, run],
  );

  const denyPhotoAccess = useCallback(() => run(() => flow.denyPhotoAccess()), [flow, run]);

  const selectManually = useCallback(async () => {
    setError(null);
    try {
      if (!state.valueSeen) throw new Error("가치 안내를 먼저 확인해 주세요.");

      // Mobile Safari requires the picker to open during the original user gesture.
      // Do not put an async storage read before this call.
      const count = await photoAccessAdapter.selectScreenshots();
      if (count === 0) return 0;
      const next = await flow.recordManualSelection(count);
      setState(next);
      return count;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "선택한 항목을 가져오지 못했어요.";
      setError(message);
      throw reason;
    }
  }, [flow, photoAccessAdapter, state.valueSeen]);

  const continueWithDemo = useCallback(() => run(() => flow.continueWithDemo()), [flow, run]);
  const recordManualSelection = useCallback(
    (count: number) => run(() => flow.recordManualSelection(count)),
    [flow, run],
  );

  const openSettings = useCallback(() => flow.openSettings(), [flow]);
  const setReviewTime = useCallback(
    (reviewTime: ReviewTimePreset) => run(() => flow.setReviewTime(reviewTime)),
    [flow, run],
  );
  const complete = useCallback(() => run(() => flow.complete()), [flow, run]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state,
      loading,
      error,
      markValueSeen,
      requestPhotoAccess,
      denyPhotoAccess,
      selectManually,
      recordManualSelection,
      continueWithDemo,
      openSettings,
      setReviewTime,
      complete,
    }),
    [
      complete,
      continueWithDemo,
      denyPhotoAccess,
      error,
      loading,
      markValueSeen,
      openSettings,
      requestPhotoAccess,
      selectManually,
      recordManualSelection,
      setReviewTime,
      state,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error("useOnboarding은 OnboardingProvider 안에서 사용해야 합니다.");
  return value;
}
