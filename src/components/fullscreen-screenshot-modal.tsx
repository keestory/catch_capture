import { useState } from "react";
import { Image } from "expo-image";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { ScreenshotItem } from "@/contracts/domain";
import { getMockPhotoSource } from "@/data/mock-photo-assets";
import { presentScreenshotMedia } from "@/domain/screenshot-media-presentation";
import { tokens } from "@/theme/tokens";

import { ScreenshotVisual } from "./screenshot-card";

interface FullscreenScreenshotModalProps {
  item: ScreenshotItem;
  visible: boolean;
  onClose: () => void;
  browserPreview?: boolean;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;

const clamp = (value: number): number => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);

export function FullscreenScreenshotModal({
  item,
  visible,
  onClose,
  browserPreview = false,
}: FullscreenScreenshotModalProps) {
  const [scale, setScale] = useState(MIN_SCALE);
  const [imageFailed, setImageFailed] = useState(false);
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const media = presentScreenshotMedia(item, {
    preferOriginal: true,
    resolveBundled: getMockPhotoSource,
  });
  const mediaAvailable =
    media.kind === "bundled" || media.kind === "device" || media.kind === "scene";
  const canZoom = mediaAvailable && !imageFailed;
  const zoomPercent = Math.round(scale * 100);
  const isIos = Platform.OS === "ios";

  const updateScale = (nextValue: number) => setScale(clamp(nextValue));
  const contentSize = {
    width: viewport.width * (isIos ? 1 : scale),
    height: viewport.height * (isIos ? 1 : scale),
  };
  const mediaCanvas = (
    <View style={[styles.mediaCanvas, contentSize]}>
      {media.kind === "bundled" && !imageFailed ? (
        <Image
          contentFit="contain"
          onError={() => setImageFailed(true)}
          source={media.source}
          style={styles.image}
        />
      ) : null}
      {media.kind === "device" && !imageFailed ? (
        <Image
          contentFit="contain"
          onError={() => setImageFailed(true)}
          source={media.source}
          style={styles.image}
        />
      ) : null}
      {media.kind === "scene" ? <ScreenshotVisual feed item={item} preferOriginal /> : null}
      {media.kind === "sensitive" ? (
        <ViewerFallback body="원본을 표시하지 않았어요." title="민감한 내용 · 기본 가림" />
      ) : null}
      {media.kind === "unavailable" || imageFailed ? (
        <ViewerFallback body="사진 접근 상태를 확인해 주세요." title="원본을 불러올 수 없어요" />
      ) : null}
    </View>
  );

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView
        accessibilityLabel={browserPreview ? "선택한 이미지 전체 화면" : "원본 전체 화면"}
        accessibilityViewIsModal
        style={styles.modal}
        testID="fullscreen-capture-viewer"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              {browserPreview ? "WEB PREVIEW" : "ORIGINAL CAPTURE"}
            </Text>
            <Text accessibilityRole="header" style={styles.title}>
              {browserPreview ? "선택한 이미지" : "원본 전체 화면"}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={browserPreview ? "선택한 이미지 닫기" : "원본 화면 닫기"}
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <View
          accessibilityActions={
            canZoom
              ? [
                  { name: "increment", label: "확대" },
                  { name: "decrement", label: "축소" },
                ]
              : undefined
          }
          accessibilityLabel={
            canZoom
              ? `${browserPreview ? "선택한 이미지" : "원본 캡처"}, 확대율 ${zoomPercent}%`
              : media.kind === "sensitive"
                ? "민감한 내용, 원본 가림"
                : "원본을 불러올 수 없음"
          }
          accessibilityRole={canZoom ? "adjustable" : undefined}
          accessibilityValue={
            canZoom ? { min: 100, max: 400, now: zoomPercent, text: `${zoomPercent}%` } : undefined
          }
          onAccessibilityAction={(event) => {
            if (!canZoom) return;
            if (event.nativeEvent.actionName === "increment") {
              updateScale(scale + SCALE_STEP);
            }
            if (event.nativeEvent.actionName === "decrement") {
              updateScale(scale - SCALE_STEP);
            }
          }}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setViewport({ width, height });
          }}
          style={styles.stage}
        >
          {isIos ? (
            <ScrollView
              centerContent
              contentContainerStyle={styles.iosZoomContent}
              maximumZoomScale={MAX_SCALE}
              minimumZoomScale={MIN_SCALE}
              onScroll={(event) => {
                const nativeScale = event.nativeEvent.zoomScale;
                if (typeof nativeScale === "number" && Math.abs(nativeScale - scale) > 0.01) {
                  setScale(clamp(nativeScale));
                }
              }}
              pinchGestureEnabled
              scrollEventThrottle={32}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              zoomScale={scale}
            >
              {mediaCanvas}
            </ScrollView>
          ) : (
            <ScrollView
              bounces={false}
              contentContainerStyle={{ width: contentSize.width }}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={scale > MIN_SCALE}
            >
              <ScrollView
                bounces={false}
                contentContainerStyle={{ height: contentSize.height }}
                nestedScrollEnabled
                showsVerticalScrollIndicator={scale > MIN_SCALE}
                style={{ width: contentSize.width, height: viewport.height }}
              >
                {mediaCanvas}
              </ScrollView>
            </ScrollView>
          )}
        </View>

        <View style={styles.footer}>
          <Text accessibilityLiveRegion="polite" style={styles.zoomLabel}>
            {zoomPercent}%
          </Text>
          <View style={styles.controls}>
            <ZoomButton
              disabled={!canZoom || scale <= MIN_SCALE}
              label="축소"
              onPress={() => updateScale(scale - SCALE_STEP)}
              symbol="−"
            />
            <Pressable
              accessibilityLabel="화면에 맞추기"
              accessibilityRole="button"
              disabled={!canZoom || scale === MIN_SCALE}
              onPress={() => updateScale(MIN_SCALE)}
              style={({ pressed }) => [
                styles.fitButton,
                (!canZoom || scale === MIN_SCALE) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.fitText}>화면 맞춤</Text>
            </Pressable>
            <ZoomButton
              disabled={!canZoom || scale >= MAX_SCALE}
              label="확대"
              onPress={() => updateScale(scale + SCALE_STEP)}
              symbol="+"
            />
          </View>
          <Text style={styles.hint}>
            {isIos
              ? "두 손가락으로 확대하거나, 버튼으로 조절하세요."
              : "확대한 뒤 스크롤하거나, 버튼으로 조절하세요."}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ViewerFallback({ body, title }: { body: string; title: string }) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>{title}</Text>
      <Text style={styles.fallbackBody}>{body}</Text>
    </View>
  );
}

