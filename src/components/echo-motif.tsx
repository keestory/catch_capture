import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

import { tokens } from "@/theme/tokens";

type EchoMotifVariant = "returning" | "core" | "trace";
type EchoMotifTone = "brand" | "functional" | "neutral";

interface EchoMotifProps {
  backgroundColor: string;
  showSignal?: boolean;
  size: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  tone?: EchoMotifTone;
  variant: EchoMotifVariant;
}

const palette = {
  brand: {
    ring: tokens.color.brandAsset.orbAqua,
    ringSecondary: tokens.color.brandAsset.orbViolet,
    core: tokens.color.brandAsset.orbSky,
    stripe: tokens.color.brandAsset.orbViolet,
    highlight: tokens.color.brandAsset.orbPeach,
    dot: tokens.color.signal,
  },
  functional: {
    ring: tokens.color.primary,
    ringSecondary: tokens.color.ink,
    core: tokens.color.primarySoft,
    stripe: tokens.color.primary,
    highlight: tokens.color.surfaceRaised,
    dot: tokens.color.signal,
  },
  neutral: {
    ring: tokens.color.lineStrong,
    ringSecondary: tokens.color.inkSecondary,
    core: tokens.color.surfaceMuted,
    stripe: tokens.color.inkSecondary,
    highlight: tokens.color.surface,
    dot: tokens.color.primary,
  },
} as const;

export function EchoMotif({
  backgroundColor,
  showSignal = true,
  size,
  style,
  testID,
  tone = "functional",
  variant,
}: EchoMotifProps) {
  const colors = palette[tone];
  const coreSize = variant === "core" ? size * 0.6 : size * 0.43;
  const ringSize = variant === "core" ? size * 0.9 : size;
  const innerRingSize = variant === "trace" ? size * 0.58 : size * 0.72;
  const stripeWidth = Math.max(2, coreSize * 0.1);
  const stripeOffsets = [-0.34, -0.17, 0, 0.17, 0.34];

  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, { height: size, width: size }, style]}
      testID={testID}
    >
      <View
        style={[
          styles.ring,
          {
            borderColor: colors.ring,
            height: ringSize,
            width: ringSize,
          },
        ]}
      />
      <View
        style={[
          styles.ringGap,
          {
            backgroundColor,
            height: ringSize * 0.3,
            right: -ringSize * 0.03,
            top: ringSize * 0.12,
            width: ringSize * 0.34,
          },
        ]}
      />

      {variant !== "core" ? (
        <>
          <View
            style={[
              styles.innerRing,
              {
                borderColor: colors.ringSecondary,
                height: innerRingSize,
                width: innerRingSize,
              },
            ]}
          />
          <View
            style={[
              styles.innerGap,
              {
                backgroundColor,
                bottom: size * 0.09,
                height: innerRingSize * 0.3,
                left: size * 0.12,
                width: innerRingSize * 0.31,
              },
            ]}
          />
        </>
      ) : null}

      {variant !== "trace" ? (
        <View
          style={[styles.core, { backgroundColor: colors.core, height: coreSize, width: coreSize }]}
        >
          {stripeOffsets.map((offset, index) => (
            <View
              key={offset}
              style={[
                styles.stripe,
                {
                  backgroundColor: index % 2 === 0 ? colors.stripe : colors.highlight,
                  height: coreSize * 1.3,
                  left: coreSize / 2 + coreSize * offset - stripeWidth / 2,
                  opacity: index % 2 === 0 ? 0.78 : 0.68,
                  width: stripeWidth,
                },
              ]}
            />
          ))}
        </View>
      ) : (
        <View
          style={[
            styles.traceCore,
            {
              backgroundColor: colors.core,
              height: size * 0.18,
              width: size * 0.18,
            },
          ]}
        />
      )}

      {showSignal ? (
        <View
          style={[
            styles.signal,
            {
              backgroundColor: colors.dot,
              height: Math.max(5, size * 0.08),
              right: size * 0.01,
              top: size * 0.47,
              width: Math.max(5, size * 0.08),
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  ring: { position: "absolute", borderWidth: 2, borderRadius: tokens.radius.pill },
  ringGap: { position: "absolute", transform: [{ rotate: "-24deg" }] },
  innerRing: {
    position: "absolute",
    borderWidth: 1.5,
    borderRadius: tokens.radius.pill,
    transform: [{ rotate: "18deg" }],
  },
  innerGap: { position: "absolute", transform: [{ rotate: "28deg" }] },
  core: {
    position: "relative",
    overflow: "hidden",
    borderRadius: tokens.radius.pill,
    transform: [{ rotate: "12deg" }],
  },
  stripe: { position: "absolute", top: "-14%", transform: [{ rotate: "-21deg" }] },
  traceCore: { borderRadius: tokens.radius.pill },
  signal: { position: "absolute", borderRadius: tokens.radius.pill },
});
