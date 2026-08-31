import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { ko } from "@/localization/ko";
import { useOnboarding } from "@/onboarding/onboarding-provider";
import { tokens } from "@/theme/tokens";

export default function OnboardingValueScreen() {
  const router = useRouter();
  const { markValueSeen, error } = useOnboarding();
  const [showHow, setShowHow] = useState(false);

  const continueToPrivacy = async () => {
    await markValueSeen();
    router.push("/onboarding/privacy");
  };

  return (
    <OnboardingFrame
      body={ko.onboarding.valueBody}
      footer={
        <>
          <ActionButton label={ko.onboarding.start} onPress={() => void continueToPrivacy()} />
          <ActionButton
            label={ko.onboarding.how}
            onPress={() => setShowHow((value) => !value)}
            variant="quiet"
          />
        </>
      }
      status={
        error ? <Text style={styles.error}>{error}</Text> : showHow ? <HowItWorks /> : undefined
      }
      step={1}
      title={ko.onboarding.valueTitle}
    >
      <View
        accessibilityLabel="세 장의 실제 캡처가 하나의 결정 초안으로 이어지는 예시"
        style={styles.preview}
      >
        <Text style={styles.previewKicker}>{ko.onboarding.valueProofLabel}</Text>
        <View style={styles.previewLabels}>
          <Text style={styles.previewMeta}>{ko.onboarding.valueProofRecent}</Text>
          <Text style={styles.previewMeta}>{ko.onboarding.valueProofPast}</Text>
        </View>
        <View style={styles.triptych}>
          <View style={styles.leadPanel}>
            <ValuePreviewCapture kind="product" label="서로 다른 색의 볼캡 상품" />
          </View>
          <View style={styles.sideStack}>
            <ValuePreviewCapture kind="event" label="행사와 할인 정보" />
            <ValuePreviewCapture kind="reference" label="비교할 판매 정보" />
          </View>
        </View>
        <View style={styles.outcome}>
          <Text style={styles.outcomeLabel}>이어 볼까요?</Text>
          <Text style={styles.proofSentence}>{ko.onboarding.valueProofSentence}</Text>
        </View>
      </View>
    </OnboardingFrame>
  );
}

function ValuePreviewCapture({
  kind,
  label,
}: {
  kind: "product" | "event" | "reference";
  label: string;
}) {
  return (
    <View accessibilityLabel={label} style={[styles.captureScene, styles[`${kind}Scene`]]}>
      <View style={styles.captureTopBar} />
      <View style={styles.captureVisual}>
        <View style={styles.captureObject} />
        <View style={styles.captureObjectDetail} />
      </View>
      <View style={styles.captureCopy}>
        <View style={styles.captureLineStrong} />
        <View style={styles.captureLine} />
      </View>
    </View>
  );
}

function HowItWorks() {
  return (
    <View accessibilityLiveRegion="polite" style={styles.howCard}>
      <Text style={styles.howTitle}>세 번째 캡처가 신호가 돼요.</Text>
      <Text style={styles.howBody}>{ko.onboarding.howBody}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    gap: tokens.space[3],
  },
  previewKicker: {
    color: tokens.color.primary,
    fontSize: tokens.typography.eyebrow.fontSize,
    lineHeight: tokens.typography.eyebrow.lineHeight,
    fontWeight: "800",
    letterSpacing: tokens.typography.eyebrow.letterSpacing,
  },
  previewLabels: {
    paddingHorizontal: tokens.space[2],
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewMeta: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    fontWeight: "600",
  },
  triptych: {
    height: 280,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: tokens.layout.hairline,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.surfaceMuted,
  },
  leadPanel: {
    flex: 1.15,
    overflow: "hidden",
    borderRightWidth: tokens.layout.hairline,
    borderRightColor: tokens.color.line,
    backgroundColor: tokens.color.surface,
  },
  sideStack: {
    flex: 0.85,
    gap: tokens.layout.hairline,
    backgroundColor: tokens.color.line,
  },
  captureScene: { flex: 1, width: "100%", overflow: "hidden" },
  productScene: { backgroundColor: tokens.color.surface },
  eventScene: { backgroundColor: tokens.color.primarySoft },
  referenceScene: { backgroundColor: tokens.color.canvasDeep },
  captureTopBar: {
    height: 22,
    marginHorizontal: tokens.space[3],
    marginTop: tokens.space[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.line,
  },
  captureVisual: {
    flex: 1,
    minHeight: 58,
    margin: tokens.space[3],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.surfaceMuted,
  },
  captureObject: {
    width: "56%",
    height: 26,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.ink,
    transform: [{ rotate: "-7deg" }],
  },
  captureObjectDetail: {
    width: "64%",
    height: 6,
    marginTop: -3,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.lineStrong,
  },
  captureCopy: { gap: tokens.space[2], padding: tokens.space[3] },
  captureLineStrong: {
    width: "74%",
    height: 7,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.inkSecondary,
  },
  captureLine: {
    width: "48%",
    height: 5,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.lineStrong,
  },
  outcome: {
    gap: tokens.space[1],
    paddingTop: tokens.space[1],
  },
  outcomeLabel: {
    color: tokens.color.primary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
    fontWeight: "800",
  },
  proofSentence: {
    color: tokens.color.ink,
    fontSize: tokens.typography.bodyStrong.fontSize,
    lineHeight: tokens.typography.bodyStrong.lineHeight,
    fontWeight: "700",
  },
  howCard: {
    padding: tokens.space[4],
    gap: tokens.space[2],
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.primarySoft,
  },
  howTitle: { color: tokens.color.ink, fontSize: 14, fontWeight: "700" },
  howBody: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  error: { color: tokens.color.danger, fontSize: tokens.typography.metadata.fontSize },
});
