import { useState } from "react";
import { useRouter } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { StatePanel } from "@/components/state-panel";
import { ko } from "@/localization/ko";
import { useOnboarding } from "@/onboarding/onboarding-provider";
import { tokens } from "@/theme/tokens";

const privacyItems = [
  ["01", ko.onboarding.privacyLocal],
  ["02", ko.onboarding.privacyOriginal],
  ["03", ko.onboarding.privacyShare],
] as const;

export default function OnboardingPrivacyScreen() {
  const router = useRouter();
  const {
    state,
    error,
    requestPhotoAccess,
    denyPhotoAccess,
    selectManually,
    continueWithDemo,
    openSettings,
    setReviewTime,
  } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const continueToTime = () => router.push("/onboarding/review-time");

  const request = async (mode: "full" | "limited") => {
    setBusy(true);
    try {
      const access = await requestPhotoAccess(mode);
      if (access === "full" || access === "limited") continueToTime();
      else setNotice(ko.onboarding.permissionRequestDenied);
    } finally {
      setBusy(false);
    }
  };

  const chooseManually = async () => {
    setBusy(true);
    try {
      const count = await selectManually();
      if (count > 0) {
        if (web) {
          await setReviewTime("later");
          router.replace("/onboarding/first-result");
        } else continueToTime();
      } else setNotice(ko.onboarding.manualCancelled);
    } finally {
      setBusy(false);
    }
  };

  const continueDemo = async () => {
    setBusy(true);
    try {
      await continueWithDemo();
      if (web) {
        await setReviewTime("later");
        router.replace("/onboarding/first-result");
      } else continueToTime();
    } finally {
      setBusy(false);
    }
  };

  const handleSettings = async () => {
    const opened = await openSettings();
    setNotice(
      opened
        ? "설정에서 사진 접근을 바꾼 뒤 이 화면으로 돌아오세요."
        : "이 환경에서는 설정을 바로 열 수 없어요. 직접 선택으로 계속할 수 있어요.",
    );
  };

  const denied = state.photoAccess === "denied";
  const web = Platform.OS === "web";

  return (
    <OnboardingFrame
      body={ko.onboarding.privacyBody}
      footer={
        web ? (
          <>
            <ActionButton
              disabled={busy}
              label={ko.onboarding.webSelect}
              onPress={() => void chooseManually()}
            />
            <ActionButton
              disabled={busy}
              label={ko.onboarding.continueDemo}
              onPress={() => void continueDemo()}
              variant="secondary"
            />
          </>
        ) : denied ? (
          <>
            <ActionButton
              disabled={busy}
              label={ko.onboarding.manual}
              onPress={() => void chooseManually()}
            />
            <ActionButton
              disabled={busy}
              label={ko.onboarding.openSettings}
              onPress={() => void handleSettings()}
              variant="secondary"
            />
            <ActionButton
              disabled={busy}
              label={ko.onboarding.continueDemo}
              onPress={() => void continueDemo()}
              variant="quiet"
            />
          </>
        ) : (
          <>
            <ActionButton
              disabled={busy}
              label={ko.onboarding.allowFull}
              onPress={() => void request("full")}
            />
            <ActionButton
              disabled={busy}
              label={ko.onboarding.allowLimited}
              onPress={() => void request("limited")}
              variant="secondary"
            />
            <ActionButton
              disabled={busy}
              label={ko.onboarding.manual}
              onPress={() => void chooseManually()}
              variant="quiet"
            />
            <ActionButton
              disabled={busy}
              label={ko.onboarding.deny}
              onPress={() => void denyPhotoAccess()}
              variant="quiet"
            />
          </>
        )
      }
      onBack={() => router.back()}
      status={
        error ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>
            {notice}
          </Text>
        ) : undefined
      }
      step={2}
      title={ko.onboarding.privacyTitle}
    >
      {web ? (
        <View style={styles.webPanel}>
          <Text style={styles.webKicker}>{ko.onboarding.webKicker}</Text>
          <Text style={styles.webTitle}>{ko.onboarding.webTitle}</Text>
          <Text style={styles.webBody}>{ko.onboarding.webBody}</Text>
          <Text style={styles.webWarning}>{ko.onboarding.webAnalysisNote}</Text>
          <View style={styles.webRule} />
          <Text style={styles.webFootnote}>{ko.onboarding.webFootnote}</Text>
        </View>
      ) : denied ? (
        <StatePanel
          description={ko.onboarding.deniedBody}
          kind="permission"
          title={ko.onboarding.deniedTitle}
        />
      ) : (
        <View style={styles.list}>
          {privacyItems.map(([icon, label]) => (
            <View key={label} style={styles.item}>
              <View style={styles.indexBox}>
                <Text accessibilityElementsHidden style={styles.indexText}>
                  {icon}
                </Text>
              </View>
              <Text style={styles.itemText}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  webPanel: {
    gap: tokens.space[3],
    padding: tokens.space[5],
    borderWidth: 1,
    borderColor: tokens.color.lineStrong,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surface,
  },
  webKicker: {
    color: tokens.color.primary,
    fontSize: tokens.typography.eyebrow.fontSize,
    lineHeight: tokens.typography.eyebrow.lineHeight,
    fontWeight: "800",
    letterSpacing: tokens.typography.eyebrow.letterSpacing,
  },
  webTitle: {
    color: tokens.color.ink,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "800",
  },
  webBody: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
  webRule: { height: 1, backgroundColor: tokens.color.line },
  webWarning: {
    color: tokens.color.ink,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
    fontWeight: "600",
  },
  webFootnote: {
    color: tokens.color.inkTertiary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  list: { gap: tokens.space[3] },
  item: {
    minHeight: 76,
    paddingVertical: tokens.space[3],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.line,
  },
  indexBox: {
    width: tokens.size.touchTarget,
    height: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.primarySoft,
  },
  indexText: { color: tokens.color.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  itemText: {
    flex: 1,
    color: tokens.color.ink,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
  notice: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  error: { color: tokens.color.danger, fontSize: tokens.typography.metadata.fontSize },
});
