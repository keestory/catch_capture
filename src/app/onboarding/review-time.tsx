import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { ko } from "@/localization/ko";
import type { ReviewTimePreset } from "@/onboarding/onboarding-store";
import { useOnboarding } from "@/onboarding/onboarding-provider";
import { tokens } from "@/theme/tokens";

const times: { value: ReviewTimePreset; label: string; description: string }[] = [
  { value: "20:00", label: "오후 8:00", description: "저녁을 시작할 때" },
  { value: "21:30", label: "오후 9:30", description: "하루가 차분해질 때" },
  { value: "23:00", label: "오후 11:00", description: "잠들기 전에" },
  { value: "later", label: ko.onboarding.later, description: "알림 없이 먼저 사용" },
];

export default function OnboardingReviewTimeScreen() {
  const router = useRouter();
  const { state, error, setReviewTime } = useOnboarding();
  const [selected, setSelected] = useState<ReviewTimePreset | undefined>(state.reviewTime);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await setReviewTime(selected);
      router.replace("/onboarding/first-result");
    } finally {
      setBusy(false);
    }
  };

  const statusText =
    state.importMode === "manual"
      ? ko.onboarding.manualStatus
      : state.importMode === "demo"
        ? ko.onboarding.demoStatus
        : state.photoAccess === "limited"
          ? ko.onboarding.limitedStatus
          : ko.onboarding.fullStatus;

  return (
    <OnboardingFrame
      body={ko.onboarding.reviewTimeBody}
      footer={
        <ActionButton
          disabled={!selected || busy}
          label={ko.onboarding.finish}
          onPress={() => void finish()}
        />
      }
      onBack={() => router.back()}
      status={
        <View accessibilityLiveRegion="polite" style={styles.status}>
          <Text style={styles.statusMark}>✓</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      }
      step={3}
      title={ko.onboarding.reviewTimeTitle}
    >
      <View accessibilityRole="radiogroup" style={styles.options}>
        {times.map((time) => {
          const isSelected = selected === time.value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              key={time.value}
              onPress={() => setSelected(time.value)}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionLabel}>{time.label}</Text>
                <Text style={styles.optionDescription}>{time.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  status: {
    padding: tokens.space[3],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[2],
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.successSoft,
  },
  statusMark: { color: tokens.color.success, fontSize: 16, fontWeight: "800" },
  statusText: {
    flex: 1,
    color: tokens.color.ink,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  options: { gap: tokens.space[2] },
  option: {
    minHeight: 72,
    paddingHorizontal: tokens.space[4],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[3],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surfaceRaised,
  },
  optionSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primarySoft,
  },
  optionPressed: { opacity: 0.76 },
  radio: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.color.lineStrong,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.surface,
  },
  radioSelected: { borderColor: tokens.color.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
  },
  optionCopy: { flex: 1 },
  optionLabel: {
    color: tokens.color.ink,
    fontSize: tokens.typography.bodyStrong.fontSize,
    lineHeight: tokens.typography.bodyStrong.lineHeight,
    fontWeight: "700",
  },
  optionDescription: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  error: { color: tokens.color.danger, fontSize: tokens.typography.metadata.fontSize },
});
