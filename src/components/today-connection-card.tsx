import { useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import type { ScreenshotGroup, ScreenshotItem } from "@/contracts/domain";
import { presentTodayConnection } from "@/domain/today-connection-presentation";
import { tokens } from "@/theme/tokens";

import { IntentChip } from "./intent-chip";
import { ScreenshotVisual } from "./screenshot-card";

interface TodayConnectionCardProps {
  group: ScreenshotGroup;
  items: ScreenshotItem[];
  index: number;
  total: number;
  largeText?: boolean;
}

export function TodayConnectionCard({
  group,
  items,
  index,
  total,
  largeText = false,
}: TodayConnectionCardProps) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [failedMediaIds, setFailedMediaIds] = useState<string[]>([]);
  const pagerRef = useRef<ScrollView>(null);
  const {
    connectionReason,
    position,
    protectedGroup,
    representative,
    selectedIntent,
    source,
    title,
  } = presentTodayConnection(group, items, index, total);
  const contentWidth = Math.max(
    280,
    Math.min(width, tokens.layout.maxContentWidth) - tokens.layout.screenPadding * 2,
  );
  const mediaHeight = largeText ? 280 : 320;
  const mediaItems = protectedGroup ? [] : items;
  const capturedTime = representative
    ? new Date(representative.capturedAt).toLocaleTimeString("ko-KR", {
        hour: "numeric",
        minute: "2-digit",
      })
    : undefined;
  const headerAccessibilityLabel = protectedGroup
    ? `연결 ${position}/${total}, 보호된 캡처 ${items.length}장`
    : `연결 ${position}/${total}, ${source} 캡처 ${items.length}장${capturedTime ? `, ${capturedTime}` : ""}`;

  const handlePageChange = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (contentWidth <= 0) return;
    setPage(Math.round(event.nativeEvent.contentOffset.x / contentWidth));
  };

  const moveToPage = (nextPage: number) => {
    const boundedPage = Math.max(0, Math.min(nextPage, mediaItems.length - 1));
    pagerRef.current?.scrollTo({ animated: true, x: boundedPage * contentWidth });
    setPage(boundedPage);
  };

  const currentItem = mediaItems[page];
  const mediaAccessibilityLabel = protectedGroup
    ? "민감한 캡처 묶음, 이미지 기본 가림"
    : mediaItems.length > 0
      ? failedMediaIds.includes(currentItem?.id ?? "")
        ? `스크린샷 ${page + 1}/${mediaItems.length}, 이미지를 불러올 수 없음`
        : `스크린샷 ${page + 1}/${mediaItems.length}, ${currentItem?.analysis?.title ?? "저장한 화면"}`
      : "이미지를 불러올 수 없음";

  return (
    <View style={styles.post} testID={`today-connection-${position}`}>
      <View accessibilityLabel={headerAccessibilityLabel} accessible style={styles.postHeader}>
        <View style={[styles.sourceAvatar, protectedGroup && styles.sourceAvatarProtected]}>
          <Text style={styles.sourceAvatarText}>
            {protectedGroup ? "▣" : (source?.trim().slice(0, 1).toUpperCase() ?? "·")}
          </Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.positionText}>{`연결 ${position}/${total}`}</Text>
          <Text numberOfLines={1} style={styles.sourceText}>
            {protectedGroup
              ? `보호된 묶음 · ${items.length}장`
              : `${source} · ${items.length}장${capturedTime ? ` · ${capturedTime}` : ""}`}
          </Text>
        </View>
        <View style={styles.pageCountPill}>
          <Text
            style={styles.pageCountText}
          >{`${Math.min(page + 1, Math.max(items.length, 1))}/${Math.max(items.length, 1)}`}</Text>
        </View>
      </View>

      <View
        accessibilityActions={
          mediaItems.length > 1
            ? [
                { label: "이전 스크린샷", name: "decrement" },
                { label: "다음 스크린샷", name: "increment" },
              ]
            : undefined
        }
        accessibilityLabel={mediaAccessibilityLabel}
        accessibilityRole={mediaItems.length > 1 ? "adjustable" : "image"}
        accessibilityValue={
          mediaItems.length > 1
            ? {
                max: mediaItems.length,
                min: 1,
                now: page + 1,
                text: `${page + 1}/${mediaItems.length}`,
              }
            : undefined
        }
        accessible
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "increment") moveToPage(page + 1);
          if (event.nativeEvent.actionName === "decrement") moveToPage(page - 1);
        }}
        style={[styles.mediaFrame, { height: mediaHeight }]}
      >
        {protectedGroup ? (
          <View style={[styles.mediaPage, { width: contentWidth }]}>
            <View style={styles.protectedCover}>
              <Text style={styles.protectedIcon}>▣</Text>
              <Text style={styles.protectedTitle}>민감한 내용 · 기본 가림</Text>
              <Text style={styles.protectedBody}>이미지와 출처를 정리 전까지 숨겼어요.</Text>
            </View>
          </View>
        ) : mediaItems.length > 0 ? (
          <ScrollView
            bounces={false}
            decelerationRate="fast"
            horizontal
            onMomentumScrollEnd={handlePageChange}
            pagingEnabled
            ref={pagerRef}
            scrollEnabled={mediaItems.length > 1}
            showsHorizontalScrollIndicator={false}
          >
            {mediaItems.map((item) => (
              <View key={item.id} style={[styles.mediaPage, { width: contentWidth }]}>
                <ScreenshotVisual
                  feed
                  item={item}
                  onImageLoadError={() =>
                    setFailedMediaIds((current) =>
                      current.includes(item.id) ? current : [...current, item.id],
                    )
                  }
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.mediaPage, { width: contentWidth }]}>
            <View style={styles.unavailableCover}>
              <Text style={styles.unavailableTitle}>이미지를 불러올 수 없어요</Text>
              <Text style={styles.unavailableBody}>정리 화면에서 다시 확인해 주세요.</Text>
            </View>
          </View>
        )}
      </View>

      <View
        accessibilityElementsHidden
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        style={styles.pagerRow}
      >
        <View style={styles.pagerDots}>
          {Array.from({ length: Math.max(items.length, 1) }).map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[styles.pagerDot, dotIndex === page && styles.pagerDotActive]}
            />
          ))}
        </View>
        <Text style={styles.connectedCount}>{items.length}장의 연결</Text>
      </View>

      <View style={styles.postCopy}>
        <Text numberOfLines={largeText ? 3 : 2} style={styles.postTitle}>
          {title}
        </Text>
        {connectionReason ? (
          <View style={styles.reasonStrip}>
            <View style={styles.reasonCopy}>
              <Text style={styles.reasonLabel}>함께 묶인 이유</Text>
              <Text numberOfLines={largeText ? 3 : 2} style={styles.reasonText}>
                {connectionReason}
              </Text>
            </View>
          </View>
        ) : null}
        {selectedIntent ? (
          <View style={styles.intentRow}>
            <IntentChip compact intent={selectedIntent} />
            <Text style={styles.readOnlyText}>정리에서 확인</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  post: {
    width: "100%",
    gap: tokens.space[3],
    paddingBottom: tokens.space[7],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.line,
  },
  postHeader: {
    minHeight: tokens.size.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[3],
  },
  sourceAvatar: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.surface,
  },
  sourceAvatarProtected: {
    borderColor: tokens.color.lineStrong,
    backgroundColor: tokens.color.surfaceMuted,
  },
  sourceAvatarText: { color: tokens.color.ink, fontSize: 12, fontWeight: "900" },
  headerCopy: { flex: 1, minWidth: 0, gap: 1 },
  positionText: { color: tokens.color.ink, fontSize: 13, lineHeight: 18, fontWeight: "800" },
  sourceText: {
    color: tokens.color.inkSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
  },
  pageCountPill: {
    minWidth: 42,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space[2],
  },
  pageCountText: {
    color: tokens.color.inkSecondary,
    fontSize: 10,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  mediaFrame: {
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surfaceMuted,
  },
  mediaPage: { height: "100%", overflow: "hidden" },
  protectedCover: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space[2],
    padding: tokens.space[6],
    backgroundColor: tokens.color.surfaceMuted,
  },
  protectedIcon: { color: tokens.color.inkSecondary, fontSize: 28, fontWeight: "900" },
  protectedTitle: {
    color: tokens.color.ink,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  protectedBody: {
    color: tokens.color.inkSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  unavailableCover: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space[2],
    padding: tokens.space[6],
  },
  unavailableTitle: { color: tokens.color.ink, fontSize: 15, fontWeight: "800" },
  unavailableBody: { color: tokens.color.inkSecondary, fontSize: 12, lineHeight: 18 },
  pagerRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pagerDots: { flexDirection: "row", alignItems: "center", gap: 5 },
  pagerDot: {
    width: 5,
    height: 5,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.lineStrong,
  },
  pagerDotActive: { width: 14, backgroundColor: tokens.color.primary },
  connectedCount: { color: tokens.color.inkSecondary, fontSize: 11, fontWeight: "600" },
  postCopy: { gap: tokens.space[3] },
  postTitle: {
    color: tokens.color.ink,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "900",
    letterSpacing: -0.35,
  },
  reasonStrip: {
    minHeight: 52,
    paddingTop: tokens.space[3],
    borderTopWidth: 1,
    borderTopColor: tokens.color.line,
  },
  reasonCopy: { flex: 1, gap: 2 },
  reasonLabel: {
    color: tokens.color.inkSecondary,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },
  reasonText: {
    color: tokens.color.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  intentRow: {
    minHeight: tokens.size.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space[3],
  },
  readOnlyText: { color: tokens.color.inkSecondary, fontSize: 12, fontWeight: "700" },
});
