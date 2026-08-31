import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ko } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

interface WebPhotoSelectionGuideProps {
  title: string;
  body: string;
  children?: ReactNode;
  footnote?: string;
  showSteps?: boolean;
  status?: string | null;
}

export function WebPhotoSelectionGuide({
  title,
  body,
  children,
  footnote,
  showSteps = false,
  status,
}: WebPhotoSelectionGuideProps) {
  return (
    <View style={styles.panel} testID="web-photo-selection-guide">
      <View style={styles.copy}>
        <Text style={styles.kicker}>{ko.onboarding.webKicker}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      {showSteps ? (
        <View accessibilityLabel="웹 사진 선택 방법" style={styles.steps}>
          {ko.onboarding.webSteps.map((step, index) => (
            <View key={step} style={styles.step}>
              <View accessibilityElementsHidden style={styles.stepIndex}>
                <Text style={styles.stepIndexText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.boundary}>
        <Text style={styles.boundaryTitle}>{ko.onboarding.webBoundaryTitle}</Text>
        <Text style={styles.boundaryBody}>{ko.onboarding.webBoundaryBody}</Text>
      </View>

      {children ? <View style={styles.action}>{children}</View> : null}

      {status ? (
        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {status}
        </Text>
      ) : null}

      {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: tokens.space[4],
    padding: tokens.space[5],
    borderWidth: 1,
    borderColor: tokens.color.lineStrong,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surface,
  },
  copy: { gap: tokens.space[2] },
  kicker: {
    color: tokens.color.primary,
    fontSize: tokens.typography.eyebrow.fontSize,
    lineHeight: tokens.typography.eyebrow.lineHeight,
    fontWeight: "800",
    letterSpacing: tokens.typography.eyebrow.letterSpacing,
  },
  title: { color: tokens.color.ink, fontSize: 18, lineHeight: 25, fontWeight: "800" },
  body: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
  steps: { gap: tokens.space[3] },
  step: { minHeight: 36, flexDirection: "row", alignItems: "flex-start", gap: tokens.space[3] },
  stepIndex: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.surfaceMuted,
  },
  stepIndexText: { color: tokens.color.ink, fontSize: 11, fontWeight: "800" },
  stepText: {
    flex: 1,
    paddingTop: 3,
    color: tokens.color.ink,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  boundary: {
    gap: tokens.space[1],
    paddingTop: tokens.space[3],
    borderTopWidth: 1,
    borderTopColor: tokens.color.line,
  },
  boundaryTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
    fontWeight: "700",
  },
  boundaryBody: {
    color: tokens.color.inkSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  action: { gap: tokens.space[2] },
  status: {
    color: tokens.color.primary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
    fontWeight: "700",
  },
  footnote: {
    color: tokens.color.inkTertiary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
});
