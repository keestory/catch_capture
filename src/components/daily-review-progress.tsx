import { StyleSheet, Text, View } from "react-native";

import { tokens } from "@/theme/tokens";

interface DailyReviewProgressProps {
  current: number;
  total: number;
  estimatedSecondsRemaining: number;
}

export function DailyReviewProgress({
  current,
  total,
  estimatedSecondsRemaining,
}: DailyReviewProgressProps) {
  const percentage = total === 0 ? 100 : Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <View
      accessibilityLabel={`${total}개 묶음 중 ${current}번째, 약 ${estimatedSecondsRemaining}초 남음`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: current, text: `${current} / ${total}` }}
      style={styles.container}
    >
      <View style={styles.copyRow}>
        <Text style={styles.progressText}>
          {current} / {total}
        </Text>
        <Text style={styles.remaining}>약 {estimatedSecondsRemaining}초 남음</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.space[2] },
  copyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressText: {
    color: tokens.color.ink,
    fontSize: tokens.typography.bodyStrong.fontSize,
    lineHeight: tokens.typography.bodyStrong.lineHeight,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  remaining: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  track: {
    height: 3,
    overflow: "hidden",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.line,
  },
  fill: { height: "100%", borderRadius: tokens.radius.pill, backgroundColor: tokens.color.primary },
});
