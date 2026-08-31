export const onboardingRetentionStages = ["prepared", "review", "complete", "recall"] as const;

export type OnboardingRetentionStage = (typeof onboardingRetentionStages)[number];

export function getNextOnboardingRetentionStage(
  stage: OnboardingRetentionStage,
): OnboardingRetentionStage {
  const index = onboardingRetentionStages.indexOf(stage);
  return onboardingRetentionStages[Math.min(index + 1, onboardingRetentionStages.length - 1)];
}

export function getPreviousOnboardingRetentionStage(
  stage: OnboardingRetentionStage,
): OnboardingRetentionStage {
  const index = onboardingRetentionStages.indexOf(stage);
  return onboardingRetentionStages[Math.max(index - 1, 0)];
}
