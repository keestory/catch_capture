import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "@/components/action-button";
import { BrandMark } from "@/components/brand-mark";
import { MockScreenshotScene } from "@/components/mock-screenshot-scene";
import type { ScreenshotItem } from "@/contracts/domain";
import { mockScreenshotItems } from "@/data/mock-data";
import {
  getNextOnboardingRetentionStage,
  getPreviousOnboardingRetentionStage,
  onboardingRetentionStages,
  type OnboardingRetentionStage,
} from "@/design-lab/onboarding-retention-model";
import { tokens } from "@/theme/tokens";

const getLabItem = (id: string): ScreenshotItem => {
  const item = mockScreenshotItems.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`디자인 랩 항목 ${id}을 찾지 못했어요.`);
  return item;
};

const screenshots = {
  live: getLabItem("reference-live-shopping"),
  seller: getLabItem("reference-seller-story"),
  caps: getLabItem("want-cap"),
  nightlife: getLabItem("keep-landscape"),
} as const;

export default function OnboardingRetentionLabScreen() {
  const [stage, setStage] = useState<OnboardingRetentionStage>("prepared");
  const index = onboardingRetentionStages.indexOf(stage);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        {index > 0 ? (
          <Pressable
            accessibilityLabel="이전 장면"
            accessibilityRole="button"
            onPress={() => setStage(getPreviousOnboardingRetentionStage(stage))}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backLabel}>이전</Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        <BrandMark compact showGlyph={false} />
        <Text accessibilityLabel={`${index + 1}단계, 전체 4단계`} style={styles.progressLabel}>
          {index + 1} / 4
        </Text>
      </View>

      {stage === "prepared" ? <PreparedStage /> : null}
      {stage === "review" ? <ReviewStage /> : null}
      {stage === "complete" ? <CompleteStage /> : null}
      {stage === "recall" ? <RecallStage /> : null}

      <View style={styles.footer}>
        <ActionButton
          label={ctaLabel[stage]}
          onPress={() =>
            setStage(stage === "recall" ? "prepared" : getNextOnboardingRetentionStage(stage))
          }
        />
      </View>
    </SafeAreaView>
  );
}

const ctaLabel: Record<OnboardingRetentionStage, string> = {
  prepared: "첫 묶음 확인하기",
  review: "참고로 보관",
  complete: "내일 다시 꺼내기",
  recall: "처음부터 다시 보기",
};

function PreparedStage() {
  return (
    <StageScroll>
      <View style={styles.introCopy}>
        <Text accessibilityRole="header" style={styles.displayTitle}>
          8장을 3묶음으로{"\n"}준비했어요.
        </Text>
        <Text style={styles.lead}>비슷한 과거 장면 2개도 함께 찾았어요.</Text>
      </View>

      <View
        accessibilityLabel="오늘 캡처한 라이브 쇼핑 장면 두 개와 3주 전 쇼핑 캡처 한 개가 연결된 모습"
        style={styles.memoryConnection}
      >
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>오늘 · 8월 22일</Text>
          <Text style={styles.dateLabel}>3주 전 · 8월 1일</Text>
        </View>
        <View style={styles.screenshotRow}>
          <ScreenshotThumb
            accessibilityLabel="Whatnot 라이브 커머스 경매 화면"
            source={screenshots.live}
          />
          <ScreenshotThumb
            accessibilityLabel="Instagram 셀러 스케일업 프로그램 화면"
            source={screenshots.seller}
          />
          <ScreenshotThumb
            accessibilityLabel="여러 색상의 모자 상품 화면"
            source={screenshots.caps}
          />
        </View>
        <View accessibilityElementsHidden style={styles.connectionRail}>
          <View style={styles.connectionLine} />
          <View style={styles.connectionPoint} />
        </View>
      </View>

      <View style={styles.outcomes}>
        <Outcome label="자동 정리 · 8장 → 3묶음" sentence="한 장씩 분류하지 않아도 돼요." />
        <Outcome label="재발견 · 지난 장면 2개" sentence="잊고 있던 장면을 다시 볼 수 있어요." />
      </View>
    </StageScroll>
  );
}

