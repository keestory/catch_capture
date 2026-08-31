import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Intent, ScreenshotGroup, ScreenshotItem } from "@/contracts/domain";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";
import { presentGroupSummary } from "@/domain/summary-presentation";
import { intentDestinationLabel } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

import { IntentChip } from "./intent-chip";
import { ScreenshotVisual } from "./screenshot-card";
import { SummaryBlock } from "./summary-block";

interface GroupTrayProps {
  group: ScreenshotGroup;
  items: ScreenshotItem[];
  busy?: boolean;
  showApprove?: boolean;
  onApproveAll?: (intent: Intent) => void;
  onReviewIndividually?: () => void;
  onChangeIntent?: () => void;
  approveLabel?: string;
  featured?: boolean;
  indexLabel?: string;
}

export function GroupTray({
  group,
  items,
  busy = false,
  showApprove = true,
  onApproveAll,
  onReviewIndividually,
  onChangeIntent,
  approveLabel,
  featured = false,
  indexLabel,
}: GroupTrayProps) {
  const visibleItems = items.slice(0, 2);
  const selectedIntent = group.reviewIntent ?? group.suggestedIntent;
  const summary = presentGroupSummary(group, items);
  const protectedGroup = items.some(isScreenshotSensitive);
  const displayTitle = protectedGroup ? "민감한 내용이 포함된 묶음" : group.title;
  const displaySource = protectedGroup
    ? "내용과 출처를 가렸어요."
    : `${items.length}장 · ${items.map((item) => item.source.appName).filter(Boolean)[0] ?? "출처 혼합"}`;
  return (
    <View style={[styles.card, featured && styles.cardFeatured]}>
      <View style={styles.kickerRow}>
        <Text style={styles.kicker}>{indexLabel ?? "묶음 제안"}</Text>
        <Text style={styles.itemCount}>{items.length}장</Text>
      </View>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.metadata}>{displaySource}</Text>
        </View>
        <IntentChip intent={selectedIntent} compact suggested={!group.reviewIntent} />
      </View>

      {summary ? <SummaryBlock presentation={summary} variant="group" /> : null}

      <View accessibilityElementsHidden style={[styles.stack, featured && styles.stackFeatured]}>
        {visibleItems.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.thumbnail,
              featured && styles.thumbnailFeatured,
              {
                left: index * (featured ? 92 : 80),
              },
            ]}
          >
            <ScreenshotVisual compact={!featured} item={item} />
          </View>
        ))}
        {items.length > 2 ? (
          <View style={styles.moreBadge}>
            <Text style={styles.moreText}>+{items.length - 2}</Text>
          </View>
        ) : null}
      </View>

      {showApprove && onApproveAll ? (
        <Pressable
          accessibilityLabel={approveLabel ?? `모두 ${intentDestinationLabel[selectedIntent]} 보관`}
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy }}
          disabled={busy}
          onPress={() => onApproveAll(selectedIntent)}
          style={({ pressed }) => [styles.approve, (pressed || busy) && styles.approvePressed]}
        >
          <Text style={styles.approveText}>
            {busy
              ? "보관하는 중…"
              : (approveLabel ?? `모두 ${intentDestinationLabel[selectedIntent]} 보관`)}
          </Text>
        </Pressable>
      ) : null}
      {onReviewIndividually || onChangeIntent ? (
        <View style={styles.exceptionActions}>
          {onReviewIndividually ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={onReviewIndividually}
              style={({ pressed }) => [styles.exceptionAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.exceptionText}>하나씩 확인</Text>
            </Pressable>
          ) : null}
          {onChangeIntent ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={onChangeIntent}
              style={({ pressed }) => [styles.exceptionAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.exceptionText}>분류 바꾸기</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    gap: tokens.space[4],
    padding: tokens.space[5],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surface,
  },
  cardFeatured: {
    borderColor: tokens.color.lineStrong,
    backgroundColor: tokens.color.surface,
  },
  kickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.eyebrow.fontSize,
    lineHeight: tokens.typography.eyebrow.lineHeight,
    fontWeight: "800",
    letterSpacing: 0,
  },
  itemCount: {
    color: tokens.color.inkTertiary,
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    fontWeight: "700",
    letterSpacing: 0,
    fontVariant: ["tabular-nums"],
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: tokens.space[3] },
  headerCopy: { flex: 1, gap: tokens.space[1] },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.typography.cardTitle.fontSize,
    lineHeight: tokens.typography.cardTitle.lineHeight,
    fontWeight: "800",
  },
  metadata: { color: tokens.color.inkSecondary, fontSize: 13, lineHeight: 18 },
  stack: { position: "relative", height: 144 },
  stackFeatured: { height: 190 },
  thumbnail: {
    position: "absolute",
    top: 0,
    width: 112,
    height: 144,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surface,
  },
  thumbnailFeatured: { width: 132, height: 188 },
  moreBadge: {
    position: "absolute",
    right: 0,
    top: 52,
    minWidth: tokens.size.touchTarget,
    minHeight: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.ink,
  },
  moreText: { color: tokens.color.surface, fontSize: 12, fontWeight: "700" },
  approve: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space[4],
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.primary,
  },
  approvePressed: { backgroundColor: tokens.color.primaryPressed, opacity: 0.82 },
  approveText: { color: tokens.color.surface, fontSize: 15, fontWeight: "700" },
  exceptionActions: { flexDirection: "row", gap: tokens.space[2] },
  exceptionAction: {
    flex: 1,
    minHeight: tokens.size.touchTarget,
    paddingHorizontal: tokens.space[3],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.color.lineStrong,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surface,
  },
  actionPressed: { opacity: 0.72 },
  exceptionText: { color: tokens.color.ink, fontSize: 13, fontWeight: "700", textAlign: "center" },
});
