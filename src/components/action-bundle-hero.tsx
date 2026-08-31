import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ScreenshotItem, ThirdSignalSuggestion } from "@/contracts/domain";
import { getMockPhotoSource } from "@/data/mock-photo-assets";
import { presentScreenshotMedia } from "@/domain/screenshot-media-presentation";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";
import { presentThirdSignal } from "@/domain/third-signal-presentation";
import { tokens } from "@/theme/tokens";

import { MockScreenshotScene } from "./mock-screenshot-scene";

interface ActionBundleHeroProps {
  items: ScreenshotItem[];
  onAccept(): void;
  onDismiss(): void;
  suggestion: ThirdSignalSuggestion;
}

export function ActionBundleHero({
  items,
  onAccept,
  onDismiss,
  suggestion,
}: ActionBundleHeroProps) {
  const selected = suggestion.itemIds
    .map((itemId) => items.find((item) => item.id === itemId))
    .filter((item): item is ScreenshotItem => Boolean(item));
  if (selected.length !== suggestion.itemIds.length || selected.some(isScreenshotSensitive)) {
    return null;
  }
  const media = selected.map((item) => ({
    item,
    presentation: presentScreenshotMedia(item, { resolveBundled: getMockPhotoSource }),
  }));
  if (media.some(({ presentation }) => presentation.kind === "sensitive")) return null;
  const copy = presentThirdSignal(suggestion);

  return (
    <View accessibilityLabel={`${copy.label}. ${copy.title}. ${copy.reason}`} style={styles.root}>
      <View style={styles.copy}>
        <Text style={styles.label}>{copy.label}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.reason}>{copy.reason}</Text>
      </View>

      <View style={styles.triptych}>
        {media.map(({ item, presentation }, index) => (
          <View
            key={item.id}
            style={[
              styles.panel,
              index === 0 && styles.primaryPanel,
              index > 0 && styles.sidePanel,
            ]}
          >
            {presentation.kind === "bundled" || presentation.kind === "device" ? (
              <Image
                accessibilityLabel={`${item.source.appName ?? "스크린샷"}, ${item.analysis?.title ?? "캡처"}`}
                contentFit="contain"
                source={presentation.source}
                style={styles.image}
              />
            ) : presentation.kind === "scene" ? (
              <MockScreenshotScene item={item} />
            ) : (
              <View style={styles.unavailable} />
            )}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityHint="세 캡처로 준비한 초안을 엽니다"
          accessibilityRole="button"
          onPress={onAccept}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
        >
          <Text style={styles.primaryActionText}>{copy.actionLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityHint="캡처는 유지하고 이 제안만 닫습니다"
          accessibilityRole="button"
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismissAction, pressed && styles.dismissPressed]}
        >
          <Text style={styles.dismissText}>{copy.dismissLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.space[5],
    paddingVertical: tokens.space[6],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.color.lineStrong,
  },
  copy: { gap: tokens.space[2] },
  label: {
    color: tokens.color.primary,
    fontSize: tokens.typography.eyebrow.fontSize,
    lineHeight: tokens.typography.eyebrow.lineHeight,
    fontWeight: "800",
    letterSpacing: tokens.typography.eyebrow.letterSpacing,
  },
  title: {
    color: tokens.color.ink,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  reason: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
  triptych: {
    height: 184,
    overflow: "hidden",
    flexDirection: "row",
    gap: tokens.space[2],
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.surfaceMuted,
  },
  panel: { overflow: "hidden", backgroundColor: tokens.color.surface },
  primaryPanel: { flex: 1.15 },
  sidePanel: { flex: 1 },
  image: { width: "100%", height: "100%" },
  unavailable: { flex: 1, backgroundColor: tokens.color.surfaceMuted },
  actions: { gap: tokens.space[1] },
  primaryAction: {
    minHeight: 54,
    paddingHorizontal: tokens.space[4],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.ink,
  },
  primaryActionText: { color: tokens.color.surface, fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  dismissAction: {
    minHeight: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissPressed: { opacity: 0.58 },
  dismissText: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    fontWeight: "700",
  },
});