function ReviewStage() {
  return (
    <StageScroll>
      <View style={styles.introCopy}>
        <Text style={styles.eyebrow}>첫 묶음 · 2장</Text>
        <Text accessibilityRole="header" style={styles.screenTitle}>
          라이브 쇼핑에서{"\n"}눈에 띈 운영 방식
        </Text>
        <Text style={styles.lead}>한 장씩 열지 않아도 묶음 전체를 먼저 이해할 수 있어요.</Text>
      </View>

      <View style={styles.reviewMedia}>
        <View accessibilityLabel="라이브 커머스 경매 화면 예시" style={styles.reviewImage}>
          <MockScreenshotScene item={screenshots.live} />
        </View>
        <Text style={styles.pager}>1 / 2</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>내용 요약</Text>
        <Text style={styles.summaryText}>
          영상, 댓글, 상품 카드와 경매 상태가 한 화면에 겹쳐진 라이브 쇼핑 UI예요.
        </Text>
        <Text style={styles.reasonLabel}>함께 묶은 이유</Text>
        <Text style={styles.reasonText}>판매자 진행 화면과 구매 유도 요소가 이어져 있어요.</Text>
      </View>
    </StageScroll>
  );
}

function CompleteStage() {
  return (
    <StageScroll>
      <View style={styles.introCopy}>
        <Text style={styles.eyebrow}>첫 정리 완료</Text>
        <Text accessibilityRole="header" style={styles.displayTitle}>
          8장을 3묶음으로{"\n"}보관했어요.
        </Text>
        <Text style={styles.lead}>다시 필요할 때 Echo가 먼저 꺼내드릴게요.</Text>
      </View>

      <View style={styles.completionMedia}>
        <View accessibilityLabel="저장된 소셜 장면 예시" style={styles.completionImage}>
          <MockScreenshotScene item={screenshots.nightlife} />
        </View>
        <View style={styles.completionCaption}>
          <Text style={styles.completionMeta}>3주 전 보관 · 간직</Text>
          <Text style={styles.completionTitle}>서울 안 부럽다. 용인 저녁 바이브</Text>
        </View>
      </View>

      <View style={styles.outcomes}>
        <Outcome label="오늘의 결과" sentence="8장 중 8장을 열지 않고 정리했어요." />
        <Outcome label="다음 가치" sentence="지난 장면은 새 캡처가 없어도 다시 보여드려요." />
      </View>
    </StageScroll>
  );
}

function RecallStage() {
  return (
    <StageScroll>
      <View style={styles.introCopy}>
        <Text style={styles.eyebrow}>다음 날 · 다시 꺼낸 장면</Text>
        <Text accessibilityRole="header" style={styles.screenTitle}>
          어제 저장한 흐름과{"\n"}비슷한 장면이에요.
        </Text>
        <Text style={styles.lead}>새 캡처가 없어도 이전 관심사가 다시 이어집니다.</Text>
      </View>

      <View style={styles.recallPost}>
        <View accessibilityLabel="여러 색상의 모자 상품 화면 예시" style={styles.recallImage}>
          <MockScreenshotScene item={screenshots.caps} />
        </View>
        <View style={styles.recallCopy}>
          <Text style={styles.recallMeta}>3주 전 · 쇼핑</Text>
          <Text style={styles.recallTitle}>색상 옵션을 비교하던 모자</Text>
          <Text style={styles.recallReason}>어제 본 판매 상품 UI와 화면 구성이 비슷해요.</Text>
        </View>
      </View>
    </StageScroll>
  );
}

function StageScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

function ScreenshotThumb({
  source,
  accessibilityLabel,
}: {
  source: ScreenshotItem;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.thumbFrame}>
      <View accessibilityLabel={accessibilityLabel} style={styles.thumbImage}>
        <MockScreenshotScene item={source} />
      </View>
    </View>
  );
}

