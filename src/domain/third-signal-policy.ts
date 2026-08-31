import type {
  ActionDraftInteraction,
  ActionDraftType,
  Intent,
  ScreenshotGroup,
  ScreenshotItem,
  ThirdSignalSuggestion,
} from "@/contracts/domain";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";

export const THIRD_SIGNAL_POLICY_VERSION = "third-signal-v1";
export const THIRD_SIGNAL_MIN_ITEMS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

const usefulSpanDays: Record<ActionDraftType, number> = {
  product_decision: 45,
  reference_board: 90,
  article_brief: 30,
  share_pack: 14,
};

const artifactFor = (intent: Intent, group: ScreenshotGroup): ActionDraftType | undefined => {
  if (intent === "want" && group.type === "same_entity") return "product_decision";
  if (intent === "reference" && (group.type === "same_entity" || group.type === "same_topic")) {
    return "reference_board";
  }
  if (intent === "read" && group.type === "same_topic") return "article_brief";
  if (intent === "share" && group.type === "same_topic") return "share_pack";
  return undefined;
};

const normalizedSubject = (title: string): string =>
  title
    .replace(/^같은\s+/, "")
    .replace(/\s+\d+장$/, "")
    .trim();

const parseTime = (value: string): number | undefined => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const withinUsefulSpan = (items: ScreenshotItem[], maxDays: number): boolean => {
  const times = items.map((item) => parseTime(item.capturedAt));
  if (times.some((value) => value === undefined)) return false;
  const validTimes = times as number[];
  return (Math.max(...validTimes) - Math.min(...validTimes)) / DAY_MS <= maxDays;
};

const finalIntent = (
  group: ScreenshotGroup,
  items: ScreenshotItem[],
): Exclude<Intent, "keep"> | undefined => {
  const intents = new Set(
    items.map((item) => item.intent ?? group.approvedIntent ?? group.reviewIntent).filter(Boolean),
  );
  if (intents.size !== 1) return undefined;
  const intent = [...intents][0];
  return intent && intent !== "keep" ? intent : undefined;
};

const hasDistinctEvidence = (items: ScreenshotItem[]): boolean => {
  const signatures = new Set(
    items.map((item) =>
      [
        item.analysis?.title,
        ...(item.analysis?.keywords ?? []),
        ...(item.analysis?.extractedEntities?.map((entity) => `${entity.type}:${entity.value}`) ??
          []),
      ]
        .filter(Boolean)
        .join("|")
        .toLocaleLowerCase("ko-KR"),
    ),
  );
  return signatures.size >= 2;
};

export interface BuildThirdSignalInput {
  items: ScreenshotItem[];
  groups: ScreenshotGroup[];
  interactions?: ActionDraftInteraction[];
  now: string;
  limit?: number;
}

/**
 * Turns a verified repeated-capture group into one explicit next-action draft.
 * This does not create, share, upload, or delete anything automatically.
 */
export function buildThirdSignalSuggestions(input: BuildThirdSignalInput): ThirdSignalSuggestion[] {
  if (parseTime(input.now) === undefined) throw new Error("올바른 기준 시각이 필요합니다.");
  const itemById = new Map(input.items.map((item) => [item.id, item]));
  const resolvedSuggestionIds = new Set(
    (input.interactions ?? [])
      .filter((interaction) => interaction.type === "accepted" || interaction.type === "dismissed")
      .map((interaction) => interaction.suggestionId),
  );
  const limit = Math.max(0, Math.min(1, input.limit ?? 1));

  return input.groups
    .filter(
      (group) =>
        Boolean(group.approvedAt) &&
        !group.supersededAt &&
        group.confidence >= 0.72 &&
        group.itemIds.length >= THIRD_SIGNAL_MIN_ITEMS,
    )
    .map((group): ThirdSignalSuggestion | undefined => {
      const uniqueItemIds = [...new Set(group.itemIds)];
      if (uniqueItemIds.length < THIRD_SIGNAL_MIN_ITEMS) return undefined;
      const items = uniqueItemIds
        .map((itemId) => itemById.get(itemId))
        .filter((item): item is ScreenshotItem => Boolean(item));
      if (items.length !== uniqueItemIds.length) return undefined;

      // Privacy and lifecycle gates run before reading titles, keywords, source, or entities.
      if (
        items.some(
          (item) =>
            isScreenshotSensitive(item) ||
            item.status !== "saved" ||
            !item.analysis ||
            item.analysis.needsReview,
        )
      ) {
        return undefined;
      }

      const intent = finalIntent(group, items);
      if (!intent) return undefined;
      const artifactType = artifactFor(intent, group);
      if (!artifactType || !withinUsefulSpan(items, usefulSpanDays[artifactType])) return undefined;
      if (!hasDistinctEvidence(items)) return undefined;

      const selectedItems = [...items]
        .sort(
          (left, right) =>
            left.capturedAt.localeCompare(right.capturedAt) || left.id.localeCompare(right.id),
        )
        // Keep the first qualifying set stable. A fourth capture should enrich the
        // existing draft later, not create a second "three captures" suggestion.
        .slice(0, THIRD_SIGNAL_MIN_ITEMS);
      const itemIds = selectedItems.map((item) => item.id);
      const fingerprint = [...itemIds].sort().join("-");
      const id = `${THIRD_SIGNAL_POLICY_VERSION}-${artifactType}-${fingerprint}`;
      if (resolvedSuggestionIds.has(id)) return undefined;

      return {
        id,
        groupId: group.id,
        artifactType,
        intent,
        itemIds,
        triggerItemId: selectedItems[selectedItems.length - 1].id,
        subject: normalizedSubject(group.title),
        reasonCode: "approved_group",
        policyVersion: THIRD_SIGNAL_POLICY_VERSION,
        generatedAt: input.now,
      };
    })
    .filter((suggestion): suggestion is ThirdSignalSuggestion => Boolean(suggestion))
    .sort(
      (left, right) =>
        (itemById.get(right.triggerItemId)?.capturedAt ?? "").localeCompare(
          itemById.get(left.triggerItemId)?.capturedAt ?? "",
        ) || left.id.localeCompare(right.id),
    )
    .slice(0, limit);
}
