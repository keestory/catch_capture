import { useState } from "react";
import { Image } from "expo-image";
import { DeviceMobileIcon } from "phosphor-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ScreenshotItem } from "@/contracts/domain";
import { getMockPhotoSource } from "@/data/mock-photo-assets";
import type { CuriosityDashboardPresentation } from "@/domain/curiosity-dashboard-presentation";
import { presentScreenshotMedia } from "@/domain/screenshot-media-presentation";
import { tokens } from "@/theme/tokens";

function RhythmThumbnail({ item }: { item: ScreenshotItem }) {
  const [failed, setFailed] = useState(false);
  const media = presentScreenshotMedia(item, { resolveBundled: getMockPhotoSource });
  const source = media.kind === "bundled" || media.kind === "device" ? media.source : undefined;

  if (!source || failed) {
    return <View accessibilityElementsHidden aria-hidden style={styles.thumbnailFallback} />;
  }

  return (
    <Image
      accessibilityLabel={item.analysis?.title ?? "스크린샷"}
      contentFit="cover"
      onError={() => setFailed(true)}
      source={source}
      style={styles.thumbnail}
    />
  );
}

export function CuriosityDashboard({
  presentation,
  items,
  onOpenReview,
  reviewDisabled = false,
  starting = false,
}: {
  presentation: CuriosityDashboardPresentation;
  items: ScreenshotItem[];
  onOpenReview(): void;
  reviewDisabled?: boolean;
  starting?: boolean;
}) {
  const itemById = new Map(items.map((item) => [item.id, item]));

  return (
    <View style={styles.dashboard}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.wordmark}>
          ECHO
        </Text>
        <View accessibilityLabel="기기 안에서 처리" style={styles.onDevice}>
          <DeviceMobileIcon color={tokens.color.inkSecondary} size={17} weight="regular" />
          <Text style={styles.onDeviceText}>기기 내 처리</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.date}>{presentation.dateLabel}</Text>
        <Text style={styles.heroTitle}>그냥 지나치지 않은 장면</Text>
        <View
          accessibilityLabel={`Echo에 들어온 캡처 ${presentation.totalCaptured}장`}
          style={styles.totalRow}
        >
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={1}
            style={styles.totalNumber}
          >
            {presentation.totalCaptured.toLocaleString("ko-KR")}
          </Text>
          <Text style={styles.totalUnit}>장</Text>
        </View>
        <Text style={styles.heroBody}>당신의 호기심은 이렇게 쌓였어요.</Text>
      </View>

      <View style={styles.metricRow}>
        <View
          accessible
          accessibilityLabel={`나중에 다시 연 캡처 ${presentation.reopenedCount}장`}
          style={styles.metric}
        >
          <Text style={styles.metricLabel}>나중에 다시 연 캡처</Text>
          <Text style={styles.metricValue}>
            {presentation.reopenedCount.toLocaleString("ko-KR")}장
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View
          accessible
          accessibilityLabel={`다시 보고 남긴 캡처 ${presentation.retainedAfterReviewCount}장`}
          style={styles.metric}
        >
          <Text style={styles.metricLabel}>다시 보고 남긴 캡처</Text>
          <Text style={styles.metricValue}>
            {presentation.retainedAfterReviewCount.toLocaleString("ko-KR")}장
          </Text>
        </View>
      </View>

      <View style={styles.rhythmSection}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          이번 주의 캡처 리듬
        </Text>
        <View style={styles.week}>
          {presentation.week.map((day) => (
            <View
              accessibilityLabel={`${day.weekday}요일, 캡처 ${day.count}장${day.isToday ? ", 오늘" : ""}`}
              key={day.dateKey}
              style={[styles.day, day.isToday && styles.dayToday]}
            >
              <Text style={[styles.weekday, day.isToday && styles.todayText]}>{day.weekday}</Text>
              <Text style={[styles.dayCount, day.isToday && styles.todayText]}>
                {day.count === 0 ? "—" : day.count}
              </Text>
              <View style={[styles.todayMarker, !day.isToday && styles.todayMarkerHidden]} />
              <View style={styles.thumbnailStack}>
                {day.itemIds.map((itemId, index) => {
                  const item = itemById.get(itemId);
                  return item ? (
                    <RhythmThumbnail item={item} key={`${day.dateKey}-${itemId}-${index}`} />
                  ) : null;
                })}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View
        accessibilityLabel={`최근 7일 하루 평균 ${presentation.recentWeekAverage}장, 최근 30일 하루 평균 ${presentation.recentMonthAverage}장`}
        style={styles.averageRow}
      >
        <Text style={styles.averageText}>
          최근 7일 하루 {presentation.recentWeekAverage.toFixed(1)}장
        </Text>
        <Text style={styles.averageDot}>·</Text>
        <Text style={styles.averageText}>
          최근 30일 하루 {presentation.recentMonthAverage.toFixed(1)}장
        </Text>
      </View>

      <Pressable
        accessibilityHint="비슷한 캡처 묶음을 열어 한 번에 정리합니다"
        accessibilityLabel={starting ? "오늘의 정리를 여는 중" : "오늘의 캡처 정리 열기"}
        accessibilityRole="button"
        accessibilityState={{ busy: starting, disabled: reviewDisabled }}
        disabled={reviewDisabled}
        onPress={onOpenReview}
        style={({ pressed }) => [
          styles.reviewButton,
          pressed && !reviewDisabled && styles.reviewButtonPressed,
          reviewDisabled && styles.reviewButtonDisabled,
        ]}
      >
        <Text style={styles.reviewButtonText}>
          {starting ? "정리 여는 중…" : "오늘의 캡처 정리"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboard: { gap: 0, paddingBottom: tokens.space[8] },
  header: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wordmark: { color: tokens.color.ink, fontSize: 17, fontWeight: "900", letterSpacing: 4 },
  onDevice: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6 },
  onDeviceText: { color: tokens.color.inkSecondary, fontSize: 13, fontWeight: "600" },
  hero: { paddingTop: tokens.space[6], paddingBottom: tokens.space[5] },
  date: { color: tokens.color.ink, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  heroTitle: {
    marginTop: tokens.space[3],
    color: tokens.color.ink,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
  },
  totalRow: { minHeight: 104, flexDirection: "row", alignItems: "flex-end" },
  totalNumber: {
    color: tokens.color.ink,
    fontSize: 88,
    lineHeight: 100,
    fontWeight: "400",
    letterSpacing: -5,
  },
  totalUnit: {
    marginLeft: 8,
    marginBottom: 13,
    color: tokens.color.ink,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "500",
  },
  heroBody: {
    marginTop: tokens.space[2],
    color: tokens.color.inkSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  metricRow: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.color.line,
  },
  metric: { flex: 1, gap: 6, paddingVertical: tokens.space[4] },
  metricDivider: {
    width: 1,
    height: 44,
    marginHorizontal: tokens.space[4],
    backgroundColor: tokens.color.line,
  },
  metricLabel: {
    color: tokens.color.inkSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  metricValue: { color: tokens.color.ink, fontSize: 24, lineHeight: 30, fontWeight: "600" },
  rhythmSection: { paddingTop: tokens.space[5] },
  sectionTitle: { color: tokens.color.ink, fontSize: 17, lineHeight: 24, fontWeight: "800" },
  week: { minHeight: 330, marginTop: tokens.space[3], flexDirection: "row" },
  day: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 3,
    borderRightWidth: 1,
    borderRightColor: tokens.color.line,
  },
  dayToday: { backgroundColor: tokens.color.primarySoft },
  weekday: { color: tokens.color.inkSecondary, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  dayCount: {
    marginTop: 4,
    color: tokens.color.ink,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
  todayText: { color: tokens.color.primary },
  todayMarker: {
    width: 30,
    height: 3,
    marginTop: 6,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
  },
  todayMarkerHidden: { opacity: 0 },
  thumbnailStack: { width: "100%", marginTop: tokens.space[2], gap: 2 },
  thumbnail: {
    width: "100%",
    height: 44,
    borderRadius: 2,
    backgroundColor: tokens.color.surfaceMuted,
  },
  thumbnailFallback: {
    width: "100%",
    height: 44,
    borderRadius: 2,
    backgroundColor: tokens.color.surfaceMuted,
  },
  averageRow: {
    minHeight: 48,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.color.line,
  },
  averageText: { color: tokens.color.inkSecondary, fontSize: 12, lineHeight: 18 },
  averageDot: { color: tokens.color.inkTertiary, fontSize: 12 },
  reviewButton: {
    minHeight: 52,
    marginTop: tokens.space[5],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
  },
  reviewButtonPressed: { backgroundColor: tokens.color.primaryPressed },
  reviewButtonDisabled: { opacity: 0.42 },
  reviewButtonText: { color: tokens.color.surface, fontSize: 15, fontWeight: "800" },
});
