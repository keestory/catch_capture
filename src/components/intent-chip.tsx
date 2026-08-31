import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Intent } from "@/contracts/domain";
import { intentLabel } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

import { IntentIcon, SelectionCheckIcon } from "./intent-icon";

interface IntentChipProps {
  intent: Intent;
  count?: number;
  selected?: boolean;
  compact?: boolean;
  suggested?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  role?: "button" | "radio";
}

export function IntentChip({
  intent,
  count,
  selected = false,
  compact = false,
  suggested = false,
  onPress,
  accessibilityLabel,
  role = "button",
}: IntentChipProps) {
  const palette = tokens.color.intent[intent];
  const labelColor = selected ? tokens.color.ink : tokens.color.inkSecondary;
  const content = (
    <>
      <IntentIcon color={palette.text} intent={intent} size={compact ? 16 : 18} />
      <Text style={[styles.label, { color: labelColor }]}>{intentLabel[intent]}</Text>
      {typeof count === "number" ? (
        <Text style={[styles.count, { color: labelColor }]}>{count}</Text>
      ) : null}
      {suggested && !selected ? <Text style={styles.suggestedText}>제안</Text> : null}
      {selected ? <SelectionCheckIcon color={tokens.color.ink} /> : null}
    </>
  );

  const style = [
    styles.base,
    compact && styles.compact,
    compact && onPress && styles.compactInteractive,
    selected && styles.selected,
  ];

  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      accessibilityLabel={
        accessibilityLabel ??
        `${intentLabel[intent]}${typeof count === "number" ? ` ${count}장` : ""} 필터${selected ? ", 선택됨" : ""}`
      }
      accessibilityRole={role}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: tokens.size.touchTarget,
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.screenshotCard,
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: tokens.color.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[1],
  },
  compact: { minHeight: 36, paddingHorizontal: tokens.space[2] },
  compactInteractive: { minHeight: tokens.size.touchTarget },
  selected: {
    borderColor: tokens.color.ink,
    borderWidth: 1.5,
    backgroundColor: tokens.color.surfaceMuted,
  },
  pressed: { backgroundColor: tokens.color.surfaceMuted },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "700" },
  count: { marginLeft: tokens.space[1], fontSize: 12, fontVariant: ["tabular-nums"] },
  suggestedText: {
    marginLeft: tokens.space[1],
    color: tokens.color.inkTertiary,
    fontSize: 9,
    fontWeight: "700",
  },
});
