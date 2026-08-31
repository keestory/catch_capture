import type {
  DailyRecallSnapshot,
  Intent,
  RecallCandidate,
  RecallEvidence,
  RecallInteraction,
  RecallReasonCode,
  ScreenshotItem,
} from "@/contracts/domain";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";

export const RECALL_POLICY_VERSION = "recall-v1";
export const RECALL_DAILY_LIMIT = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_OPEN_COOLDOWN_DAYS = 7;
const RECENT_SHOWN_COOLDOWN_DAYS = 14;

export interface RecallIntentWindow {
  minAgeDays: number;
  defaultMaxAgeDays: number;
  hardMaxAgeDays: number;
}

/**
 * The default window follows the useful lifetime of each intent. `hardMaxAgeDays`
 * can only be reached by an exact entity match plus a second supporting signal.
 */
export const recallIntentWindows: Record<Intent, RecallIntentWindow> = {
  share: { minAgeDays: 2, defaultMaxAgeDays: 14, hardMaxAgeDays: 30 },
  want: { minAgeDays: 3, defaultMaxAgeDays: 45, hardMaxAgeDays: 90 },
  read: { minAgeDays: 7, defaultMaxAgeDays: 30, hardMaxAgeDays: 90 },
  reference: { minAgeDays: 14, defaultMaxAgeDays: 180, hardMaxAgeDays: 365 },
  keep: { minAgeDays: 30, defaultMaxAgeDays: 365, hardMaxAgeDays: 730 },
};

export interface RecallMatchSignals {
  textSimilarity?: number;
  visualSimilarity?: number;
}

export interface BuildRecallPolicyInput {
  items: ScreenshotItem[];
  anchorItems?: ScreenshotItem[];
  interactions?: RecallInteraction[];
  now: string;
  recallDate?: string;
  limit?: number;
  matchSignals?: Record<string, RecallMatchSignals>;
}

interface ActivityState {
  lastOpenedAt?: string;
  lastShownAt?: string;
  snoozedUntil?: string;
  dismissed: boolean;
  completed: boolean;
  expired: boolean;
}

interface ScoredCandidate {
  candidate: RecallCandidate;
  item: ScreenshotItem;
  sourceKey: string;
  intent: Intent;
}

const clamp01 = (value = 0): number => Math.min(1, Math.max(0, value));

