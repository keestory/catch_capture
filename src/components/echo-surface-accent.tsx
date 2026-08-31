import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

import { tokens } from "@/theme/tokens";

interface EchoSurfaceAccentProps {
  style?: StyleProp<ViewStyle>;
  variant: "orbit" | "rail";
}

export function EchoSurfaceAccent({ style, variant }: EchoSurfaceAccentProps) {
  if (variant === "rail") {
    return (
      <View
        accessibilityElementsHidden
        accessible={false}
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.rail, style]}
      >
        <View style={[styles.railSegment, styles.railAqua]} />
        <View style={[styles.railSegment, styles.railViolet]} />
        <View style={[styles.railSegment, styles.railPeach]} />
      </View>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.orbitRoot, style]}
    >
      <View style={styles.orbitOuter} />
      <View style={styles.orbitInner} />
      <View style={styles.orbitCore} />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    pointerEvents: "none",
    width: 72,
    height: 3,
    flexDirection: "row",
    overflow: "hidden",
    gap: 3,
    borderRadius: tokens.radius.pill,
  },
  railSegment: { height: 3, borderRadius: tokens.radius.pill },
  railAqua: { width: 30, backgroundColor: tokens.color.echoSurface.reflectionAqua },
  railViolet: { width: 22, backgroundColor: tokens.color.echoSurface.reflectionViolet },
  railPeach: { width: 14, backgroundColor: tokens.color.echoSurface.reflectionPeach },
  orbitRoot: { width: 48, height: 48, position: "relative", pointerEvents: "none" },
  orbitOuter: {
    width: 48,
    height: 48,
    position: "absolute",
    borderWidth: 1.5,
    borderColor: tokens.color.echoSurface.reflectionAqua,
    borderRightColor: "transparent",
    borderRadius: tokens.radius.pill,
    transform: [{ rotate: "-22deg" }],
  },
  orbitInner: {
    width: 32,
    height: 32,
    position: "absolute",
    top: 8,
    left: 8,
    borderWidth: 1,
    borderColor: tokens.color.echoSurface.reflectionViolet,
    borderBottomColor: "transparent",
    borderRadius: tokens.radius.pill,
    transform: [{ rotate: "18deg" }],
  },
  orbitCore: {
    width: 10,
    height: 10,
    position: "absolute",
    top: 19,
    left: 19,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.echoSurface.reflectionPeach,
  },
});
