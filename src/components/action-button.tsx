import { Pressable, StyleSheet, Text } from "react-native";

import { tokens } from "@/theme/tokens";

type ActionButtonVariant = "primary" | "secondary" | "quiet" | "danger";

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ActionButtonVariant;
  disabled?: boolean;
  accessibilityHint?: string;
}

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  accessibilityHint,
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    paddingHorizontal: tokens.space[5],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.card,
  },
  primary: { backgroundColor: tokens.color.primary },
  secondary: {
    borderWidth: 1,
    borderColor: tokens.color.lineStrong,
    backgroundColor: tokens.color.surface,
  },
  danger: {
    borderWidth: 1,
    borderColor: tokens.color.danger,
    backgroundColor: tokens.color.surface,
  },
  quiet: { backgroundColor: "transparent" },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.42 },
  label: {
    fontSize: tokens.typography.bodyStrong.fontSize,
    lineHeight: tokens.typography.bodyStrong.lineHeight,
    fontWeight: "700",
    textAlign: "center",
  },
  primaryLabel: { color: tokens.color.surface },
  secondaryLabel: { color: tokens.color.ink },
  dangerLabel: { color: tokens.color.danger },
  quietLabel: { color: tokens.color.inkSecondary },
});
