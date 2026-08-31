import { useMemo, useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "@/components/action-button";
import { BrandMark } from "@/components/brand-mark";
import { StatePanel } from "@/components/state-panel";
import type { ScreenshotItem } from "@/contracts/domain";
import { useAppData } from "@/data/app-data-provider";
import { getMockPhotoSource } from "@/data/mock-photo-assets";
import { presentScreenshotMedia } from "@/domain/screenshot-media-presentation";
import { interpolate, ko } from "@/localization/ko";
import { buildFirstResultPresentation } from "@/onboarding/first-result-presentation";
import { useOnboarding } from "@/onboarding/onboarding-provider";
import { tokens } from "@/theme/tokens";

const FIRST_RESULT_GROUP_LIMIT = 3;

export default function OnboardingFirstResultScreen() {
  const router = useRouter();
  const { state: onboarding, complete } = useOnboarding();
  const { items, groups, loading, error, startReview } = useAppData();
  const [busy, setBusy] = useState(false);
  const presentation = useMemo(
    () => buildFirstResultPresentation(items, groups, FIRST_RESULT_GROUP_LIMIT),
    [groups, items],
  );
  const browserManual = Platform.OS === "web" && onboarding.importMode === "manual";

  const continueToApp = async () => {
    setBusy(true);
    try {
      if (presentation.groupCount > 0) {
        const session = await startReview(FIRST_RESULT_GROUP_LIMIT);
        await complete();
        router.replace(`/review/${session.id}`);
        return;
      }
      await complete();
      router.replace("/(tabs)");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        <BrandMark compact showGlyph={false} />
        <Text style={styles.resultLabel}>첫 결과</Text>
      </View>

      {loading ? (
        <View style={styles.stateWrap}>
          <StatePanel
            description={
              browserManual
                ? "선택한 캡처를 이 브라우저에서 준비하고 있어요."
                : "캡처와 지난 장면의 연결을 찾고 있어요."
            }
            kind="loading"
            title="첫 결과를 준비하는 중"
          />
        </View>
      ) : presentation.groupCount === 0 ? (
        <View style={styles.stateWrap}>
          <StatePanel
            description={ko.onboarding.firstResultEmptyBody}
            kind={error ? "error" : "empty"}
            title={error ? "캡처를 준비하지 못했어요." : ko.onboarding.firstResultEmptyTitle}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCopy}>
            <Text accessibilityRole="header" style={styles.displayTitle}>
              {interpolate(ko.onboarding.firstResultTitle, {
                itemCount: presentation.itemCount,
                groupCount: presentation.groupCount,
              })}
            </Text>
            <Text style={styles.lead}>
              {browserManual ? ko.onboarding.firstResultManualBody : ko.onboarding.firstResultBody}
            </Text>
          </View>

          {presentation.evidenceItems.length > 0 ? (
            <View
              accessibilityLabel={
                browserManual
                  ? `직접 선택한 캡처 ${presentation.evidenceItems.length}장`
                  : `${presentation.recentDateLabel} 캡처와 ${presentation.pastDateLabel} 캡처가 연결된 모습`
              }
              style={styles.memoryConnection}
            >
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>
                  {browserManual ? "직접 선택" : "최근"} · {presentation.recentDateLabel}
                </Text>
                {!browserManual && presentation.pastCount > 0 ? (
                  <Text style={styles.dateLabel}>지난 · {presentation.pastDateLabel}</Text>
                ) : null}
              </View>
              <View style={styles.screenshotRow}>
                {presentation.evidenceItems.map((item) => (
                  <EvidenceThumb item={item} key={item.id} />
                ))}
              </View>
              {!browserManual && presentation.pastCount > 0 ? (
                <View accessibilityElementsHidden style={styles.connectionRail}>
                  <View style={styles.connectionLine} />
                  <View style={styles.connectionPoint} />
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.outcomes}>
            <Outcome
              label={interpolate(
                browserManual
                  ? ko.onboarding.firstResultManualLabel
                  : ko.onboarding.firstResultAutoLabel,
                {
                  itemCount: presentation.itemCount,
                  groupCount: presentation.groupCount,
                },
              )}
              sentence={
                browserManual
                  ? ko.onboarding.firstResultManualOutcome
                  : ko.onboarding.firstResultAutoBody
              }
            />
            {presentation.pastCount > 0 ? (
              <Outcome
                label={interpolate(ko.onboarding.firstResultRecallLabel, {
                  pastCount: presentation.pastCount,
                })}
                sentence={ko.onboarding.firstResultRecallBody}
              />
            ) : null}
          </View>
          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </Text>
          ) : null}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <ActionButton
          disabled={loading || busy}
          label={
            presentation.groupCount > 0
              ? ko.onboarding.firstResultCta
              : ko.onboarding.firstResultEmptyCta
          }
          onPress={() => void continueToApp()}
        />
      </View>
    </SafeAreaView>
  );
}

function EvidenceThumb({ item }: { item: ScreenshotItem }) {
  const media = presentScreenshotMedia(item, { resolveBundled: getMockPhotoSource });
  if (media.kind !== "bundled" && media.kind !== "device") return null;
  const source = item.source.appName ?? item.source.domain ?? "출처 미상";

  return (
    <View style={styles.thumbFrame}>
      <Image
        accessibilityLabel={`${source}에서 캡처한 ${item.analysis?.title ?? "스크린샷"}`}
        contentFit="contain"
        source={media.source}
        style={styles.thumbImage}
      />
    </View>
  );
}

function Outcome({ label, sentence }: { label: string; sentence: string }) {
  return (
    <View style={styles.outcome}>
      <Text style={styles.outcomeLabel}>{label}</Text>
      <Text style={styles.outcomeSentence}>{sentence}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.color.canvas },
  topBar: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    minHeight: tokens.size.touchTarget,
    paddingHorizontal: tokens.layout.screenPadding,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultLabel: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
    fontWeight: "600",
  },
  stateWrap: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    flex: 1,
    paddingHorizontal: tokens.layout.screenPadding,
    justifyContent: "center",
    alignSelf: "center",
  },
  scrollContent: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    gap: tokens.space[8],
    paddingHorizontal: tokens.layout.screenPadding,
    paddingTop: tokens.space[6],
    paddingBottom: tokens.space[8],
    alignSelf: "center",
  },
  introCopy: { gap: tokens.space[3] },
  displayTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.display.fontSize,
    lineHeight: tokens.typography.display.lineHeight,
    fontWeight: "800",
    letterSpacing: tokens.typography.display.letterSpacing,
  },
  lead: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
  memoryConnection: { gap: tokens.space[3] },
  dateRow: {
    paddingHorizontal: tokens.space[2],
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateLabel: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    fontWeight: "600",
  },
  screenshotRow: { flexDirection: "row", gap: tokens.space[2] },
  thumbFrame: {
    flex: 1,
    height: 250,
    overflow: "hidden",
    borderWidth: tokens.layout.hairline,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.surface,
  },
  thumbImage: { width: "100%", height: "100%" },
  connectionRail: {
    height: tokens.space[4],
    alignItems: "center",
    justifyContent: "center",
  },
  connectionLine: {
    position: "absolute",
    right: tokens.space[6],
    left: tokens.space[6],
    height: tokens.layout.signalLine,
    backgroundColor: tokens.color.primary,
  },
  connectionPoint: {
    width: tokens.space[3],
    height: tokens.space[3],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.signal,
  },
  outcomes: { gap: tokens.space[6] },
  outcome: { gap: tokens.space[2] },
  outcomeLabel: {
    color: tokens.color.primary,
    fontSize: tokens.typography.label.fontSize,
    lineHeight: tokens.typography.label.lineHeight,
    fontWeight: "700",
  },
  outcomeSentence: {
    color: tokens.color.ink,
    fontSize: tokens.typography.sectionTitle.fontSize,
    lineHeight: tokens.typography.sectionTitle.lineHeight,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  error: {
    color: tokens.color.danger,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  footer: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    paddingHorizontal: tokens.layout.screenPadding,
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[3],
    alignSelf: "center",
    backgroundColor: tokens.color.canvas,
  },
});
