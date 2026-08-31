import type { OnboardingState, ReviewTimePreset } from "./onboarding-store";
import { OnboardingStore } from "./onboarding-store";
import type { PhotoAccessAdapter } from "./photo-access-adapter";

export class OnboardingFlow {
  constructor(
    private readonly store: OnboardingStore,
    private readonly adapter: PhotoAccessAdapter,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  markValueSeen(): Promise<OnboardingState> {
    return this.store.update({ valueSeen: true });
  }

  async requestPhotoAccess(mode: "full" | "limited"): Promise<OnboardingState> {
    await this.assertValueSeen();
    const photoAccess = await this.adapter.request(mode);
    return this.store.update({ photoAccess, privacySeen: true, importMode: "automatic" });
  }

  async denyPhotoAccess(): Promise<OnboardingState> {
    await this.assertValueSeen();
    return this.store.update({ photoAccess: "denied", privacySeen: true });
  }

  async selectManually(): Promise<{ count: number; state: OnboardingState }> {
    await this.assertValueSeen();
    const count = await this.adapter.selectScreenshots();
    const current = await this.store.load();
    if (count === 0) return { count, state: current };
    const state = await this.recordManualSelection(count);
    return { count, state };
  }

  async recordManualSelection(count: number): Promise<OnboardingState> {
    await this.assertValueSeen();
    if (count <= 0) return this.store.load();
    const current = await this.store.load();
    return this.store.update({
      photoAccess: current.photoAccess === "not_determined" ? "denied" : current.photoAccess,
      privacySeen: true,
      importMode: "manual",
      manualSelectionCount: count,
    });
  }

  async continueWithDemo(): Promise<OnboardingState> {
    await this.assertValueSeen();
    const current = await this.store.load();
    return this.store.update({
      photoAccess: current.photoAccess === "not_determined" ? "denied" : current.photoAccess,
      privacySeen: true,
      importMode: "demo",
    });
  }

  async setReviewTime(reviewTime: ReviewTimePreset): Promise<OnboardingState> {
    const current = await this.store.load();
    if (!current.privacySeen) throw new Error("개인정보 안내를 먼저 확인해 주세요.");
    return this.store.update({ reviewTime });
  }

  async complete(): Promise<OnboardingState> {
    const current = await this.store.load();
    if (!current.valueSeen || !current.privacySeen || !current.reviewTime) {
      throw new Error("온보딩 단계를 모두 확인해 주세요.");
    }
    return this.store.update({ completedAt: this.now() });
  }

  openSettings(): Promise<boolean> {
    return this.adapter.openSettings();
  }

  private async assertValueSeen(): Promise<void> {
    const current = await this.store.load();
    if (!current.valueSeen) throw new Error("가치 안내를 먼저 확인해 주세요.");
  }
}
