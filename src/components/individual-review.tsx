import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { Intent, ReviewItemDecision, ScreenshotItem } from "@/contracts/domain";
import { intentDestinationLabel } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

import { ActionButton } from "./action-button";
import { IntentChip } from "./intent-chip";
import { ScreenshotCard } from "./screenshot-card";

const intents: Intent[] = ["reference", "want", "share", "read", "keep"];

interface IndividualReviewProps {
  item: ScreenshotItem;
  decision?: ReviewItemDecision;
  selectedIntent: Intent;
  current: number;
  total: number;
  busy: boolean;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSelectIntent: (intent: Intent) => void;
  onKeep: () => void;
  onRemove: () => void;
  onUndoRemoval: () => void;
}

export function IndividualReview({
  item,
  decision,
  selectedIntent,
  current,
  total,
  busy,
  onBack,
  onPrevious,
  onNext,
  onSelectIntent,
  onKeep,
  onRemove,
  onUndoRemoval,
}: IndividualReviewProps) {
  const removed = decision?.outcome === "removed";
  return (
    <View style={styles.wrapper}>
      <View style={styles.modeHeader}>
        <View style={styles.modeCopy}>
          <Text accessibilityRole="header" style={styles.title}>
            필요한 장면만 바꿔요
          </Text>
          <Text style={styles.helper}>
            나머지는 묶음의 현재 분류로 보관됩니다. 변경은 묶음 승인 전까지 저장돼요.
          </Text>
        </View>
        <ActionButton label="묶음으로 돌아가기" onPress={onBack} variant="quiet" />
      </View>

      <View style={styles.itemProgress}>
        <Text style={styles.itemProgressText}>
          {current} / {total}장
        </Text>
        <Text style={[styles.decisionState, removed && styles.removedState]}>
          {removed ? "앱에서 제거 예정" : decision ? "개별 변경 저장됨" : "묶음 분류 사용"}
        </Text>
      </View>

      <ScreenshotCard item={item} variant="review" />

      {removed ? (
        <View style={styles.removedPanel}>
          <Text style={styles.removedTitle}>이 캡처는 앱에서만 제거할 예정이에요.</Text>
          <Text style={styles.removedBody}>기기 사진 원본과 다른 캡처는 그대로 유지됩니다.</Text>
          <ActionButton
            disabled={busy}
            label="다시 보관"
            onPress={onUndoRemoval}
            variant="secondary"
          />
        </View>
      ) : (
        <>
          <View style={styles.intentSection}>
            <Text style={styles.sectionTitle}>이 장만 어디에 보관할까요?</Text>
            <ScrollView
              contentContainerStyle={styles.intentOptions}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {intents.map((intent) => (
                <IntentChip
                  accessibilityLabel={`이 장을 ${intentDestinationLabel[intent]} 보관`}
                  intent={intent}
                  key={intent}
                  onPress={() => onSelectIntent(intent)}
                  role="radio"
                  selected={intent === selectedIntent}
                />
              ))}
            </ScrollView>
          </View>
          <ActionButton
            disabled={busy}
            label={`이 장만 ${intentDestinationLabel[selectedIntent]} 보관`}
            onPress={onKeep}
          />
          <ActionButton
            accessibilityHint="기기 사진 원본은 삭제하지 않습니다"
            disabled={busy}
            label="앱에서만 제거"
            onPress={onRemove}
            variant="danger"
          />
        </>
      )}

      <View style={styles.navigation}>
        <View style={styles.navigationButton}>
          <ActionButton
            disabled={busy || current === 1}
            label="← 이전 장"
            onPress={onPrevious}
            variant="secondary"
          />
        </View>
        <View style={styles.navigationButton}>
          <ActionButton
            disabled={busy || current === total}
            label="다음 장 →"
            onPress={onNext}
            variant="secondary"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: tokens.space[5] },
  modeHeader: { gap: tokens.space[2] },
  modeCopy: { gap: tokens.space[1] },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.typography.sectionTitle.fontSize,
    lineHeight: tokens.typography.sectionTitle.lineHeight,
    fontWeight: "700",
  },
  helper: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  itemProgress: { flexDirection: "row", alignItems: "center", gap: tokens.space[2] },
  itemProgressText: {
    color: tokens.color.ink,
    fontSize: tokens.typography.bodyStrong.fontSize,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  decisionState: {
    marginLeft: "auto",
    paddingHorizontal: tokens.space[2],
    paddingVertical: tokens.space[1],
    color: tokens.color.success,
    fontSize: tokens.typography.label.fontSize,
    fontWeight: "700",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.successSoft,
  },
  removedState: { color: tokens.color.danger, backgroundColor: tokens.color.dangerSoft },
  intentSection: { gap: tokens.space[3] },
  sectionTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.bodyStrong.fontSize,
    lineHeight: tokens.typography.bodyStrong.lineHeight,
    fontWeight: "700",
  },
  intentOptions: { gap: tokens.space[2], paddingRight: tokens.space[4] },
  removedPanel: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderWidth: 1,
    borderColor: tokens.color.danger,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.dangerSoft,
  },
  removedTitle: { color: tokens.color.ink, fontSize: 15, lineHeight: 22, fontWeight: "700" },
  removedBody: { color: tokens.color.inkSecondary, fontSize: 13, lineHeight: 18 },
  navigation: { flexDirection: "row", gap: tokens.space[2] },
  navigationButton: { flex: 1 },
});
