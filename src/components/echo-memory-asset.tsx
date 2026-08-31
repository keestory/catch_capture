import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

import type { ContentType } from "@/contracts/domain";
import { tokens } from "@/theme/tokens";

interface EchoMemoryAssetProps {
  compact?: boolean;
  contentType: ContentType;
  style?: StyleProp<ViewStyle>;
}

function EchoMemoryAssetComponent({ compact = false, contentType, style }: EchoMemoryAssetProps) {
  const size = compact ? 60 : 78;
  const p = (value: number) => (value / 78) * size;
  const stroke = compact ? 1.35 : 1.6;
  const foreground = tokens.color.inkSecondary;

  const frameStyle = {
    borderColor: foreground,
    borderWidth: stroke,
    borderRadius: p(7),
  } as const;

  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, { width: size, height: size }, style]}
      testID={`echo-memory-asset-${contentType}`}
    >
      <View
        style={[
          styles.orbitOuter,
          {
            width: size,
            height: size,
            borderWidth: stroke,
            borderRadius: tokens.radius.pill,
          },
        ]}
      />
      <View
        style={[
          styles.orbitInner,
          {
            width: p(55),
            height: p(55),
            left: p(11.5),
            top: p(11.5),
            borderWidth: Math.max(1, stroke - 0.35),
            borderRadius: tokens.radius.pill,
          },
        ]}
      />

      {contentType === "product" ? (
        <>
          <View
            style={[
              styles.absolute,
              frameStyle,
              {
                width: p(42),
                height: p(20),
                left: p(18),
                top: p(30),
                borderRadius: tokens.radius.pill,
              },
            ]}
          />
          <View
            style={[
              styles.absolute,
              styles.softFill,
              {
                width: p(28),
                height: p(8),
                left: p(25),
                top: p(36),
                borderRadius: tokens.radius.pill,
                backgroundColor: foreground,
              },
            ]}
          />
          <View
            style={[
              styles.absolute,
              styles.peachCore,
              { width: p(9), height: p(9), right: p(13), top: p(19) },
            ]}
          />
        </>
      ) : null}

      {contentType === "ui_reference" ? (
        <>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.absolute,
                frameStyle,
                {
                  width: p(34),
                  height: p(27),
                  left: p(16 + index * 6),
                  top: p(19 + index * 7),
                  backgroundColor:
                    index === 2 ? tokens.color.echoSurface.navigationSurface : "transparent",
                },
              ]}
            />
          ))}
          <View
            style={[
              styles.absolute,
              styles.aquaCore,
              { width: p(7), height: p(7), right: p(15), bottom: p(14) },
            ]}
          />
        </>
      ) : null}

      {contentType === "video_frame" ? (
        <>
          <View
            style={[
              styles.absolute,
              frameStyle,
              {
                width: p(34),
                height: p(34),
                left: p(22),
                top: p(19),
                borderRadius: tokens.radius.pill,
              },
            ]}
          />
          <View
            style={[
              styles.play,
              {
                left: p(35),
                top: p(29),
                borderTopWidth: p(7),
                borderBottomWidth: p(7),
                borderLeftWidth: p(11),
                borderLeftColor: foreground,
              },
            ]}
          />
          <View
            style={[
              styles.absolute,
              { width: p(39), height: stroke, left: p(19.5), bottom: p(16) },
              { backgroundColor: foreground },
            ]}
          />
          <View
            style={[
              styles.absolute,
              styles.peachCore,
              { width: p(7), height: p(7), left: p(29), bottom: p(13) },
            ]}
          />
        </>
      ) : null}

      {contentType === "place" ? (
        <>
          <View
            style={[
              styles.absolute,
              frameStyle,
              {
                width: p(36),
                height: p(36),
                left: p(21),
                top: p(18),
                borderRadius: tokens.radius.pill,
              },
            ]}
          />
          <View
            style={[
              styles.compassNeedle,
              {
                width: p(12),
                height: p(27),
                left: p(33),
                top: p(22.5),
                borderColor: foreground,
                borderWidth: stroke,
              },
            ]}
          />
          <View
            style={[
              styles.absolute,
              styles.aquaCore,
              { width: p(7), height: p(7), left: p(35.5), top: p(33) },
            ]}
          />
        </>
      ) : null}

      {contentType === "social_post" ? (
        <>
          <View
            style={[
              styles.absolute,
              frameStyle,
              { width: p(35), height: p(23), left: p(15), top: p(22) },
            ]}
          />
          <View
            style={[
              styles.absolute,
              frameStyle,
              {
                width: p(32),
                height: p(21),
                right: p(13),
                bottom: p(18),
                backgroundColor: tokens.color.echoSurface.navigationSurface,
              },
            ]}
          />
          <View
            style={[
              styles.absolute,
              styles.peachCore,
              { width: p(6), height: p(6), left: p(23), top: p(30) },
            ]}
          />
          <View
            style={[
              styles.absolute,
              styles.aquaCore,
              { width: p(6), height: p(6), right: p(21), bottom: p(25) },
            ]}
          />
        </>
      ) : null}

      {contentType === "article" ? (
        <>
          <View
            style={[
              styles.absolute,
              frameStyle,
              { width: p(31), height: p(40), left: p(19), top: p(17) },
            ]}
          />
          <View
            style={[
              styles.absolute,
              frameStyle,
              {
                width: p(31),
                height: p(40),
                right: p(18),
                bottom: p(15),
                backgroundColor: tokens.color.echoSurface.navigationSurface,
              },
            ]}
          />
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.absolute,
                {
                  width: p(index === 2 ? 14 : 20),
                  height: stroke,
                  right: p(23),
                  top: p(29 + index * 7),
                  borderRadius: tokens.radius.pill,
                  backgroundColor: foreground,
                },
              ]}
            />
          ))}
        </>
      ) : null}

      {contentType === "document" ? (
        <>
          <View
            style={[
              styles.absolute,
              frameStyle,
              { width: p(39), height: p(37), left: p(19.5), top: p(19) },
            ]}
          />
          <View
            style={[
              styles.absolute,
              { width: stroke, height: p(37), left: p(39), top: p(19) },
              { backgroundColor: foreground },
            ]}
          />
          <View
            style={[
              styles.absolute,
              { width: p(39), height: stroke, left: p(19.5), top: p(37) },
              { backgroundColor: foreground },
            ]}
          />
          <View
            style={[
              styles.absolute,
              styles.aquaCore,
              { width: p(7), height: p(7), right: p(15), top: p(16) },
            ]}
          />
        </>
      ) : null}

      {contentType === "event" ? (
        <>
          <View
            style={[
              styles.absolute,
              frameStyle,
              { width: p(42), height: p(35), left: p(18), top: p(22) },
            ]}
          />
          <View
            style={[
              styles.absolute,
              { width: p(42), height: stroke, left: p(18), top: p(32) },
              { backgroundColor: foreground },
            ]}
          />
          {[0, 1].map((index) => (
            <View
              key={index}
              style={[
                styles.absolute,
                {
                  width: p(4),
                  height: p(8),
                  left: p(29 + index * 19),
                  top: p(18),
                  borderRadius: tokens.radius.pill,
                  backgroundColor: foreground,
                },
              ]}
            />
          ))}
          <View
            style={[
              styles.absolute,
              styles.peachCore,
              { width: p(11), height: p(11), left: p(33.5), top: p(39) },
            ]}
          />
        </>
      ) : null}

      {contentType === "conversation" ? (
        <>
          <View
            style={[
              styles.absolute,
              { width: stroke, height: p(34), left: p(28), top: p(22) },
              { backgroundColor: foreground },
            ]}
          />
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.absolute,
                frameStyle,
                {
                  width: p(22 + index * 4),
                  height: p(9),
                  left: p(26),
                  top: p(20 + index * 14),
                  borderRadius: tokens.radius.pill,
                  backgroundColor:
                    index === 1 ? tokens.color.echoSurface.navigationSurface : "transparent",
                },
              ]}
            />
          ))}
          <View
            style={[
              styles.absolute,
              styles.aquaCore,
              { width: p(6), height: p(6), left: p(25), top: p(35) },
            ]}
          />
        </>
      ) : null}

      {contentType === "other" ? (
        <>
          {[
            { size: 19, left: 19, top: 27, color: tokens.color.echoSurface.reflectionAqua },
            { size: 14, left: 38, top: 21, color: tokens.color.echoSurface.reflectionViolet },
            { size: 11, left: 43, top: 42, color: tokens.color.echoSurface.reflectionPeach },
          ].map((core, index) => (
            <View
              key={index}
              style={[
                styles.absolute,
                {
                  width: p(core.size),
                  height: p(core.size),
                  left: p(core.left),
                  top: p(core.top),
                  borderRadius: tokens.radius.pill,
                  backgroundColor: core.color,
                  opacity: 0.82,
                },
              ]}
            />
          ))}
        </>
      ) : null}

      <View
        style={[styles.reflectionDot, styles.reflectionDotAqua, { width: p(5), height: p(5) }]}
      />
      <View
        style={[styles.reflectionDot, styles.reflectionDotViolet, { width: p(4), height: p(4) }]}
      />
      <View
        style={[styles.reflectionDot, styles.reflectionDotPeach, { width: p(3), height: p(3) }]}
      />
    </View>
  );
}

