import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { tokens } from "@/theme/tokens";

import { BrandMark } from "./brand-mark";

interface OnboardingFrameProps extends PropsWithChildren {
  step: 1 | 2 | 3;
  title: string;
  body: string;
  footer: ReactNode;
  onBack?: () => void;
  status?: ReactNode;
}

export function OnboardingFrame({
  step,
  title,
  body,
  footer,
  onBack,
  status,
  children,
}: OnboardingFrameProps) {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.topBarInner}>
          {onBack ? (
            <Pressable
              accessibilityLabel="이전 화면"
              accessibilityRole="button"
              onPress={onBack}
              style={styles.back}
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}
          <BrandMark compact />
          <Text accessibilityLabel={`온보딩 ${step}단계, 전체 3단계`} style={styles.stepText}>
            {String(step).padStart(2, "0")} / 03
          </Text>
        </View>
        <View accessibilityElementsHidden style={styles.stepRail}>
          {[1, 2, 3].map((railStep) => (
            <View
              key={railStep}
              style={[styles.stepSegment, railStep <= step && styles.stepActive]}
            />
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.body}>{body}</Text>
        </View>
        {status}
        <View style={styles.content}>{children}</View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.footerInner}>{footer}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.color.canvas },
  topBar: {
    paddingTop: tokens.space[2],
    gap: tokens.space[2],
  },
  topBarInner: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    minHeight: tokens.size.touchTarget,
    paddingHorizontal: tokens.layout.screenPadding,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    width: tokens.size.touchTarget,
    height: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: tokens.color.ink, fontSize: 22 },
  stepText: {
    minWidth: tokens.size.touchTarget,
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.label.fontSize,
    lineHeight: tokens.typography.label.lineHeight,
    fontWeight: String(tokens.typography.label.fontWeight) as "600",
    textAlign: "right",
  },
  stepRail: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    paddingHorizontal: tokens.layout.screenPadding,
    alignSelf: "center",
    flexDirection: "row",
    gap: tokens.space[1],
  },
  stepSegment: { flex: 1, height: 2, backgroundColor: tokens.color.line },
  stepActive: { backgroundColor: tokens.color.primary },
  scrollContent: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    alignSelf: "center",
    flexGrow: 1,
    gap: tokens.space[8],
    paddingHorizontal: tokens.layout.screenPadding,
    paddingTop: tokens.space[8],
    paddingBottom: tokens.space[6],
  },
  copy: { gap: tokens.space[3] },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.typography.screenTitle.fontSize,
    lineHeight: tokens.typography.screenTitle.lineHeight,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  body: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
  content: { flex: 1, gap: tokens.space[4] },
  footer: {
    borderTopWidth: 1,
    borderTopColor: tokens.color.line,
    backgroundColor: tokens.color.canvas,
  },
  footerInner: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    alignSelf: "center",
    gap: tokens.space[2],
    paddingHorizontal: tokens.layout.screenPadding,
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[3],
  },
});
