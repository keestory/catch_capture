import type {
  DailyReviewSession,
  RecallInteraction,
  ReviewItemDecision,
  ScreenshotItem,
} from "@/contracts/domain";

export interface CaptureRhythmDay {
  dateKey: string;
  weekday: string;
  count: number;
  itemIds: string[];
  isToday: boolean;
}

export interface CuriosityDashboardPresentation {
  dateLabel: string;
  totalCaptured: number;
  reopenedCount: number;
  retainedAfterReviewCount: number;
  recentWeekAverage: number;
  recentMonthAverage: number;
  week: CaptureRhythmDay[];
}

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const dayMilliseconds = 24 * 60 * 60 * 1000;

const localDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfLocalDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const countBetween = (items: ScreenshotItem[], start: Date, end: Date): number =>
  items.filter((item) => {
    const captured = new Date(item.capturedAt).getTime();
    return captured >= start.getTime() && captured < end.getTime();
  }).length;

const roundOne = (value: number): number => Math.round(value * 10) / 10;

const isAvailableCapture = (item: ScreenshotItem): boolean =>
  item.status !== "removed" && item.status !== "deleted_from_device";

const buildActualWeek = (items: ScreenshotItem[], today: Date): CaptureRhythmDay[] => {
  const start = startOfLocalDay(today);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start.getTime() + index * dayMilliseconds);
    const dateKey = localDateKey(day);
    const dayItems = items.filter((item) => item.capturedAt.slice(0, 10) === dateKey);
    return {
      dateKey,
      weekday: weekdayLabels[day.getDay()] ?? "",
      count: dayItems.length,
      itemIds: dayItems.map((item) => item.id),
      isToday: dateKey === localDateKey(today),
    };
  });
};

const buildDemoWeek = (items: ScreenshotItem[], today: Date): CaptureRhythmDay[] => {
  const counts = [4, 7, 2, 8, 11, 6, 0];
  const availableIds = items
    .filter(
      (item) =>
        isAvailableCapture(item) &&
        !item.isSensitive &&
        !item.analysis?.sensitive &&
        item.imageUri.startsWith("mock-photo://"),
    )
    .map((item) => item.id);
  const start = startOfLocalDay(today);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  let cursor = 0;

  return counts.map((count, index) => {
    const day = new Date(start.getTime() + index * dayMilliseconds);
    const itemIds = Array.from({ length: Math.min(count, 6) }, () => {
      const id = availableIds[cursor % Math.max(1, availableIds.length)];
      cursor += 1;
      return id;
    }).filter((id): id is string => Boolean(id));
    return {
      dateKey: localDateKey(day),
      weekday: weekdayLabels[day.getDay()] ?? "",
      count,
      itemIds,
      isToday: localDateKey(day) === localDateKey(today),
    };
  });
};

export function presentCuriosityDashboard({
  items,
  sessions,
  decisions,
  recallInteractions = [],
  now = new Date(),
  demo = false,
}: {
  items: ScreenshotItem[];
  sessions: DailyReviewSession[];
  decisions: ReviewItemDecision[];
  recallInteractions?: RecallInteraction[];
  now?: Date;
  demo?: boolean;
}): CuriosityDashboardPresentation {
  const availableItems = items.filter(isAvailableCapture);
  const today = startOfLocalDay(now);
  const tomorrow = new Date(today.getTime() + dayMilliseconds);
  const sevenDaysAgo = new Date(today.getTime() - 6 * dayMilliseconds);
  const thirtyDaysAgo = new Date(today.getTime() - 29 * dayMilliseconds);
  const reopenedIds = new Set(
    recallInteractions
      .filter((interaction) => interaction.type === "opened")
      .map((interaction) => interaction.itemId)
      .filter((itemId) => availableItems.some((item) => item.id === itemId && !item.isSensitive)),
  );
  const retainedIds = new Set(
    decisions.filter((decision) => decision.outcome === "saved").map((decision) => decision.itemId),
  );

  if (demo) {
    return {
      dateLabel: now.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }),
      totalCaptured: 842,
      reopenedCount: 126,
      retainedAfterReviewCount: 38,
      recentWeekAverage: 6.4,
      recentMonthAverage: 5.8,
      week: buildDemoWeek(availableItems, now),
    };
  }

  return {
    dateLabel: now.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "long",
    }),
    totalCaptured: availableItems.length,
    reopenedCount: reopenedIds.size,
    retainedAfterReviewCount: [...retainedIds].filter((itemId) => reopenedIds.has(itemId)).length,
    recentWeekAverage: roundOne(countBetween(availableItems, sevenDaysAgo, tomorrow) / 7),
    recentMonthAverage: roundOne(countBetween(availableItems, thirtyDaysAgo, tomorrow) / 30),
    week: buildActualWeek(availableItems, now),
  };
}
