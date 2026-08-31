import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/theme/tokens";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  disabled?: boolean;
}

export function UndoToast({ message, onUndo, disabled = false }: UndoToastProps) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.toast}>
      <View style={styles.copy}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.detail}>기기 사진은 그대로예요.</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onUndo}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <Text style={styles.actionText}>실행 취소</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    minHeight: 64,
    paddingLeft: tokens.space[4],
    paddingRight: tokens.space[2],
    paddingVertical: tokens.space[2],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[3],
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.ink,
  },
  copy: { flex: 1, gap: tokens.space[1] },
  message: { color: tokens.color.surface, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  detail: { color: tokens.color.line, fontSize: 11, lineHeight: 15 },
  action: {
    minWidth: 76,
    minHeight: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.surface,
  },
  actionText: { color: tokens.color.ink, fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