export const EchoMemoryAsset = memo(EchoMemoryAssetComponent);

const styles = StyleSheet.create({
  root: { position: "relative", pointerEvents: "none" },
  absolute: { position: "absolute" },
  orbitOuter: {
    position: "absolute",
    borderColor: tokens.color.echoSurface.reflectionAqua,
    borderRightColor: "transparent",
    opacity: 0.9,
    transform: [{ rotate: "-22deg" }],
  },
  orbitInner: {
    position: "absolute",
    borderColor: tokens.color.echoSurface.reflectionViolet,
    borderBottomColor: "transparent",
    opacity: 0.78,
    transform: [{ rotate: "18deg" }],
  },
  softFill: { opacity: 0.16 },
  aquaCore: {
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.echoSurface.reflectionAqua,
  },
  peachCore: {
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.echoSurface.reflectionPeach,
  },
  play: {
    width: 0,
    height: 0,
    position: "absolute",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  compassNeedle: {
    position: "absolute",
    borderTopLeftRadius: tokens.radius.pill,
    borderBottomRightRadius: tokens.radius.pill,
    transform: [{ rotate: "38deg" }],
  },
  reflectionDot: { position: "absolute", borderRadius: tokens.radius.pill },
  reflectionDotAqua: {
    left: "8%",
    bottom: "18%",
    backgroundColor: tokens.color.echoSurface.reflectionAqua,
  },
  reflectionDotViolet: {
    left: "14%",
    bottom: "12%",
    backgroundColor: tokens.color.echoSurface.reflectionViolet,
  },
  reflectionDotPeach: {
    left: "20%",
    bottom: "9%",
    backgroundColor: tokens.color.echoSurface.reflectionPeach,
  },
});