function ZoomButton({
  disabled,
  label,
  onPress,
  symbol,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  symbol: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.zoomButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.zoomButtonText}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: tokens.color.ink },
  header: {
    minHeight: 72,
    paddingHorizontal: tokens.space[5],
    paddingVertical: tokens.space[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.16)",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  title: { color: tokens.color.surface, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  closeButton: {
    width: tokens.size.touchTarget,
    height: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: tokens.radius.pill,
  },
  closeText: { color: tokens.color.surface, fontSize: 28, lineHeight: 30, fontWeight: "400" },
  stage: { flex: 1, overflow: "hidden", backgroundColor: "#0B0B0B" },
  iosZoomContent: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  mediaCanvas: { backgroundColor: "#0B0B0B" },
  image: { width: "100%", height: "100%" },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space[2],
    padding: tokens.space[6],
  },
  fallbackTitle: { color: tokens.color.surface, fontSize: 17, fontWeight: "800" },
  fallbackBody: { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 20 },
  footer: {
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[5],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[4],
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.16)",
  },
  zoomLabel: {
    color: tokens.color.surface,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  controls: { flexDirection: "row", justifyContent: "center", gap: tokens.space[2] },
  zoomButton: {
    width: tokens.size.touchTarget,
    height: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  zoomButtonText: { color: tokens.color.surface, fontSize: 24, lineHeight: 28, fontWeight: "600" },
  fitButton: {
    minWidth: 112,
    height: tokens.size.touchTarget,
    paddingHorizontal: tokens.space[4],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  fitText: { color: tokens.color.surface, fontSize: 13, fontWeight: "700" },
  hint: { color: "rgba(255,255,255,0.56)", fontSize: 11, lineHeight: 16, textAlign: "center" },
  disabled: { opacity: 0.34 },
  pressed: { opacity: 0.68 },
});
