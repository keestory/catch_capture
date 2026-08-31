import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/theme/tokens";

import { BrandMark } from "./brand-mark";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  showBrandGlyph?: boolean;
}

export function ScreenHeader({
  eyebrow,
  title,
  actionLabel,
  onAction,
  showBrandGlyph = true,
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.masthead}>
        <BrandMark compact showGlyph={showBrandGlyph} />
        {actionLabel && onAction ? (
          <Pressable
            accessibilityLabel={actionLabel}
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionText}>•••</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: tokens.space[4] },
  masthead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  copy: {
    flex: 1,
    gap: tokens.space[1],
  },
  eyebrow: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.eyebrow.fontSize,
    lineHeight: tokens.typography.eyebrow.lineHeight,
    fontWeight: "800",
    letterSpacing: 0,
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.typography.screenTitle.fontSize,
    lineHeight: tokens.typography.screenTitle.lineHeight,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  action: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: tokens.size.touchTarget,
    minHeight: tokens.size.touchTarget,
    borderWidth: tokens.layout.hairline,
    borderColor: tokens.color.lineStrong,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surface,
  },
  actionPressed: { backgroundColor: tokens.color.surfaceMuted },
  actionText: { color: tokens.color.ink, fontSize: 13, fontWeight: "800", letterSpacing: 2 },
});
