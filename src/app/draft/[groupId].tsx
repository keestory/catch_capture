import { useMemo } from "react";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { AppScreen } from "@/components/app-screen";
import { MockScreenshotScene } from "@/components/mock-screenshot-scene";
import { StatePanel } from "@/components/state-panel";
import type { ScreenshotItem } from "@/contracts/domain";
import { useAppData } from "@/data/app-data-provider";
import { getMockPhotoSource } from "@/data/mock-photo-assets";
import { presentScreenshotMedia } from "@/domain/screenshot-media-presentation";
import { buildThirdSignalSuggestions } from "@/domain/third-signal-policy";
import { presentThirdSignal } from "@/domain/third-signal-presentation";
import { ko } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

export default function ActionDraftScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { allGroups, items, loading } = useAppData();
  const suggestion = useMemo(
    () =>
      buildThirdSignalSuggestions({
        items,
        groups: allGroups.filter((group) => group.id === groupId),
        now: new Date().toISOString(),
      })[0],
    [allGroups, groupId, items],
  );
  const group = allGroups.find((candidate) => candidate.id === groupId);
  const selectedItems = suggestion
    ? suggestion.itemIds
        .map((itemId) => items.find((item) => item.id === itemId))
        .filter((item): item is ScreenshotItem => Boolean(item))
    : [];

  if (loading) {
    return (
      <AppScreen>
        <StatePanel
          description="관련 캡처 세 장과 정리한 내용을 준비하고 있어요."
          kind="loading"
          title="초안을 여는 중"
        />
      </AppScreen>
    );
  }
  if (!suggestion || !group || selectedItems.length !== suggestion.itemIds.length) {
    return (
      <AppScreen>
        <DraftTopBar onBack={() => router.back()} />
        <StatePanel
          actionLabel={ko.thirdSignal.draftBack}
          description={ko.thirdSignal.draftMissingBody}
          kind="empty"
          onAction={() => router.replace("/(tabs)")}
          title={ko.thirdSignal.draftMissingTitle}
        />
      </AppScreen>
    );
  }

  const copy = presentThirdSignal(suggestion);
  return (
    <AppScreen testID="action-draft-screen">
      <DraftTopBar onBack={() => router.back()} />
      <View style={styles.intro}>
        <Text style={styles.label}>{ko.thirdSignal.draftLabel}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.lead}>{copy.reason}</Text>
      </View>

      <View style={styles.triptych}>
        {selectedItems.map((item) => (
          <DraftMedia item={item} key={item.id} />
        ))}
      </View>

      <View style={styles.summaryBlock}>
        <Text style={styles.sectionLabel}>{ko.thirdSignal.draftReasonLabel}</Text>
        <Text style={styles.summary}>{group.summary ?? group.reason}</Text>
        {group.reason ? <Text style={styles.evidence}>{group.reason}</Text> : null}
      </View>

      <View style={styles.itemSection}>
        <Text style={styles.sectionLabel}>{ko.thirdSignal.draftItemsLabel}</Text>
        {selectedItems.map((item, index) => (
          <Pressable
            accessibilityHint="캡처 상세를 엽니다"
            accessibilityRole="button"
            key={item.id}
            onPress={() => router.push(`/item/${item.id}`)}
            style={({ pressed }) => [styles.itemRow, pressed && styles.itemPressed]}
          >
            <Text style={styles.itemIndex}>{String(index + 1).padStart(2, "0")}</Text>
            <View style={styles.itemCopy}>
              <Text numberOfLines={1} style={styles.itemTitle}>
                {item.analysis?.title ?? "캡처"}
              </Text>
              <Text numberOfLines={2} style={styles.itemSummary}>
                {item.analysis?.summary ?? "원본 화면에서 내용을 확인할 수 있어요."}
              </Text>
            </View>
            <Text accessibilityElementsHidden style={styles.arrow}>
              ›
            </Text>
          </Pressable>
        ))}
      </View>

      <ActionButton label={ko.thirdSignal.draftBack} onPress={() => router.replace("/(tabs)")} />
    </AppScreen>
  );
}

function DraftTopBar({ onBack }: { onBack(): void }) {
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityLabel="이전 화면"
        accessibilityRole="button"
        onPress={onBack}
        style={styles.back}
      >
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <Text style={styles.brand}>ECHO</Text>
      <View style={styles.back} />
    </View>
  );
}

function DraftMedia({ item }: { item: ScreenshotItem }) {
  const media = presentScreenshotMedia(item, { resolveBundled: getMockPhotoSource });
  return (
    <View style={styles.mediaPanel}>
      {media.kind === "bundled" || media.kind === "device" ? (
        <Image
          accessibilityLabel={item.analysis?.title ?? "캡처"}
          contentFit="contain"
          source={media.source}
          style={styles.mediaImage}
        />
      ) : media.kind === "scene" ? (
        <MockScreenshotScene item={item} />
      ) : (
        <View style={styles.mediaUnavailable} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    minHeight: tokens.size.touchTarget,
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
  brand: { color: tokens.color.ink, fontSize: 13, fontWeight: "900", letterSpacing: 2.2 },
  intro: { gap: tokens.space[2] },
  label: {
    color: tokens.color.primary,
    fontSize: tokens.typography.eyebrow.fontSize,
    lineHeight: tokens.typography.eyebrow.lineHeight,
    fontWeight: "800",
    letterSpacing: tokens.typography.eyebrow.letterSpacing,
  },
  title: {
    color: tokens.color.ink,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.9,
  },
  lead: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
  triptych: {
    height: 360,
    overflow: "hidden",
    flexDirection: "row",
    gap: tokens.space[2],
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.surfaceMuted,
  },
  mediaPanel: { flex: 1, overflow: "hidden", backgroundColor: tokens.color.surface },
  mediaImage: { width: "100%", height: "100%" },
  mediaUnavailable: { flex: 1, backgroundColor: tokens.color.surfaceMuted },
  summaryBlock: {
    gap: tokens.space[2],
    paddingVertical: tokens.space[5],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.color.lineStrong,
  },
  sectionLabel: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
    fontWeight: "800",
  },
  summary: {
    color: tokens.color.ink,
    fontSize: tokens.typography.bodyStrong.fontSize,
    lineHeight: tokens.typography.bodyStrong.lineHeight,
    fontWeight: "700",
  },
  evidence: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  itemSection: { gap: 0 },
  itemRow: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.line,
  },
  itemPressed: { opacity: 0.62 },
  itemIndex: { color: tokens.color.inkSecondary, fontSize: 11, fontWeight: "800" },
  itemCopy: { flex: 1, gap: tokens.space[1] },
  itemTitle: { color: tokens.color.ink, fontSize: 15, fontWeight: "800" },
  itemSummary: { color: tokens.color.inkSecondary, fontSize: 12, lineHeight: 17 },
  arrow: { color: tokens.color.inkSecondary, fontSize: 22 },
});
