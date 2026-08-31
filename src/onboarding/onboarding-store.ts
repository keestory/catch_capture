import type { StorageDriver } from "@/data/storage-driver";

export type PhotoAccessStatus = "not_determined" | "full" | "limited" | "denied";
export type ImportMode = "automatic" | "manual" | "demo";
export type ReviewTimePreset = "20:00" | "21:30" | "23:00" | "later";

export interface OnboardingState {
  schemaVersion: 1;
  valueSeen: boolean;
  privacySeen: boolean;
  photoAccess: PhotoAccessStatus;
  importMode?: ImportMode;
  manualSelectionCount: number;
  reviewTime?: ReviewTimePreset;
  completedAt?: string;
}

export const defaultOnboardingState = (): OnboardingState => ({
  schemaVersion: 1,
  valueSeen: false,
  privacySeen: false,
  photoAccess: "not_determined",
  manualSelectionCount: 0,
});

export const ONBOARDING_STORAGE_KEY = "catch.onboarding.v1";

const isOnboardingState = (value: unknown): value is OnboardingState => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<OnboardingState>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.valueSeen === "boolean" &&
    typeof candidate.privacySeen === "boolean" &&
    ["not_determined", "full", "limited", "denied"].includes(candidate.photoAccess ?? "") &&
    typeof candidate.manualSelectionCount === "number"
  );
};

export class OnboardingStore {
  constructor(private readonly storage: StorageDriver) {}

  async load(): Promise<OnboardingState> {
    const persisted = await this.storage.getItem(ONBOARDING_STORAGE_KEY);
    if (!persisted) return defaultOnboardingState();
    try {
      const parsed: unknown = JSON.parse(persisted);
      return isOnboardingState(parsed) ? parsed : defaultOnboardingState();
    } catch {
      return defaultOnboardingState();
    }
  }

  async update(patch: Partial<OnboardingState>): Promise<OnboardingState> {
    const current = await this.load();
    const next: OnboardingState = { ...current, ...patch, schemaVersion: 1 };
    await this.storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  async reset(): Promise<OnboardingState> {
    await this.storage.removeItem(ONBOARDING_STORAGE_KEY);
    return defaultOnboardingState();
  }
}
