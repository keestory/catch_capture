import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useIsFocused, useRouter } from "expo-router";

import { AppScreen } from "@/components/app-screen";
import { ActionButton } from "@/components/action-button";
import { ActionBundleHero } from "@/components/action-bundle-hero";
import { CuriosityDashboard } from "@/components/curiosity-dashboard";
import { ScreenHeader } from "@/components/screen-header";
import { StatePanel } from "@/components/state-panel";
import { TodayConnectionCard } from "@/components/today-connection-card";
import { WebPhotoSelectionGuide } from "@/components/web-photo-selection-guide";
import { useAppData } from "@/data/app-data-provider";
import { presentCuriosityDashboard } from "@/domain/curiosity-dashboard-presentation";
import { resolveItemReviewDate, resolveReviewDate } from "@/domain/review-date";
import { TODAY_CONNECTION_LIMIT } from "@/domain/today-connection-presentation";
import { buildThirdSignalSuggestions } from "@/domain/third-signal-policy";
import { interpolate, ko } from "@/localization/ko";
import { useOnboarding } from "@/onboarding/onboarding-provider";
import { tokens } from "@/theme/tokens";

export default function TodayScreen() {
  const isFocused = useIsFocused();
  const router = useRouter();
  const { fontScale } = useWindowDimensions();
  const { state: onboarding } = useOnboarding();
  const {
    items,
    groups,
    allGroups,
    sessions,
    activeSession,
    reviewDecisions,
    recallInteractions,
    actionDraftInteractions,
    loading,
    error,
    photoImportStatus,
    startReview,
    syncScreenshots,
    selectBrowserScreenshots,
    openPhotoSettings,
    recordActionDraftInteraction,
    resetDemo,
  } = useAppData();
  const [starting, setStarting] = useState(false);
  const [selectingBrowser, setSelectingBrowser] = useState(false);
  const [browserSelectionNotice, setBrowserSelectionNotice] = useState<string | null>(null);
  const reviewDate = resolveReviewDate(items, onboarding.importMode);

  const reviewItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (item.status === "ready_for_review" || item.status === "new") &&
          resolveItemReviewDate(item, onboarding.importMode) === reviewDate,
      ),
    [items, onboarding.importMode, reviewDate],
  );
  const failedItems = useMemo(
    () => reviewItems.filter((item) => item.status === "new" && !item.analysis),
    [reviewItems],
  );
  const suggestedGroupCount = Math.min(groups.length, TODAY_CONNECTION_LIMIT);
  const actionSuggestion = useMemo(
    () =>
      buildThirdSignalSuggestions({
        items,
        groups: allGroups,
        interactions: actionDraftInteractions,
        now: new Date().toISOString(),
      })[0],
    [actionDraftInteractions, allGroups, items],
  );
  const previewGroupLimit = actionSuggestion
    ? Math.max(0, TODAY_CONNECTION_LIMIT - 1)
    : TODAY_CONNECTION_LIMIT;
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const completedSession = sessions.find(
    (session) => session.reviewDate === reviewDate && session.completedAt,
  );
  const dashboard = useMemo(
    () =>
      presentCuriosityDashboard({
        items,
        sessions,
        decisions: reviewDecisions,
        recallInteractions,
        demo: onboarding.importMode === "demo",
      }),
    [items, onboarding.importMode, recallInteractions, reviewDecisions, sessions],
  );

  const openReview = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const session = await startReview(TODAY_CONNECTION_LIMIT);
      router.push(`/review/${session.id}`);
    } catch {
      // The provider exposes the localized error state on Today.
    } finally {
      setStarting(false);
    }
  };

  const selectMoreInBrowser = async () => {
    if (selectingBrowser) return;
    setBrowserSelectionNotice(null);
    setSelectingBrowser(true);
    try {
      const count = await selectBrowserScreenshots();
      setBrowserSelectionNotice(
        count > 0 ? interpolate(ko.today.webImportSuccess, { count }) : ko.today.webImportCancelled,
      );
    } catch {
      // The provider exposes the localized error state below.
    } finally {
      setSelectingBrowser(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <ScreenHeader eyebrow="DAILY CURATOR" showBrandGlyph={false} title="오늘" />
        <StatePanel
          description="새 캡처와 묶음을 기기 안에서 준비하고 있어요."
          kind="loading"
          title="오늘의 장면을 모으는 중"
        />
      </AppScreen>
    );
  }

  if (
    Platform.OS !== "web" &&
    photoImportStatus === "permission_denied" &&
    onboarding.importMode !== "demo" &&
    items.length === 0
  ) {
    return (
      <AppScreen>
        <ScreenHeader eyebrow="DAILY CURATOR" showBrandGlyph={false} title="오늘" />
        <StatePanel
          actionLabel={ko.onboarding.openSettings}
          description="설정에서 사진 전체 또는 선택 접근을 허용한 뒤 돌아오면 새 스크린샷을 다시 확인해요."
          kind="permission"
          onAction={() => void openPhotoSettings()}
          title="스크린샷 접근이 필요해요"
        />
      </AppScreen>
    );
  }

  if (error && items.length === 0) {
    return (
      <AppScreen>
        <ScreenHeader eyebrow="DAILY CURATOR" showBrandGlyph={false} title="오늘" />
        <StatePanel
          actionLabel={onboarding.importMode === "demo" ? "데모 데이터 다시 불러오기" : "다시 확인"}
          description={error}
          kind="error"
          onAction={() => void (onboarding.importMode === "demo" ? resetDemo() : syncScreenshots())}
          title="오늘의 정리를 열지 못했어요"
        />
      </AppScreen>
    );
  }

  const reviewActionLabel = activeSession ? ko.today.continue : ko.today.startReview;
  const reviewDisabled = starting || (!activeSession && groups.length === 0);

  return (
    <AppScreen accessibilityHidden={!isFocused} atmosphere={false} testID="today-screen">
      {Platform.OS === "web" ? (
        <WebPhotoSelectionGuide
          body={
            onboarding.importMode === "demo" ? ko.today.webImportDemoBody : ko.today.webImportBody
          }
          footnote={ko.today.webImportFootnote}
          status={browserSelectionNotice}
          title={
            onboarding.importMode === "demo" ? ko.today.webImportDemoTitle : ko.today.webImportTitle
          }
        >
          <ActionButton
            accessibilityHint="휴대폰이나 컴퓨터의 사진 선택 화면을 엽니다"
            busy={selectingBrowser}
            disabled={selectingBrowser}
            label={
              selectingBrowser
                ? ko.today.webImportBusy
                : onboarding.importMode === "demo"
                  ? ko.today.webImportDemoAction
                  : ko.today.webImportAction
            }
            onPress={() => void selectMoreInBrowser()}
          />
        </WebPhotoSelectionGuide>
      ) : null}

      <CuriosityDashboard
        items={items}
        onOpenReview={() => void openReview()}
        presentation={dashboard}
        reviewDisabled={reviewDisabled}
        starting={starting}
      />

      {failedItems.length > 0 ? (
        <View accessibilityRole="alert" style={styles.analysisNotice}>
          <Text style={styles.analysisNoticeSymbol}>!</Text>
          <View style={styles.analysisNoticeCopy}>
            <Text style={styles.analysisNoticeTitle}>{failedItems.length}장 분석 대기</Text>
            <Text style={styles.analysisNoticeBody}>다른 묶음은 그대로 볼 수 있어요.</Text>
          </View>
        </View>
      ) : null}

      {error ? (
        <StatePanel
          actionLabel={onboarding.importMode === "demo" ? "데모 데이터 다시 불러오기" : "다시 확인"}
          description={error}
          kind="error"
          onAction={() => void (onboarding.importMode === "demo" ? resetDemo() : syncScreenshots())}
          title="일부 변경을 저장하지 못했어요"
        />
      ) : null}

      {actionSuggestion ? (
        <ActionBundleHero
          items={items}
          onAccept={() => {
            void recordActionDraftInteraction(actionSuggestion.id, "accepted").then(() =>
              router.push(`/draft/${actionSuggestion.groupId}`),
            );
          }}
          onDismiss={() => void recordActionDraftInteraction(actionSuggestion.id, "dismissed")}
          suggestion={actionSuggestion}
        />
      ) : null}

      {groups.length === 0 && completedSession && !actionSuggestion ? (
        <StatePanel
          description="필요한 순간 보관함과 찾기에서 다시 꺼낼 수 있어요."
          kind="empty"
          title="오늘의 정리를 마쳤어요"
        />
      ) : groups.length === 0 && !actionSuggestion ? (
        <StatePanel
          actionLabel={
            Platform.OS === "web"
              ? ko.today.webImportAction
              : onboarding.importMode === "demo"
                ? undefined
                : "새 스크린샷 확인"
          }
          description={
            photoImportStatus === "syncing"
              ? "사진 앱에서 새 스크린샷을 확인하고 있어요."
              : Platform.OS === "web"
                ? "웹에서는 새 스크린샷을 자동으로 찾지 못해요. 사진 앱에서 직접 골라 추가해 주세요."
                : ko.today.emptyBody
          }
          kind={photoImportStatus === "syncing" ? "loading" : "empty"}
          onAction={
            Platform.OS === "web"
              ? () => void selectMoreInBrowser()
              : onboarding.importMode === "demo"
                ? undefined
                : () => void syncScreenshots()
          }
          title={
            photoImportStatus === "syncing"
              ? "오늘의 장면을 모으는 중"
              : Platform.OS === "web"
                ? "아직 선택한 스크린샷이 없어요"
                : ko.today.emptyTitle
          }
        />
      ) : (
        <View style={styles.feed}>
          {groups.slice(0, previewGroupLimit).map((group, index, visibleGroups) => (
            <TodayConnectionCard
              group={group}
              index={index}
              items={group.itemIds
                .map((id) => itemById.get(id))
                .filter((item) => item !== undefined)}
              key={group.id}
              largeText={fontScale >= 1.4}
              total={visibleGroups.length}
            />
          ))}
        </View>
      )}

      {groups.length > 0 ? (
        <View style={styles.finiteEnd}>
          <View style={styles.finiteEndCopy}>
            <Text style={styles.finiteEndEyebrow}>오늘의 피드 끝</Text>
            <Text style={styles.finiteEndTitle}>{suggestedGroupCount}묶음을 모두 봤어요.</Text>
            <Text style={styles.finiteEndBody}>
              더 불러오는 콘텐츠는 없어요. 정리를 시작하면 묶음별로 빠르게 확인할 수 있어요.
            </Text>
          </View>
          <Pressable
            accessibilityHint="오늘의 묶음 정리를 시작하거나 이어갑니다"
            accessibilityRole="button"
            accessibilityState={{ busy: starting, disabled: reviewDisabled }}
            disabled={reviewDisabled}
            onPress={() => void openReview()}
            style={({ pressed }) => [
              styles.endButton,
              pressed && !reviewDisabled && styles.endButtonPressed,
              reviewDisabled && styles.endButtonDisabled,
            ]}
          >
            <Text style={styles.endButtonText}>
              {starting ? "정리 여는 중…" : reviewActionLabel}
            </Text>
            <Text accessibilityElementsHidden style={styles.endArrow}>
              ↗
            </Text>
          </Pressable>
          <View style={styles.privacyLine}>
            <Text style={styles.privacySymbol}>▣</Text>
            <Text style={styles.privacyBody}>
              {onboarding.importMode === "manual"
                ? ko.onboarding.manualStatus
                : onboarding.photoAccess === "limited"
                  ? ko.onboarding.limitedStatus
                  : onboarding.importMode === "demo"
                    ? ko.onboarding.demoStatus
                    : "원본과 OCR 문장을 기기 밖으로 보내지 않아요."}
            </Text>
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  analysisNotice: {
    minHeight: 58,
    paddingHorizontal: tokens.space[4],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[3],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surface,
  },
  analysisNoticeSymbol: {
    width: 28,
    height: 28,
    color: tokens.color.ink,
    fontSize: 15,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "center",
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surfaceMuted,
  },
  analysisNoticeCopy: { flex: 1, gap: 1 },
  analysisNoticeTitle: { color: tokens.color.ink, fontSize: 12, fontWeight: "800" },
  analysisNoticeBody: { color: tokens.color.inkSecondary, fontSize: 11, lineHeight: 15 },
  feed: { gap: tokens.space[6] },
  finiteEnd: {
    padding: tokens.space[5],
    gap: tokens.space[4],
    borderWidth: 1,
    borderColor: tokens.color.lineStrong,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surface,
  },
  finiteEndCopy: { gap: tokens.space[1] },
  finiteEndEyebrow: {
    color: tokens.color.inkSecondary,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
  },
  finiteEndTitle: {
    color: tokens.color.ink,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.35,
  },
  finiteEndBody: { color: tokens.color.inkSecondary, fontSize: 13, lineHeight: 19 },
  endButton: {
    minHeight: 52,
    paddingHorizontal: tokens.space[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.primary,
  },
  endButtonPressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
  endButtonDisabled: { opacity: 0.42 },
  endButtonText: { color: tokens.color.surface, fontSize: 14, fontWeight: "800" },
  endArrow: { color: tokens.color.surface, fontSize: 17, fontWeight: "900" },
  privacyLine: {
    minHeight: tokens.size.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[2],
    paddingTop: tokens.space[3],
    borderTopWidth: 1,
    borderTopColor: tokens.color.line,
  },
  privacySymbol: { color: tokens.color.inkSecondary, fontSize: 15 },
  privacyBody: { flex: 1, color: tokens.color.inkSecondary, fontSize: 11, lineHeight: 16 },
});