const timestamp = (value?: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const elapsedDays = (earlier: string, later: string): number | undefined => {
  const start = timestamp(earlier);
  const end = timestamp(later);
  if (start === undefined || end === undefined || end < start) return undefined;
  return (end - start) / DAY_MS;
};

const normalize = (value: string): string =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const itemIntent = (item: ScreenshotItem): Intent | undefined =>
  item.intent ?? item.analysis?.suggestedIntent;

const sourceKey = (item: ScreenshotItem): string =>
  normalize(item.source.domain ?? item.source.appName ?? "unknown");

const keywords = (item: ScreenshotItem): string[] =>
  (item.analysis?.keywords ?? [])
    .map(normalize)
    .filter((value) => value.length >= 2)
    .slice(0, 24);

const entities = (item: ScreenshotItem): string[] =>
  (item.analysis?.extractedEntities ?? [])
    .filter((entity) => entity.type !== "date" && entity.type !== "price")
    .map((entity) => normalize(entity.value))
    .filter((value) => value.length >= 2)
    .slice(0, 16);

const latest = (left?: string, right?: string): string | undefined => {
  if (!left) return right;
  if (!right) return left;
  return left.localeCompare(right) >= 0 ? left : right;
};

export function deriveRecallActivity(
  itemId: string,
  interactions: RecallInteraction[],
): ActivityState {
  const events = interactions
    .filter((interaction) => interaction.itemId === itemId)
    .sort((left, right) =>
      left.occurredAt === right.occurredAt
        ? left.id.localeCompare(right.id)
        : left.occurredAt.localeCompare(right.occurredAt),
    );
  const state: ActivityState = { dismissed: false, completed: false, expired: false };

  for (const event of events) {
    if (event.type === "opened") state.lastOpenedAt = latest(state.lastOpenedAt, event.occurredAt);
    if (event.type === "shown") state.lastShownAt = latest(state.lastShownAt, event.occurredAt);
    if (event.type === "snoozed") state.snoozedUntil = event.snoozedUntil;
    if (event.type === "dismissed") state.dismissed = true;
    if (event.type === "completed") state.completed = true;
    if (event.type === "expired") state.expired = true;
    if (event.type === "restored") {
      state.dismissed = false;
      state.completed = false;
      state.expired = false;
      state.snoozedUntil = undefined;
    }
  }

  return state;
}

const withinCooldown = (value: string | undefined, now: string, days: number): boolean => {
  if (!value) return false;
  const age = elapsedDays(value, now);
  return age !== undefined && age < days;
};

const firstShared = (left: string[], right: string[]): string | undefined => {
  const rightSet = new Set(right);
  return left.find((value) => rightSet.has(value));
};

interface AnchorMatch {
  anchor: ScreenshotItem;
  relevance: number;
  exactEntity?: string;
  sharedKeyword?: string;
  sameSource: boolean;
  sameContentType: boolean;
  textSimilarity: number;
  visualSimilarity: number;
  strongResurrection: boolean;
}

const matchKey = (candidateId: string, anchorId: string): string => `${candidateId}:${anchorId}`;

function bestAnchorMatch(
  item: ScreenshotItem,
  anchors: ScreenshotItem[],
  signals: Record<string, RecallMatchSignals>,
): AnchorMatch | undefined {
  const itemEntities = entities(item);
  const itemKeywords = keywords(item);

  return anchors
    .filter((anchor) => anchor.id !== item.id && !isScreenshotSensitive(anchor))
    .map((anchor): AnchorMatch => {
      const exactEntity = firstShared(itemEntities, entities(anchor));
      const sharedKeyword = firstShared(itemKeywords, keywords(anchor));
      const sameSource = sourceKey(item) !== "unknown" && sourceKey(item) === sourceKey(anchor);
      const sameContentType = Boolean(
        item.contentType && anchor.contentType && item.contentType === anchor.contentType,
      );
      const provided = signals[matchKey(item.id, anchor.id)] ?? {};
      const textSimilarity = clamp01(provided.textSimilarity ?? (sharedKeyword ? 0.58 : 0));
      const visualSimilarity = clamp01(provided.visualSimilarity);
      const relevance =
        (exactEntity ? 0.35 : 0) +
        textSimilarity * 0.25 +
        visualSimilarity * 0.25 +
        (sameSource && sameContentType ? 0.1 : sameSource || sameContentType ? 0.05 : 0) +
        (itemIntent(item) === itemIntent(anchor) ? 0.05 : 0);
      const secondSignal =
        textSimilarity >= 0.55 || visualSimilarity >= 0.75 || sameSource || sameContentType;
      return {
        anchor,
        relevance,
        exactEntity,
        sharedKeyword,
        sameSource,
        sameContentType,
        textSimilarity,
        visualSimilarity,
        strongResurrection: Boolean(exactEntity && secondSignal),
      };
    })
    .sort(
      (left, right) =>
        right.relevance - left.relevance || left.anchor.id.localeCompare(right.anchor.id),
    )[0];
}

const decideReason = (match?: AnchorMatch): RecallReasonCode => {
  if (match?.exactEntity) return "same_entity";
  if (match?.sharedKeyword || (match?.textSimilarity ?? 0) >= 0.55) return "same_keywords";
  if (match?.sameSource && match.sameContentType) return "same_source_pattern";
  return "unfinished_intent";
};

const buildEvidence = (match?: AnchorMatch): RecallEvidence => ({
  sharedEntity: match?.exactEntity,
  sharedKeyword: match?.sharedKeyword,
  sourceName: match?.sameSource ? match.anchor.source.appName : undefined,
});

const expiresAt = (now: string): string => {
  const time = timestamp(now);
  if (time === undefined) throw new Error("올바른 기준 시각이 필요합니다.");
  return new Date(time + DAY_MS).toISOString();
};

const canEnterPolicy = (
  item: ScreenshotItem,
  activity: ActivityState,
  now: string,
): { intent: Intent; ageDays: number; window: RecallIntentWindow } | undefined => {
  // Privacy and lifecycle checks must happen before reading analysis text or source details.
  if (isScreenshotSensitive(item) || item.status !== "saved") return undefined;
  const intent = item.intent;
  const ageDays = elapsedDays(item.capturedAt, now);
  if (!intent || ageDays === undefined) return undefined;
  const window = recallIntentWindows[intent];
  if (ageDays < window.minAgeDays || ageDays > window.hardMaxAgeDays) return undefined;
  if (activity.dismissed || activity.completed || activity.expired) return undefined;
  const snoozedUntil = timestamp(activity.snoozedUntil);
  const nowTimestamp = timestamp(now);
  if (snoozedUntil !== undefined && nowTimestamp !== undefined && snoozedUntil > nowTimestamp) {
    return undefined;
  }
  if (withinCooldown(activity.lastOpenedAt, now, RECENT_OPEN_COOLDOWN_DAYS)) return undefined;
  if (withinCooldown(activity.lastShownAt, now, RECENT_SHOWN_COOLDOWN_DAYS)) return undefined;
  return { intent, ageDays, window };
};

const recencyScore = (ageDays: number, window: RecallIntentWindow): number => {
  if (ageDays <= window.defaultMaxAgeDays) {
    const span = Math.max(1, window.defaultMaxAgeDays - window.minAgeDays);
    return clamp01(1 - (ageDays - window.minAgeDays) / span);
  }
  return 0;
};

const intentDueScore = (ageDays: number, window: RecallIntentWindow): number =>
  clamp01(ageDays / Math.max(1, window.defaultMaxAgeDays));

const roundScore = (score: number): number => Math.round(score * 10_000) / 10_000;

function scoreItem(
  item: ScreenshotItem,
  anchors: ScreenshotItem[],
  interactions: RecallInteraction[],
  now: string,
  signals: Record<string, RecallMatchSignals>,
): ScoredCandidate | undefined {
  const activity = deriveRecallActivity(item.id, interactions);
  const eligible = canEnterPolicy(item, activity, now);
  if (!eligible) return undefined;

  const match = bestAnchorMatch(item, anchors, signals);
  const isAgedOut = eligible.ageDays > eligible.window.defaultMaxAgeDays;
  if (isAgedOut && !match?.strongResurrection) return undefined;

  const reasonCode = decideReason(match);
  const relevance = match?.relevance ?? 0;
  const score = roundScore(
    relevance * 0.65 +
      intentDueScore(eligible.ageDays, eligible.window) * 0.2 +
      recencyScore(eligible.ageDays, eligible.window) * 0.15,
  );
  const hasCurrentConnection = reasonCode !== "unfinished_intent";
  if (hasCurrentConnection && score < 0.3) return undefined;
  if (!hasCurrentConnection && score < 0.16) return undefined;

  return {
    item,
    intent: eligible.intent,
    sourceKey: sourceKey(item),
    candidate: {
      id: `recall-${item.id}-${now.slice(0, 10)}`,
      itemId: item.id,
      anchorItemId: match && hasCurrentConnection ? match.anchor.id : undefined,
      reasonCode,
      evidence: buildEvidence(match),
      score,
      policyVersion: RECALL_POLICY_VERSION,
      generatedAt: now,
      expiresAt: expiresAt(now),
    },
  };
}

function diversify(scored: ScoredCandidate[], limit: number): RecallCandidate[] {
  const intentCounts = new Map<Intent, number>();
  const sourceCounts = new Map<string, number>();
  const selected: RecallCandidate[] = [];

  for (const value of scored) {
    if (selected.length >= limit) break;
    if ((intentCounts.get(value.intent) ?? 0) >= 2) continue;
    if (value.sourceKey !== "unknown" && (sourceCounts.get(value.sourceKey) ?? 0) >= 2) continue;
    selected.push(value.candidate);
    intentCounts.set(value.intent, (intentCounts.get(value.intent) ?? 0) + 1);
    sourceCounts.set(value.sourceKey, (sourceCounts.get(value.sourceKey) ?? 0) + 1);
  }

  return selected;
}

export function buildDailyRecallSnapshot(input: BuildRecallPolicyInput): DailyRecallSnapshot {
  if (timestamp(input.now) === undefined) throw new Error("올바른 기준 시각이 필요합니다.");
  const limit = Math.min(RECALL_DAILY_LIMIT, Math.max(0, input.limit ?? RECALL_DAILY_LIMIT));
  const safeAnchors = (input.anchorItems ?? []).filter(
    (item) =>
      !isScreenshotSensitive(item) &&
      item.status !== "removed" &&
      item.status !== "deleted_from_device" &&
      item.status !== "completed",
  );
  const scored = input.items
    .map((item) =>
      scoreItem(item, safeAnchors, input.interactions ?? [], input.now, input.matchSignals ?? {}),
    )
    .filter((value): value is ScoredCandidate => Boolean(value))
    .sort(
      (left, right) =>
        right.candidate.score - left.candidate.score ||
        right.item.capturedAt.localeCompare(left.item.capturedAt) ||
        left.item.id.localeCompare(right.item.id),
    );
  const recallDate = input.recallDate ?? input.now.slice(0, 10);

  return {
    id: `recall-day-${recallDate}`,
    recallDate,
    candidates: diversify(scored, limit),
    generatedAt: input.now,
    policyVersion: RECALL_POLICY_VERSION,
  };
}

export function presentRecallReason(candidate: RecallCandidate, ageLabel: string): string {
  if (candidate.reasonCode === "same_entity" && candidate.evidence.sharedEntity) {
    return `오늘 캡처와 ‘${candidate.evidence.sharedEntity}’ 단서가 같아요.`;
  }
  if (candidate.reasonCode === "same_keywords" && candidate.evidence.sharedKeyword) {
    return `오늘 캡처와 ‘${candidate.evidence.sharedKeyword}’ 내용이 이어져요.`;
  }
  if (candidate.reasonCode === "same_source_pattern" && candidate.evidence.sourceName) {
    return `오늘 본 ${candidate.evidence.sourceName} 화면과 구성이 비슷해요.`;
  }
  return `${ageLabel}에 보관한 장면을 아직 활용하지 않았어요.`;
}
