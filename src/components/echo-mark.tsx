import { StyleSheet, View } from "react-native";

import { tokens } from "@/theme/tokens";

interface EchoMarkProps {
  inverse?: boolean;
  size?: "small" | "medium";
}

export function EchoMark({ inverse = false, size = "small" }: EchoMarkProps) {
  const dimension = size === "medium" ? 36 : 24;
  const core = size === "medium" ? 14 : 9;
  const ringColor = inverse ? tokens.color.surface : tokens.color.primary;

  return (
    <View
      accessibilityElementsHidden
      aria-hidden
      style={[styles.mark, { height: dimension, width: dimension }]}
    >
      <View
        style={[styles.ring, { borderColor: ringColor, height: dimension, width: dimension }]}
      />
      <View
        style={[
          styles.gap,
          {
            backgroundColor: inverse ? tokens.color.brandAsset.orbitNight : tokens.color.canvas,
            height: dimension * 0.36,
            width: dimension * 0.34,
          },
        ]}
      />
      <View
        style={[
          styles.core,
          {
            backgroundColor: inverse ? tokens.color.signal : tokens.color.ink,
            height: core,
            width: core,
          },
        ]}
      />
      <View style={[styles.signal, { backgroundColor: tokens.color.signal }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: "center", justifyContent: "center", position: "relative" },
  ring: { position: "absolute", borderWidth: 2, borderRadius: tokens.radius.pill },
  gap: { position: "absolute", right: -2, top: "18%", transform: [{ rotate: "-24deg" }] },
  core: { borderRadius: tokens.radius.pill },
  signal: {
    width: 5,
    height: 5,
    position: "absolute",
    right: -1,
    top: "44%",
    borderRadius: tokens.radius.pill,
  },
});
