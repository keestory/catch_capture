import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/theme/tokens";

interface SectionHeadingProps {
  title: string;
  description?: string;
  index?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeading({
  title,
  description,
  index,
  actionLabel,
  onAction,
}: SectionHeadingProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {index ? <Text style={styles.index}>{index}</Text> : null}
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: tokens.space[3],
    paddingTop: tokens.space[3],
    borderTopWidth: 1,
    borderTopColor: tokens.color.line,
  },
  copy: { flex: 1, gap: tokens.space[1] },
  index: {
    color: tokens.color.inkTertiary,
    fontSize: tokens.typography.eyebrow.fontSize,
    lineHeight: tokens.typography.eyebrow.lineHeight,
    fontWeight: "800",
    letterSpacing: tokens.typography.eyebrow.letterSpacing,
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.typography.sectionTitle.fontSize,
    lineHeight: tokens.typography.sectionTitle.lineHeight,
    fontWeight: "700",
  },
  description: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  action: {
    minHeight: tokens.size.touchTarget,
    justifyContent: "center",
    paddingHorizontal: tokens.space[2],
  },
  actionPressed: { opacity: 0.6 },
  actionText: {
    color: tokens.color.primary,
    fontSize: tokens.typography.label.fontSize,
    lineHeight: tokens.typography.label.lineHeight,
    fontWeight: "700",
  },
});
