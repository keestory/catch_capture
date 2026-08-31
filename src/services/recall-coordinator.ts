import type {
  DailyRecallSnapshot,
  RecallInteraction,
  RecallInteractionType,
  ScreenshotItem,
} from "@/contracts/domain";
import type { LocalDataStore } from "@/data/repositories";
import {
  buildDailyRecallSnapshot,
  deriveRecallActivity,
  RECALL_POLICY_VERSION,
  type RecallMatchSignals,
} from "@/domain/recall-policy";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";

const parseTime = (value: string): number => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("올바른 날짜가 필요합니다.");
  return parsed;
};

const isStillAvailable = (
  item: ScreenshotItem | undefined,
  interactions: RecallInteraction[],
  now: string,
): boolean => {
  if (!item || item.status !== "saved" || isScreenshotSensitive(item)) return false;
  const activity = deriveRecallActivity(item.id, interactions);
  const snoozed = activity.snoozedUntil ? parseTime(activity.snoozedUntil) > parseTime(now) : false;
  return !activity.dismissed && !activity.completed && !activity.expired && !snoozed;
};

export interface CreateDailyRecallOptions {
  now?: string;
  anchorItems?: ScreenshotItem[];
  matchSignals?: Record<string, RecallMatchSignals>;
  limit?: number;
}

/** Coordinates the separate, finite recall read model and its local interaction history. */
export class RecallCoordinator {
  constructor(private readonly store: LocalDataStore) {}

  async getOrCreateDaily(
    recallDate: string,
    options: CreateDailyRecallOptions = {},
  ): Promise<DailyRecallSnapshot> {
    const now = options.now ?? new Date().toISOString();
    parseTime(now);
    return this.store.mutate((snapshot) => {
      const existing = snapshot.recallSnapshots.find(
        (candidate) =>
          candidate.recallDate === recallDate && candidate.policyVersion === RECALL_POLICY_VERSION,
      );
      if (existing) {
        const itemById = new Map(snapshot.items.map((item) => [item.id, item]));
        return {
          ...existing,
          candidates: existing.candidates.filter((candidate) =>
            isStillAvailable(itemById.get(candidate.itemId), snapshot.recallInteractions, now),
          ),
        };
      }

      const next = buildDailyRecallSnapshot({
        items: snapshot.items,
        anchorItems: options.anchorItems,
        interactions: snapshot.recallInteractions,
        matchSignals: options.matchSignals,
        now,
        recallDate,
        limit: options.limit,
      });
      snapshot.recallSnapshots.push(next);
      return next;
    });
  }

  async record(
    itemId: string,
    type: RecallInteractionType,
    occurredAt = new Date().toISOString(),
    snoozedUntil?: string,
  ): Promise<RecallInteraction> {
    const occurredTime = parseTime(occurredAt);
    if (type === "snoozed") {
      if (!snoozedUntil || parseTime(snoozedUntil) <= occurredTime) {
        throw new Error("나중에 다시 볼 날짜는 현재보다 뒤여야 합니다.");
      }
    }

    return this.store.mutate((snapshot) => {
      const item = snapshot.items.find((candidate) => candidate.id === itemId);
      if (!item) throw new Error(`스크린샷 ${itemId}을 찾을 수 없습니다.`);
      if (isScreenshotSensitive(item))
        throw new Error("보호된 장면은 자동 다시 보기에 사용하지 않아요.");

      const interaction: RecallInteraction = {
        id: `recall-${type}-${itemId}-${occurredAt}`,
        itemId,
        type,
        occurredAt,
        snoozedUntil: type === "snoozed" ? snoozedUntil : undefined,
      };
      if (!snapshot.recallInteractions.some((candidate) => candidate.id === interaction.id)) {
        snapshot.recallInteractions.push(interaction);
      }
      if (type === "completed") {
        item.status = "completed";
        item.completedAt = occurredAt;
      }
      if (type === "restored" && item.status === "completed") {
        item.status = "saved";
        item.completedAt = undefined;
      }
      return interaction;
    });
  }
}
