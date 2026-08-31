import { useEffect, useMemo, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { AppScreen } from "@/components/app-screen";
import { DailyReviewProgress } from "@/components/daily-review-progress";
import { GroupTray } from "@/components/group-tray";
import { IndividualReview } from "@/components/individual-review";
import { IntentChip } from "@/components/intent-chip";
import { StatePanel } from "@/components/state-panel";
import { UndoToast } from "@/components/undo-toast";
import type { DailyReviewSession, Intent, ScreenshotGroup } from "@/contracts/domain";
import { useAppData } from "@/data/app-data-provider";
import { intentDestinationLabel, interpolate, ko } from "@/localization/ko";
import { useOnboarding } from "@/onboarding/onboarding-provider";
import { tokens } from "@/theme/tokens";

const intents: Intent[] = ["reference", "want", "share", "read", "keep"];

export default function DailyReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const { state: onboarding } = useOnboarding();
  const {
    items,
    allGroups,
    sessions,
    reviewDecisions,
    loading,
    error,
    approveSessionGroup,
    changeSessionGroupIntent,
    setSessionItemDecision,
    undoSessionItemRemoval,
    separateSessionGroup,
    mergeSessionGroup,
  } = useAppData();
  const [busy, setBusy] = useState(false);
  const [showIntentPicker, setShowIntentPicker] = useState(false);
  const [showGroupAdjust, setShowGroupAdjust] = useState(false);
  const [individualIndex, setIndividualIndex] = useState<number | null>(null);
  const [undoItemId, setUndoItemId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!undoItemId) return;
    const timeout = setTimeout(() => setUndoItemId(null), 6000);
    return () => clearTimeout(timeout);
  }, [undoItemId]);

  if (!onboarding.completedAt) return <Redirect href="/onboarding/value" />;
  if (loading) {
    return (
      <AppScreen>
        <StatePanel
          description="저장된 진행 위치와 개별 변경을 확인하고 있어요."
          kind="loading"
          title="리뷰 이어오는 중"
        />
      </AppScreen>
    );
  }

  const session = sessions.find((candidate) => candidate.id === sessionId);
  if (!session) {
    return (
      <AppScreen>
        <StatePanel
          actionLabel={ko.review.backToday}
          description={ko.review.sessionMissingBody}
          kind="error"
          onAction={() => router.replace("/(tabs)")}
          title={ko.review.sessionMissingTitle}
        />
      </AppScreen>
    );
  }
  if (session.completedAt) {
    return <ReviewComplete items={items} session={session} />;
  }

  const groupId = session.groupIds[session.currentGroupIndex];
  const group = allGroups.find((candidate) => candidate.id === groupId);
  if (!group) {
    return (
      <AppScreen>
        <StatePanel
          actionLabel={ko.review.backToday}
          description="묶음 정보가 달라졌어요. 저장된 항목은 그대로 유지됩니다."
          kind="error"
          onAction={() => router.replace("/(tabs)")}
          title="현재 묶음을 열지 못했어요"
        />
      </AppScreen>
    );
  }

  const groupItems = group.itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item) => item !== undefined);
  const groupDecisions = reviewDecisions.filter(
    (decision) =>
      decision.sessionId === session.id &&
      !decision.committedAt &&
      group.itemIds.includes(decision.itemId),
  );
  const removedDecisionCount = groupDecisions.filter(
    (decision) => decision.outcome === "removed",
  ).length;
  const selectedIntent = group.reviewIntent ?? group.suggestedIntent;
  const currentNumber = session.currentGroupIndex + 1;
  const remainingSeconds = Math.max(4, (session.groupIds.length - session.currentGroupIndex) * 5);
  const siblingGroups = group.splitFromGroupId
    ? session.groupIds
        .map((id) => allGroups.find((candidate) => candidate.id === id))
        .filter(
          (candidate): candidate is ScreenshotGroup =>
            candidate !== undefined &&
            candidate.splitFromGroupId === group.splitFromGroupId &&
            !candidate.approvedAt,
        )
    : [];
  const canRegroup =
    Boolean(group.splitFromGroupId) &&
    siblingGroups.length > 1 &&
    siblingGroups[0]?.id === group.id &&
    groupDecisions.length === 0;

  const approve = async (intent: Intent) => {
    if (busy) return;
    setBusy(true);
    setUndoItemId(null);
    try {
      await approveSessionGroup(session.id, group.id, intent);
      const savedCount = groupItems.length - removedDecisionCount;
      setAnnouncement(
        removedDecisionCount > 0
          ? `${savedCount}장을 보관하고 ${removedDecisionCount}장은 앱에서 제거했어요.`
          : `${groupItems.length}장을 보관했어요.`,
      );
      setShowIntentPicker(false);
      setShowGroupAdjust(false);
      setIndividualIndex(null);
    } catch {
      // The provider exposes the persistence error without advancing the session.
    } finally {
      setBusy(false);
    }
  };

  const changeIntent = async (intent: Intent) => {
    if (busy) return;
    setBusy(true);
    try {
      await changeSessionGroupIntent(session.id, group.id, intent);
      setShowIntentPicker(false);
      setAnnouncement(`묶음 분류를 ${intentDestinationLabel[intent]} 바꿨어요.`);
    } catch {
      // The provider keeps the current group selected and exposes the error.
    } finally {
      setBusy(false);
    }
  };

  const setItemDecision = async (itemId: string, outcome: "saved" | "removed", intent: Intent) => {
    if (busy) return false;
    setBusy(true);
    try {
      await setSessionItemDecision(session.id, group.id, itemId, outcome, intent);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  const moveAfterDecision = () => {
    if (individualIndex === null) return;
    if (individualIndex < groupItems.length - 1) setIndividualIndex(individualIndex + 1);
    else setIndividualIndex(null);
  };

  const undoRemoval = async (itemId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await undoSessionItemRemoval(session.id, group.id, itemId);
      setUndoItemId(null);
      setAnnouncement("제거를 취소하고 다시 보관해요.");
    } catch {
      // The provider exposes the persistence error and leaves the draft unchanged.
    } finally {
      setBusy(false);
    }
  };

  const separateGroup = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await separateSessionGroup(session.id, group.id);
      setShowGroupAdjust(false);
      setAnnouncement(`${groupItems.length}장을 각각 따로 보관하도록 나눴어요.`);
    } catch {
      // The provider exposes the group consistency error.
    } finally {
      setBusy(false);
    }
  };

  const mergeGroup = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await mergeSessionGroup(session.id, group.id);
      setShowGroupAdjust(false);
      setAnnouncement("분리한 장면을 다시 한 묶음으로 합쳤어요.");
    } catch {
      // The provider exposes the group consistency error.
    } finally {
      setBusy(false);
    }
  };

  if (individualIndex !== null && groupItems[individualIndex]) {
    const item = groupItems[individualIndex];
    const decision = groupDecisions.find((candidate) => candidate.itemId === item.id);
    const itemIntent = decision?.intent ?? selectedIntent;
    return (
      <AppScreen testID="individual-review-screen">
        <ReviewHeader busy={busy} onClose={() => router.replace("/(tabs)")} />
        <DailyReviewProgress
          current={currentNumber}
          estimatedSecondsRemaining={remainingSeconds}
          total={session.groupIds.length}
        />
        <IndividualReview
          busy={busy}
          current={individualIndex + 1}
          decision={decision}
          item={item}
          onBack={() => setIndividualIndex(null)}
          onKeep={() =>
            void setItemDecision(item.id, "saved", itemIntent).then((saved) => {
              if (saved) {
                setAnnouncement(`이 장을 ${intentDestinationLabel[itemIntent]} 보관해요.`);
                moveAfterDecision();
              }
            })
          }
          onNext={() =>
            setIndividualIndex((value) => Math.min((value ?? 0) + 1, groupItems.length - 1))
          }
          onPrevious={() => setIndividualIndex((value) => Math.max((value ?? 0) - 1, 0))}
          onRemove={() =>
            void setItemDecision(item.id, "removed", itemIntent).then((saved) => {
              if (saved) {
                setUndoItemId(item.id);
                setAnnouncement("이 캡처를 앱에서 제거할 예정이에요. 기기 사진은 그대로예요.");
                moveAfterDecision();
              }
            })
          }
          onSelectIntent={(intent) =>
            void setItemDecision(item.id, "saved", intent).then((saved) => {
              if (saved)
                setAnnouncement(`이 장의 분류를 ${intentDestinationLabel[intent]} 바꿨어요.`);
            })
          }
          onUndoRemoval={() => void undoRemoval(item.id)}
          selectedIntent={itemIntent}
          total={groupItems.length}
        />
        {undoItemId ? (
          <UndoToast
            disabled={busy}
            message="앱에서 제거할 항목으로 표시했어요."
            onUndo={() => void undoRemoval(undoItemId)}
          />
        ) : null}
        <LiveStatus announcement={announcement} error={error} />
      </AppScreen>
    );
  }

  return (
    <AppScreen testID="daily-review-screen">
      <ReviewHeader busy={busy} onClose={() => router.replace("/(tabs)")} />
      <DailyReviewProgress
        current={currentNumber}
        estimatedSecondsRemaining={remainingSeconds}
        total={session.groupIds.length}
      />

      <View style={styles.currentLabel}>
        <Text accessibilityRole="header" style={styles.currentTitle}>
          현재 묶음
        </Text>
        {group.confidence < 0.5 ? <Text style={styles.needsReview}>직접 확인</Text> : null}
      </View>

      <GroupTray
        approveLabel={groupDecisions.length > 0 ? ko.review.approveChanged : undefined}
        busy={busy}
        group={group}
        items={groupItems}
        onApproveAll={(intent) => void approve(intent)}
        onChangeIntent={() => {
          setShowGroupAdjust(false);
          setShowIntentPicker((value) => !value);
        }}
        onReviewIndividually={() => {
          setShowGroupAdjust(false);
          setShowIntentPicker(false);
          setIndividualIndex(0);
        }}
      />

      {groupDecisions.length > 0 ? (
        <View style={styles.decisionSummary}>
          <Text style={styles.decisionSummaryTitle}>예외만 따로 저장했어요</Text>
          <Text style={styles.decisionSummaryBody}>
            {interpolate(ko.review.decisionSummary, {
              changed: groupDecisions.length,
              removed: removedDecisionCount,
            })}
          </Text>
        </View>
      ) : null}

      {showIntentPicker ? (
        <View accessibilityRole="radiogroup" style={styles.panel}>
          <Text style={styles.panelTitle}>{ko.review.changePrompt}</Text>
          <ScrollView
            contentContainerStyle={styles.intentOptions}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {intents.map((intent) => (
              <IntentChip
                accessibilityLabel={`묶음을 ${intentDestinationLabel[intent]} 보관`}
                intent={intent}
                key={intent}
                onPress={() => void changeIntent(intent)}
                role="radio"
                selected={intent === selectedIntent}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <ActionButton
        disabled={busy}
        label={ko.review.adjustGroup}
        onPress={() => {
          setShowIntentPicker(false);
          setShowGroupAdjust((value) => !value);
        }}
        variant="quiet"
      />

      {showGroupAdjust ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{ko.review.adjustGroup}</Text>
          <Text style={styles.panelBody}>{ko.review.adjustGroupBody}</Text>
          {groupDecisions.length > 0 ? (
            <Text style={styles.blockedCopy}>
              개별 변경을 저장한 뒤에는 이 묶음을 나누지 않아요. 먼저 변경한 내용으로 보관해 주세요.
            </Text>
          ) : group.itemIds.length > 1 && !group.splitFromGroupId ? (
            <ActionButton
              disabled={busy}
              label={ko.review.separateAll}
              onPress={() => void separateGroup()}
              variant="secondary"
            />
          ) : canRegroup ? (
            <ActionButton
              disabled={busy}
              label={ko.review.mergeAgain}
              onPress={() => void mergeGroup()}
              variant="secondary"
            />
          ) : (
            <Text style={styles.blockedCopy}>현재 묶음에서는 조정할 수 있는 항목이 없어요.</Text>
          )}
        </View>
      ) : null}

      {undoItemId ? (
        <UndoToast
          disabled={busy}
          message="앱에서 제거할 항목으로 표시했어요."
          onUndo={() => void undoRemoval(undoItemId)}
        />
      ) : null}
      <LiveStatus announcement={announcement} error={error} />
    </AppScreen>
  );
}

function ReviewHeader({ busy, onClose }: { busy: boolean; onClose: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>DAILY REVIEW</Text>
        <Text accessibilityRole="header" style={styles.title}>
          한 묶음씩 확인해요
        </Text>
      </View>
      <Pressable
        accessibilityHint="진행 상황을 저장하고 오늘 화면으로 돌아갑니다"
        accessibilityLabel={ko.review.close}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={onClose}
        style={styles.close}
      >
        <Text style={styles.closeText}>×</Text>
      </Pressable>
    </View>
  );
}

function LiveStatus({ announcement, error }: { announcement: string; error: string | null }) {
  return (
    <>
      {announcement ? (
        <Text accessibilityLiveRegion="polite" style={styles.announcement}>
          {announcement}
        </Text>
      ) : null}
      {error ? (
        <StatePanel description={error} kind="error" title="변경을 저장하지 못했어요" />
      ) : null}
    </>
  );
}

function ReviewComplete({
  session,
  items,
}: {
  session: DailyReviewSession;
  items: ReturnType<typeof useAppData>["items"];
}) {
  const router = useRouter();
  const reviewedItems = useMemo(() => {
    const ids = new Set(session.initialItemIds);
    return items.filter((item) => ids.has(item.id));
  }, [items, session.initialItemIds]);
  const counts = Object.fromEntries(
    intents.map((intent) => [
      intent,
      reviewedItems.filter((item) => item.intent === intent).length,
    ]),
  ) as Record<Intent, number>;
  const elapsedSeconds = Math.max(
    1,
    Math.round(
      (new Date(session.completedAt!).getTime() - new Date(session.startedAt).getTime()) / 1000,
    ),
  );
  const rediscoveryQuery =
    reviewedItems[0]?.analysis?.keywords.slice(0, 2).join(" ") || "오늘 보관";
  const savedItemCount = session.reviewedItemCount - session.removedItemCount;

  return (
    <AppScreen testID="review-complete-screen">
      <View style={styles.completeHero}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require("../../../assets/brand/echo/icon-master.png")}
          style={styles.completeMark}
        />
        <Text accessibilityRole="header" style={styles.completeTitle}>
          오늘 볼 장면은 여기까지예요.
        </Text>
        <Text style={styles.completeBody}>
          {session.removedItemCount > 0
            ? interpolate(ko.review.completeWithRemoved, {
                savedCount: savedItemCount,
                removedCount: session.removedItemCount,
              })
            : interpolate(ko.review.completeBody, {
                itemCount: session.reviewedItemCount,
                groupCount: session.groupIds.length,
              })}
        </Text>
        <Text style={styles.completeTime}>
          {interpolate(ko.review.completeTime, { seconds: elapsedSeconds })}
        </Text>
      </View>

      <View style={styles.summary}>
        {intents
          .filter((intent) => counts[intent] > 0)
          .map((intent) => (
            <IntentChip count={counts[intent]} intent={intent} key={intent} />
          ))}
      </View>

      <View style={styles.completeActions}>
        <ActionButton
          label={ko.review.viewLibrary}
          onPress={() => router.replace("/(tabs)/library")}
        />
        <ActionButton
          label={ko.review.rediscover}
          onPress={() =>
            router.replace({ pathname: "/(tabs)/search", params: { q: rediscoveryQuery } })
          }
          variant="secondary"
        />
        <ActionButton
          label={ko.review.backToday}
          onPress={() => router.replace("/(tabs)")}
          variant="quiet"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: tokens.space[3] },
  headerCopy: { flex: 1, gap: tokens.space[1] },
  eyebrow: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.label.fontSize,
    lineHeight: tokens.typography.label.lineHeight,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.typography.screenTitle.fontSize,
    lineHeight: tokens.typography.screenTitle.lineHeight,
    fontWeight: "700",
  },
  close: {
    width: tokens.size.touchTarget,
    height: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.surface,
  },
  closeText: { color: tokens.color.ink, fontSize: 24 },
  currentLabel: { flexDirection: "row", alignItems: "center", gap: tokens.space[2] },
  currentTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.sectionTitle.fontSize,
    lineHeight: tokens.typography.sectionTitle.lineHeight,
    fontWeight: "700",
  },
  needsReview: {
    paddingHorizontal: tokens.space[2],
    paddingVertical: tokens.space[1],
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.label.fontSize,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surface,
  },
  panel: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surface,
  },
  panelTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.bodyStrong.fontSize,
    lineHeight: tokens.typography.bodyStrong.lineHeight,
    fontWeight: "700",
  },
  panelBody: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  blockedCopy: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  intentOptions: { gap: tokens.space[2], paddingRight: tokens.space[3] },
  decisionSummary: {
    gap: tokens.space[1],
    padding: tokens.space[4],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.surfaceMuted,
  },
  decisionSummaryTitle: { color: tokens.color.ink, fontSize: 14, fontWeight: "700" },
  decisionSummaryBody: { color: tokens.color.inkSecondary, fontSize: 12, lineHeight: 18 },
  announcement: {
    color: tokens.color.success,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  completeHero: {
    padding: tokens.space[6],
    alignItems: "center",
    gap: tokens.space[3],
    borderRadius: tokens.radius.sheet,
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: tokens.color.surfaceRaised,
  },
  completeMark: { width: 92, height: 92, borderRadius: 24 },
  completeTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.screenTitle.fontSize,
    lineHeight: tokens.typography.screenTitle.lineHeight,
    fontWeight: "700",
    textAlign: "center",
  },
  completeBody: {
    color: tokens.color.ink,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
    textAlign: "center",
  },
  completeTime: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: tokens.space[2] },
  completeActions: { gap: tokens.space[2] },
});
