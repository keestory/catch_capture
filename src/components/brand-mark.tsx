import { StyleSheet, Text, View } from "react-native";

import { tokens } from "@/theme/tokens";

import { EchoMark } from "./echo-mark";

interface BrandMarkProps {
  inverse?: boolean;
  compact?: boolean;
  showGlyph?: boolean;
}

export function BrandMark({ inverse = false, compact = false, showGlyph = true }: BrandMarkProps) {
  const ink = inverse ? tokens.color.surface : tokens.color.ink;
  return (
    <View accessibilityLabel="Echo, 개인 캡처 아카이브" style={styles.row}>
      {showGlyph ? <EchoMark inverse={inverse} /> : null}
      <View style={styles.copy}>
        <Text style={[styles.name, { color: ink }, compact && styles.nameCompact]}>ECHO</Text>
        {!compact ? <Text style={styles.descriptor}>PRIVATE RECALL</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: tokens.space[2] },
  copy: { gap: 1 },
  name: { fontSize: 15, lineHeight: 17, fontWeight: "900", letterSpacing: 1.8 },
  nameCompact: { fontSize: 13, lineHeight: 15 },
  descriptor: {
    color: tokens.color.inkSecondary,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "700",
    letterSpacing: 1.25,
  },
});