function Outcome({ label, sentence }: { label: string; sentence: string }) {
  return (
    <View style={styles.outcome}>
      <Text style={styles.outcomeLabel}>{label}</Text>
      <Text style={styles.outcomeSentence}>{sentence}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.color.canvas },
  topBar: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    minHeight: tokens.size.touchTarget,
    paddingHorizontal: tokens.layout.screenPadding,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    minWidth: tokens.size.touchTarget,
    minHeight: tokens.size.touchTarget,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backLabel: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
    fontWeight: "600",
  },
  progressLabel: {
    minWidth: tokens.size.touchTarget,
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
    textAlign: "right",
  },
  pressed: { opacity: 0.56 },
  scrollContent: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    alignSelf: "center",
    gap: tokens.space[8],
    paddingHorizontal: tokens.layout.screenPadding,
    paddingTop: tokens.space[6],
    paddingBottom: tokens.space[8],
  },
  introCopy: { gap: tokens.space[3] },
  displayTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.display.fontSize,
    lineHeight: tokens.typography.display.lineHeight,
    fontWeight: "800",
    letterSpacing: tokens.typography.display.letterSpacing,
  },
  screenTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.screenTitle.fontSize,
    lineHeight: tokens.typography.screenTitle.lineHeight,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  lead: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
  eyebrow: {
    color: tokens.color.primary,
    fontSize: tokens.typography.eyebrow.fontSize,
    lineHeight: tokens.typography.eyebrow.lineHeight,
    fontWeight: "800",
    letterSpacing: tokens.typography.eyebrow.letterSpacing,
  },
  memoryConnection: { gap: tokens.space[3] },
  dateRow: {
    paddingHorizontal: tokens.space[2],
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateLabel: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    fontWeight: "600",
  },
  screenshotRow: { flexDirection: "row", gap: tokens.space[2] },
  thumbFrame: {
    flex: 1,
    height: 250,
    overflow: "hidden",
    borderWidth: tokens.layout.hairline,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.surface,
  },
  thumbImage: { width: "100%", height: "100%" },
  connectionRail: {
    height: tokens.space[4],
    alignItems: "center",
    justifyContent: "center",
  },
  connectionLine: {
    position: "absolute",
    right: tokens.space[6],
    left: tokens.space[6],
    height: tokens.layout.signalLine,
    backgroundColor: tokens.color.primary,
  },
  connectionPoint: {
    width: tokens.space[3],
    height: tokens.space[3],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.signal,
  },
  outcomes: { gap: tokens.space[6] },
  outcome: { gap: tokens.space[2] },
  outcomeLabel: {
    color: tokens.color.primary,
    fontSize: tokens.typography.label.fontSize,
    lineHeight: tokens.typography.label.lineHeight,
    fontWeight: "700",
  },
  outcomeSentence: {
    color: tokens.color.ink,
    fontSize: tokens.typography.sectionTitle.fontSize,
    lineHeight: tokens.typography.sectionTitle.lineHeight,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  reviewMedia: {
    minHeight: 398,
    overflow: "hidden",
    borderWidth: tokens.layout.hairline,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.canvasDeep,
  },
  reviewImage: { width: "100%", height: 368 },
  pager: {
    minHeight: 30,
    paddingTop: tokens.space[2],
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    fontWeight: "700",
    textAlign: "center",
  },
  summary: { gap: tokens.space[2] },
  summaryLabel: {
    color: tokens.color.primary,
    fontSize: tokens.typography.label.fontSize,
    lineHeight: tokens.typography.label.lineHeight,
    fontWeight: "700",
  },
  summaryText: {
    color: tokens.color.ink,
    fontSize: tokens.typography.sectionTitle.fontSize,
    lineHeight: tokens.typography.sectionTitle.lineHeight,
    fontWeight: "700",
  },
  reasonLabel: {
    marginTop: tokens.space[3],
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.label.fontSize,
    lineHeight: tokens.typography.label.lineHeight,
    fontWeight: "700",
  },
  reasonText: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
  completionMedia: {
    overflow: "hidden",
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.ink,
  },
  completionImage: { width: "100%", height: 360 },
  completionCaption: { gap: tokens.space[1], padding: tokens.space[4] },
  completionMeta: {
    color: tokens.color.lineStrong,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  completionTitle: {
    color: tokens.color.surface,
    fontSize: tokens.typography.cardTitle.fontSize,
    lineHeight: tokens.typography.cardTitle.lineHeight,
    fontWeight: "700",
  },
  recallPost: {
    overflow: "hidden",
    borderWidth: tokens.layout.hairline,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surface,
  },
  recallImage: { width: "100%", height: 420, backgroundColor: tokens.color.surfaceMuted },
  recallCopy: { gap: tokens.space[1], padding: tokens.space[4] },
  recallMeta: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  recallTitle: {
    color: tokens.color.ink,
    fontSize: tokens.typography.sectionTitle.fontSize,
    lineHeight: tokens.typography.sectionTitle.lineHeight,
    fontWeight: "700",
  },
  recallReason: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
  },
  footer: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    paddingHorizontal: tokens.layout.screenPadding,
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[3],
    alignSelf: "center",
    backgroundColor: tokens.color.canvas,
  },
});
