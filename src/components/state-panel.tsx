import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/theme/tokens";

type StateKind = "loading" | "empty" | "error" | "permission" | "offline";

interface StatePanelProps {
  kind: StateKind;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function StatePanel({ kind, title, description, actionLabel, onAction }: StatePanelProps) {
  const symbols: Record<StateKind, string> = {
    loading: "···",
    empty: "□",
    error: "!",
    permission: "○",
    offline: "↯",
  };

  return (
    <View accessibilityLiveRegion="polite" style={styles.panel}>
      {kind === "loading" ? (
        <ActivityIndicator color={tokens.color.primary} />
      ) : (
        <Text accessibilityElementsHidden style={styles.symbol}>
          {symbols[kind]}
        </Text>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
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
  panel: {
    minHeight: 240,
    padding: tokens.space[6],
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space[2],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.tray,
    backgroundColor: tokens.color.surfaceRaised,
  },
  symbol: { color: tokens.color.inkSecondary, fontSize: 28, fontWeight: "600" },
  title: {
    color: tokens.color.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: tokens.color.inkSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  action: {
    minHeight: tokens.size.touchTarget,
    marginTop: tokens.space[2],
    paddingHorizontal: tokens.space[4],
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.ink,
  },
  actionPressed: { opacity: 0.76 },
  actionText: { color: tokens.color.surface, fontSize: 14, fontWeight: "700" },
});
