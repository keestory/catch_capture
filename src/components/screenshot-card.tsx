import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ScreenshotItem } from "@/contracts/domain";
import { getMockPhotoSource } from "@/data/mock-photo-assets";
import { echoContentTypeLabel } from "@/domain/content-type-presentation";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";
import { presentScreenshotMedia } from "@/domain/screenshot-media-presentation";
import { presentItemSummary } from "@/domain/summary-presentation";
import { intentLabel } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

import { IntentIcon } from "./intent-icon";
import { MockScreenshotScene } from "./mock-screenshot-scene";
import { SummaryBlock } from "./summary-block";

type ScreenshotCardVariant = "grid" | "review" | "hero" | "searchResult";

interface ScreenshotCardProps {
  item: ScreenshotItem;
  variant?: ScreenshotCardVariant;
  selected?: boolean;
  onPress?: () => void;
}

export function ScreenshotVisual({
  item,
  compact = false,
  feed = false,
  preferOriginal = false,
  onImageLoadError,
}: {
  item: ScreenshotItem;
  compact?: boolean;
  feed?: boolean;
  preferOriginal?: boolean;
  onImageLoadError?: () => void;
}) {
  const [failedImageUri, setFailedImageUri] = useState<string>();
  const sensitive = isScreenshotSensitive(item);
  if (sensitive) {
    return (
      <View
        accessibilityLabel="민감한 항목, 기본 가림"
        style={[
          styles.visual,
          compact && styles.visualCompact,
          item.isLongCapture && styles.longVisual,
          feed && styles.visualFeed,
        ]}
      >
        <View style={styles.sensitiveOverlay}>
          <Text style={styles.sensitiveIcon}>▣</Text>
          <Text style={styles.sensitiveText}>민감한 내용 · 기본 가림</Text>
        </View>
      </View>
    );
  }

  const title = item.analysis?.title ?? "분석을 다시 시도해 주세요";
  const contentType = item.contentType ?? item.analysis?.contentType ?? "other";
  const source = item.source.appName ?? item.source.domain ?? "출처 미상";
  const accessibilityLabel = `${source}에서 캡처한 ${echoContentTypeLabel[contentType]} 화면, ${title}`;
  const media = presentScreenshotMedia(item, {
    preferOriginal,
    resolveBundled: getMockPhotoSource,
  });
  const visualUri = media.kind === "sensitive" ? "" : media.uri;
  const bundledPhotoFailed = failedImageUri === visualUri;
  const realImageFailed = failedImageUri === visualUri;

  if (media.kind === "bundled" && !bundledPhotoFailed) {
    return (
      <View
        accessibilityLabel={`${accessibilityLabel}, 평가용 실제 캡처`}
        style={[
          styles.visual,
          compact && styles.visualCompact,
          item.isLongCapture && styles.longVisual,
          feed && styles.visualFeed,
        ]}
      >
        <Image
          contentFit="contain"
          contentPosition="center"
          onError={() => {
            setFailedImageUri(visualUri);
            onImageLoadError?.();
          }}
          source={media.source}
          style={styles.realImage}
        />
      </View>
    );
  }

  if (media.kind === "unavailable" || (media.kind === "bundled" && bundledPhotoFailed)) {
    return (
      <View
        accessibilityLabel="예시 사진을 불러올 수 없음"
        style={[
          styles.visual,
          compact && styles.visualCompact,
          item.isLongCapture && styles.longVisual,
          feed && styles.visualFeed,
        ]}
      >
        <View style={styles.imageUnavailable}>
          <Text style={styles.imageUnavailableTitle}>예시 사진을 불러올 수 없어요</Text>
          <Text style={styles.imageUnavailableBody}>기본 화면으로 다시 확인해 주세요.</Text>
        </View>
      </View>
    );
  }

  if (media.kind === "device" && !realImageFailed) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.visual,
          compact && styles.visualCompact,
          item.isLongCapture && styles.longVisual,
          feed && styles.visualFeed,
        ]}
      >
        <Image
          contentFit="contain"
          contentPosition="center"
          onError={() => {
            setFailedImageUri(visualUri);
            onImageLoadError?.();
          }}
          source={media.source}
          style={styles.realImage}
        />
        {item.isLongCapture ? (
          <View style={styles.longBadge}>
            <Text style={styles.longBadgeText}>긴 캡처</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (media.kind === "device") {
    return (
      <View
        accessibilityLabel="이미지를 불러올 수 없음"
        style={[
          styles.visual,
          compact && styles.visualCompact,
          item.isLongCapture && styles.longVisual,
          feed && styles.visualFeed,
        ]}
      >
        <View style={styles.imageUnavailable}>
          <Text style={styles.imageUnavailableTitle}>이미지를 불러올 수 없어요</Text>
          <Text style={styles.imageUnavailableBody}>사진 접근 상태를 확인해 주세요.</Text>
        </View>
      </View>
    );
  }

  if (media.kind === "scene" && feed) {
    return (
      <View accessibilityLabel={accessibilityLabel} style={[styles.visual, styles.visualFeed]}>
        <MockScreenshotScene item={item} />
        {item.isLongCapture ? (
          <View style={styles.longBadge}>
            <Text style={styles.longBadgeText}>긴 캡처</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.visual,
        compact && styles.visualCompact,
        item.isLongCapture && styles.longVisual,
      ]}
    >
      <MockScreenshotScene item={item} />
      {item.isLongCapture ? (
        <View style={styles.longBadge}>
          <Text style={styles.longBadgeText}>긴 캡처</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ScreenshotCard({
  item,
  variant = "grid",
  selected = false,
  onPress,
}: ScreenshotCardProps) {
  const intent = item.intent ?? item.analysis?.suggestedIntent ?? "keep";
  const title = item.analysis?.title ?? "분석 실패 · 다시 시도 필요";
  const source = item.source.appName ?? item.source.domain ?? "출처 미상";
  const isWide = variant === "review" || variant === "hero" || variant === "searchResult";
  const summary = isWide ? presentItemSummary(item) : undefined;
  const sensitive = isScreenshotSensitive(item);
  const accessibilityLabel = sensitive
    ? "민감한 항목, 기본 가림"
    : `${title}, ${summary?.summary ? `${summary.summary}, ` : ""}${intentLabel[intent]}, ${source}`;
  const content = (
    <>
      <ScreenshotVisual item={item} compact={variant === "grid"} />
      {sensitive ? (
        <View style={styles.cardMeta}>
          <Text style={styles.cardTitle}>민감한 항목</Text>
          <Text style={styles.metadata}>내용과 출처를 기본으로 가렸어요.</Text>
        </View>
      ) : (
        <View style={styles.cardMeta}>
          <View style={styles.intentRow}>
            <IntentIcon color={tokens.color.inkSecondary} intent={intent} size={16} />
            <Text style={styles.intentText}>{intentLabel[intent]}</Text>
            {item.analysis?.needsReview || !item.analysis ? (
              <Text style={styles.needsReview}>확인 필요</Text>
            ) : null}
          </View>
          <Text numberOfLines={isWide ? 2 : 1} style={styles.cardTitle}>
            {title}
          </Text>
          {summary ? <SummaryBlock presentation={summary} variant="item" /> : null}
          <Text numberOfLines={1} style={styles.metadata}>
            {source} ·{" "}
            {new Date(item.capturedAt).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      )}
    </>
  );

  if (!onPress) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        accessible
        style={[styles.card, isWide && styles.cardWide, selected && styles.cardSelected]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isWide && styles.cardWide,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surface,
  },
  cardWide: { width: "100%" },
  cardSelected: { borderWidth: 2, borderColor: tokens.color.primary },
  cardPressed: { opacity: 0.78 },
  visual: {
    position: "relative",
    height: 272,
    overflow: "hidden",
    backgroundColor: tokens.color.surfaceMuted,
  },
  visualCompact: { height: 184 },
  visualFeed: { height: "100%" },
  longVisual: { height: 290 },
  realImage: { width: "100%", height: "100%" },
  imageUnavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space[1],
    padding: tokens.space[5],
    backgroundColor: tokens.color.surfaceMuted,
  },
  imageUnavailableTitle: { color: tokens.color.ink, fontSize: 14, fontWeight: "800" },
  imageUnavailableBody: {
    color: tokens.color.inkSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  longBadge: {
    position: "absolute",
    right: tokens.space[2],
    bottom: tokens.space[2],
    paddingHorizontal: tokens.space[2],
    paddingVertical: tokens.space[1],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.ink,
  },
  longBadgeText: { color: tokens.color.surface, fontSize: 10, fontWeight: "700" },
  sensitiveOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space[2],
    backgroundColor: tokens.color.surfaceMuted,
  },
  sensitiveIcon: { color: tokens.color.inkSecondary, fontSize: 24 },
  sensitiveText: { color: tokens.color.inkSecondary, fontSize: 12, fontWeight: "700" },
  cardMeta: {
    padding: tokens.space[3],
    gap: tokens.space[1],
    backgroundColor: tokens.color.surface,
  },
  intentRow: { flexDirection: "row", alignItems: "center", gap: tokens.space[1] },
  intentText: { color: tokens.color.inkSecondary, fontSize: 11, fontWeight: "700" },
  needsReview: {
    marginLeft: "auto",
    paddingHorizontal: tokens.space[1],
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.surface,
    color: tokens.color.inkSecondary,
    fontSize: 9,
    fontWeight: "700",
  },
  cardTitle: { color: tokens.color.ink, fontSize: 15, lineHeight: 21, fontWeight: "700" },
  metadata: { color: tokens.color.inkSecondary, fontSize: 11, lineHeight: 15 },
});
