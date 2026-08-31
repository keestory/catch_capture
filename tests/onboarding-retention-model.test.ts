import { describe, expect, it } from "vitest";

import {
  getNextOnboardingRetentionStage,
  getPreviousOnboardingRetentionStage,
} from "@/design-lab/onboarding-retention-model";

describe("onboarding retention design lab", () => {
  it("advances through first value, review, completion, and recall", () => {
    expect(getNextOnboardingRetentionStage("prepared")).toBe("review");
    expect(getNextOnboardingRetentionStage("review")).toBe("complete");
    expect(getNextOnboardingRetentionStage("complete")).toBe("recall");
  });

  it("keeps navigation within the four-stage prototype", () => {
    expect(getNextOnboardingRetentionStage("recall")).toBe("recall");
    expect(getPreviousOnboardingRetentionStage("prepared")).toBe("prepared");
    expect(getPreviousOnboardingRetentionStage("recall")).toBe("complete");
  });
});
