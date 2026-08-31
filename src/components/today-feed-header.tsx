import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { Intent } from "@/contracts/domain";
import { intentLabel } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

import { BrandMark } from "./brand-mark";
import { IntentIcon } from "./intent-icon";

interface TodayFeedHeaderProps {
  actionLabel: string;
  dateLabel: string;
  disabled: boolean;
  groupCount: number;
  intentCounts: Record<Intent, number>;
  intents: Intent[];
  onStart: () => void;
  progressLabel: string;
  starting: boolean;
}

export function TodayFeedHeader({
  actionLabel,
  dateLabel,
  disabled,
  groupCount,
  intentCounts,
  intents,
  onStart,
  progressLabel,
  starting,
}: TodayFeedHeaderProps) {
  return (
    <View style={styles.header} testID="today-feed-header">
      <View style={styles.masthead}>
        <BrandMark compact showGlyph={false} />
        <Text style={styles.privateText}>▣ 기기 내 처리</Text>
      </View>

      <View style={styles.headlineRow}>
        <View style={styles.headlineCopy}>
          <Text style={styles.date}>{dateLabel}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            오늘 함께 볼 {groupCount}묶음
          </Text>
          <Text style={styles.progress}>{progressLabel}</Text>
        </View>
      </View>

      <Pressable
        accessibilityHint="묶음별 제안을 한 번에 확인합니다"
        accessibilityRole="button"
        accessibilityState={{ busy: starting, disabled }}
        disabled={disabled}
        onPress={onStart}
        style={({ pressed }) => [
          styles.startButton,
          pressed && !disabled && styles.startButtonPressed,
          disabled && styles.startButtonDisabled,
        ]}
      >
        <Text style={styles.startButtonText}>{starting ? "정리 여는 중…" : actionLabel}</Text>
        <Text accessibilityElementsHidden style={styles.startArrow}>
          ↗
        </Text>
      </Pressable>

      <ScrollView
        accessibilityLabel="오늘 캡처의 의도별 개수"
        contentContainerStyle={styles.intentRail}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {intents.map((intent) => {
          return (
            <View
              accessibilityLabel={`${intentLabel[intent]} ${intentCounts[intent]}장`}
              accessible
              key={intent}
              style={styles.intentStory}
            >
              <IntentIcon color={tokens.color.inkSecondary} intent={intent} size={14} />
              <Text numberOfLines={1} style={styles.intentStoryLabel}>
                {intentLabel[intent]} {intentCounts[intent]}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: tokens.space[3],
    paddingBottom: tokens.space[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.lineStrong,
  },
  masthead: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  privateText: { color: tokens.color.inkSecondary, fontSize: 10, fontWeight: "600" },
  headlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space[4],
  },
  headlineCopy: { flex: 1, minWidth: 0, gap: tokens.space[1] },
  date: { color: tokens.color.inkSecondary, fontSize: 11, lineHeight: 15, fontWeight: "600" },
  title: {
    color: tokens.color.ink,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  progress: { color: tokens.color.inkSecondary, fontSize: 13, lineHeight: 18 },
  startButton: {
    minHeight: 48,
    paddingHorizontal: tokens.space[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.primary,
  },
  startButtonPressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
  startButtonDisabled: { opacity: 0.42 },
  startButtonText: { color: tokens.color.surface, fontSize: 14, fontWeight: "800" },
  startArrow: { color: tokens.color.surface, fontSize: 17, fontWeight: "900" },
  intentRail: { gap: tokens.space[2], paddingRight: tokens.space[5] },
  intentStory: {
    minHeight: 34,
    paddingHorizontal: tokens.space[1],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[1],
  },
  intentStoryLabel: {
    color: tokens.color.inkSecondary,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },
});
