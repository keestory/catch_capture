import { beforeEach, describe, expect, it } from "vitest";

import { MemoryStorageDriver } from "@/data/storage-driver";
import { OnboardingFlow } from "@/onboarding/onboarding-flow";
import { ONBOARDING_STORAGE_KEY, OnboardingStore } from "@/onboarding/onboarding-store";
import type { PhotoAccessAdapter } from "@/onboarding/photo-access-adapter";

class DeterministicPhotoAccessAdapter implements PhotoAccessAdapter {
  requestCount = 0;

  constructor(private readonly selectedCount = 5) {}

  async request(mode: "full" | "limited") {
    this.requestCount += 1;
    return mode;
  }

  async selectScreenshots() {
    return this.selectedCount;
  }

  async openSettings() {
    return true;
  }
}

describe("Phase 2 onboarding", () => {
  let driver: MemoryStorageDriver;
  let store: OnboardingStore;

  beforeEach(() => {
    driver = new MemoryStorageDriver();
    store = new OnboardingStore(driver);
  });

  it("starts safely and recovers from corrupt persisted data", async () => {
    expect(await store.load()).toMatchObject({
      valueSeen: false,
      privacySeen: false,
      photoAccess: "not_determined",
    });
    await driver.setItem(ONBOARDING_STORAGE_KEY, "not-json");
    expect((await store.load()).valueSeen).toBe(false);
  });

  it("does not request photo access before the value and privacy pre-prompt", async () => {
    const adapter = new DeterministicPhotoAccessAdapter();
    const flow = new OnboardingFlow(store, adapter);

    await expect(flow.requestPhotoAccess("full")).rejects.toThrow("가치 안내");
    expect(adapter.requestCount).toBe(0);
  });

  it.each(["full", "limited"] as const)(
    "persists the %s access branch through completion",
    async (mode) => {
      const adapter = new DeterministicPhotoAccessAdapter();
      const flow = new OnboardingFlow(store, adapter, () => "2026-08-21T22:00:00+09:00");

      await flow.markValueSeen();
      await flow.requestPhotoAccess(mode);
      await flow.setReviewTime("21:30");
      await flow.complete();

      const relaunched = await new OnboardingStore(driver).load();
      expect(relaunched).toMatchObject({
        photoAccess: mode,
        importMode: "automatic",
        reviewTime: "21:30",
        completedAt: "2026-08-21T22:00:00+09:00",
      });
    },
  );

  it("lets denied users reach completion with a manual selection", async () => {
    const flow = new OnboardingFlow(
      store,
      new DeterministicPhotoAccessAdapter(5),
      () => "2026-08-21T22:00:00+09:00",
    );

    await flow.markValueSeen();
    await flow.denyPhotoAccess();
    expect((await flow.selectManually()).count).toBe(5);
    await flow.setReviewTime("later");
    const completed = await flow.complete();

    expect(completed).toMatchObject({
      photoAccess: "denied",
      importMode: "manual",
      manualSelectionCount: 5,
      reviewTime: "later",
    });
  });

  it("treats a cancelled manual picker as a recoverable non-completion", async () => {
    const flow = new OnboardingFlow(store, new DeterministicPhotoAccessAdapter(0));
    await flow.markValueSeen();

    const result = await flow.selectManually();

    expect(result.count).toBe(0);
    expect(result.state.privacySeen).toBe(false);
    await expect(flow.setReviewTime("later")).rejects.toThrow("개인정보 안내");
  });

  it("lets a denied user continue with the local demo without notifications", async () => {
    const flow = new OnboardingFlow(store, new DeterministicPhotoAccessAdapter());
    await flow.markValueSeen();
    await flow.denyPhotoAccess();
    await flow.continueWithDemo();
    await flow.setReviewTime("later");

    expect(await flow.complete()).toMatchObject({
      photoAccess: "denied",
      importMode: "demo",
      reviewTime: "later",
    });
  });
});
