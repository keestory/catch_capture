import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { AppScreen } from "@/components/app-screen";
import { BrandMark } from "@/components/brand-mark";
import { FullscreenScreenshotModal } from "@/components/fullscreen-screenshot-modal";
import { ScreenshotCard } from "@/components/screenshot-card";
import { StatePanel } from "@/components/state-panel";
import { useAppData } from "@/data/app-data-provider";
import {
  presentCaptureHistory,
  type CaptureHistoryPresentation,
} from "@/domain/item-detail-presentation";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";
import type { DevicePhotoDeletionStatus } from "@/services/device-photo-library";
import { ko } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

export default function ItemDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string | string[] }>();
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;
  const { items, allGroups, deleteItemFromDevice, removeItemFromApp, openPhotoSettings } =
    useAppData();
  const item = items.find((candidate) => candidate.id === itemId);
  const [busy, setBusy] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<DevicePhotoDeletionStatus | null>(null);
  const [originalOpen, setOriginalOpen] = useState(false);

  const deleteDevicePhoto = async () => {
    if (!item || busy) return;
    setBusy(true);
    try {
      const result = await deleteItemFromDevice(item.id);
      setDeletionStatus(result.status);
      setConfirmingDelete(false);
    } catch {
      setDeletionStatus("failed");
      setConfirmingDelete(false);
    } finally {
      setBusy(false);
    }
  };

  if (deletionStatus === "deleted") {
    return (
      <AppScreen testID="device-delete-complete-screen">
        <DetailHeader onBack={() => router.replace("/(tabs)/library")} />
        <StatePanel
          actionLabel="보관함으로 돌아가기"
          description={ko.privacy.deviceDeletedBody}
          kind="empty"
          onAction={() => router.replace("/(tabs)/library")}
          title={ko.privacy.deviceDeletedTitle}
        />
      </AppScreen>
    );
  }

  if (!item) {
    return (
      <AppScreen>
        <DetailHeader onBack={() => router.replace("/(tabs)/library")} />
        <StatePanel
          actionLabel="보관함으로 돌아가기"
          description="이미 제거했거나 현재 보관함에 없는 캡처예요."
          kind="empty"
          onAction={() => router.replace("/(tabs)/library")}
          title="캡처를 찾지 못했어요"
        />
      </AppScreen>
    );
  }

  const statusMessage = deletionStatus ? deletionMessage[deletionStatus] : undefined;
  const permissionDenied = deletionStatus === "permission_denied";
  const captureHistory = presentCaptureHistory(item, items, allGroups);
  const sensitive = isScreenshotSensitive(item);
  const browserPreview = item.deviceAssetId?.startsWith("browser:") ?? false;

  return (
    <AppScreen testID="item-detail-screen">
      <DetailHeader onBack={() => router.back()} />
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>CAPTURE DETAIL</Text>
        <Text accessibilityRole="header" style={styles.title}>
          보관한 장면
        </Text>
      </View>

      <ScreenshotCard item={item} variant="review" />

      {!sensitive ? (
        <View style={styles.originalAction}>
          <ActionButton
            accessibilityHint="전체 화면에서 1배부터 4배까지 확대할 수 있어요."
            disabled={busy}
            label={browserPreview ? "선택한 이미지 크게 보기" : "원본 크게 보기"}
            onPress={() => setOriginalOpen(true)}
            variant="secondary"
          />
        </View>
      ) : null}

      <CaptureHistorySection presentation={captureHistory} />

      {originalOpen ? (
        <FullscreenScreenshotModal
          browserPreview={browserPreview}
          item={item}
          onClose={() => setOriginalOpen(false)}
          visible
        />
      ) : null}

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>이 장면 정리</Text>
        <View style={styles.actionDescription}>
          <Text style={styles.actionTitle}>{ko.privacy.removeFromApp}</Text>
          <Text style={styles.actionBody}>{ko.privacy.removeFromAppHint}</Text>
        </View>
        <ActionButton
          disabled={busy}
          label={ko.privacy.removeFromApp}
          onPress={() => {
            setOriginalOpen(false);
            setConfirmingRemove(true);
          }}
          variant="secondary"
        />

        {confirmingRemove ? (
          <View accessibilityRole="alert" style={styles.removeConfirmPanel}>
            <Text style={styles.removeConfirmTitle}>Echo에서만 이 장면을 제거할까요?</Text>
            <Text style={styles.actionBody}>
              {browserPreview
                ? "컴퓨터나 휴대폰에 있는 원본 파일은 그대로 남아요."
                : "기기 사진 앱의 원본은 그대로 남아요."}
            </Text>
            <ActionButton
              disabled={busy}
              label="Echo에서 제거"
              onPress={() => {
                setBusy(true);
                void removeItemFromApp(item.id)
                  .then(() => router.replace("/(tabs)/library"))
                  .catch(() => setConfirmingRemove(false))
                  .finally(() => setBusy(false));
              }}
              variant="secondary"
            />
            <ActionButton
              disabled={busy}
              label="취소"
              onPress={() => setConfirmingRemove(false)}
              variant="quiet"
            />
          </View>
        ) : null}

        {Platform.OS === "web" ? (
          <View style={styles.webDeleteNote}>
            <Text style={styles.actionTitle}>{ko.privacy.webOriginalTitle}</Text>
            <Text style={styles.actionBody}>{ko.privacy.webOriginalBody}</Text>
          </View>
        ) : (
          <View style={styles.deviceDeleteZone}>
            <View style={styles.actionDescription}>
              <Text style={styles.dangerTitle}>{ko.privacy.deleteFromDevice}</Text>
              <Text style={styles.actionBody}>{ko.privacy.deleteFromDeviceHint}</Text>
            </View>
            <ActionButton
              accessibilityHint={ko.privacy.deleteFromDeviceHint}
              disabled={busy}
              label={ko.privacy.deleteFromDevice}
              onPress={() => {
                setOriginalOpen(false);
                setDeletionStatus(null);
                setConfirmingDelete(true);
              }}
              variant="danger"
            />
          </View>
        )}
      </View>

      {confirmingDelete ? (
        <View accessibilityRole="alert" style={styles.confirmPanel}>
          <Text style={styles.confirmMark}>!</Text>
          <Text style={styles.confirmTitle}>{ko.privacy.deleteConfirmTitle}</Text>
          <Text style={styles.confirmBody}>{ko.privacy.deleteConfirmBody}</Text>
          <Text style={styles.recoveryBody}>{ko.privacy.deleteRecoveryBody}</Text>
          <ActionButton
            disabled={busy}
            label={busy ? "삭제 요청 중…" : ko.privacy.deleteConfirmAction}
            onPress={() => void deleteDevicePhoto()}
            variant="danger"
          />
          <ActionButton
            disabled={busy}
            label={ko.privacy.deleteCancel}
            onPress={() => {
              setConfirmingDelete(false);
              setDeletionStatus("cancelled");
            }}
            variant="quiet"
          />
        </View>
      ) : null}

      {statusMessage ? (
        <View accessibilityLiveRegion="polite" style={styles.statusPanel}>
          <Text style={styles.statusText}>{statusMessage}</Text>
          {permissionDenied ? (
            <ActionButton
              label="설정 열기"
              onPress={() => void openPhotoSettings()}
              variant="secondary"
            />
          ) : null}
        </View>
      ) : null}
    </AppScreen>
  );
}

function DetailHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="보관함으로 돌아가기"
        accessibilityRole="button"
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
      >
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <BrandMark compact />
    </View>
  );
}

function CaptureHistorySection({ presentation }: { presentation: CaptureHistoryPresentation }) {
  return (
    <View accessibilityLabel="이 장면의 기록" style={styles.historySection}>
      <View style={styles.historyHeading}>
        <Text style={styles.sectionTitle}>이 장면의 기록</Text>
        <Text style={styles.historyIntro}>
          {presentation.protected
            ? "내용과 함께 기록도 보호하고 있어요."
            : "언제, 얼마나 남겨왔는지 함께 기억해요."}
        </Text>
      </View>
      {presentation.rows.length > 0 ? (
        <View style={styles.historyList}>
          {presentation.rows.map((row) => (
            <View key={row.label} style={styles.historyRow}>
              <Text style={styles.historyLabel}>{row.label}</Text>
              <Text style={styles.historyValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={styles.historyNote}>{presentation.note}</Text>
    </View>
  );
}

const deletionMessage: Record<DevicePhotoDeletionStatus, string> = {
  deleted: ko.privacy.deviceDeletedTitle,
  not_found: ko.privacy.deviceDeletedTitle,
  cancelled: ko.privacy.deleteCancelled,
  permission_denied: ko.privacy.deletePermissionDenied,
  unavailable: ko.privacy.deleteUnavailable,
  failed: ko.privacy.deleteFailed,
};

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: {
    width: tokens.size.touchTarget,
    height: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.surfaceRaised,
  },
  backPressed: { opacity: 0.72 },
  backText: { color: tokens.color.ink, fontSize: 20, fontWeight: "800" },
  heading: { gap: tokens.space[1] },
  eyebrow: {
    color: tokens.color.primary,
    fontSize: tokens.typography.eyebrow.fontSize,
    lineHeight: tokens.typography.eyebrow.lineHeight,
    fontWeight: "800",
    letterSpacing: tokens.typography.eyebrow.letterSpacing,
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.typography.screenTitle.fontSize,
    lineHeight: tokens.typography.screenTitle.lineHeight,
    fontWeight: "800",
  },
  originalAction: { marginTop: -tokens.space[2] },
  historySection: {
    gap: tokens.space[3],
    paddingVertical: tokens.space[5],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.color.lineStrong,
  },
  historyHeading: { gap: tokens.space[1] },
  historyIntro: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  historyList: { borderTopWidth: 1, borderTopColor: tokens.color.line },
  historyRow: {
    minHeight: 52,
    paddingVertical: tokens.space[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.line,
  },
  historyLabel: {
    color: tokens.color.inkSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  historyValue: {
    flex: 1,
    color: tokens.color.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "right",
  },
  historyNote: {
    color: tokens.color.inkTertiary,
    fontSize: 11,
    lineHeight: 16,
  },
  actionsSection: { gap: tokens.space[3] },
  sectionTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.sectionTitle.fontSize,
    lineHeight: tokens.typography.sectionTitle.lineHeight,
    fontWeight: "800",
  },
  actionDescription: { gap: tokens.space[1] },
  actionTitle: { color: tokens.color.ink, fontSize: 15, lineHeight: 22, fontWeight: "700" },
  dangerTitle: { color: tokens.color.danger, fontSize: 15, lineHeight: 22, fontWeight: "800" },
  actionBody: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  deviceDeleteZone: {
    gap: tokens.space[3],
    marginTop: tokens.space[3],
    paddingTop: tokens.space[5],
    borderTopWidth: 1,
    borderTopColor: tokens.color.lineStrong,
  },
  webDeleteNote: {
    gap: tokens.space[1],
    marginTop: tokens.space[3],
    padding: tokens.space[4],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surfaceMuted,
  },
  removeConfirmPanel: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surfaceMuted,
  },
  removeConfirmTitle: { color: tokens.color.ink, fontSize: 15, lineHeight: 22, fontWeight: "800" },
  confirmPanel: {
    gap: tokens.space[3],
    padding: tokens.space[5],
    borderWidth: 1,
    borderColor: tokens.color.lineStrong,
    borderRadius: tokens.radius.tray,
    backgroundColor: tokens.color.surfaceRaised,
  },
  confirmMark: { color: tokens.color.danger, fontSize: 24, fontWeight: "900" },
  confirmTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.sectionTitle.fontSize,
    lineHeight: tokens.typography.sectionTitle.lineHeight,
    fontWeight: "800",
  },
  confirmBody: {
    color: tokens.color.ink,
    fontSize: tokens.typography.bodyStrong.fontSize,
    lineHeight: tokens.typography.bodyStrong.lineHeight,
    fontWeight: "600",
  },
  recoveryBody: {
    padding: tokens.space[3],
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surfaceMuted,
  },
  statusPanel: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surfaceRaised,
  },
  statusText: {
    color: tokens.color.ink,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
});
