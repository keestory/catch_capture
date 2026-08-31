import { describe, expect, it } from "vitest";

import type {
  RecallInteraction,
  ReviewItemDecision,
  ScreenshotItem,
} from "../src/contracts/domain";
import { mockScreenshotItems } from "../src/data/mock-data";
import { presentCuriosityDashboard } from "../src/domain/curiosity-dashboard-presentation";

const item = (
  id: string,
  capturedAt: string,
  status: ScreenshotItem["status"] = "saved",
  isSensitive = false,
): ScreenshotItem => ({
  ...mockScreenshotItems[0],
  id,
  capturedAt,
  status,
  isSensitive,
  analysis: mockScreenshotItems[0].analysis
    ? { ...mockScreenshotItems[0].analysis, sensitive: isSensitive }
    : undefined,
});

describe("curiosity dashboard presentation", () => {
  it("keeps the selected long-term demo profile stable", () => {
    const result = presentCuriosityDashboard({
      items: mockScreenshotItems,
      sessions: [],
      decisions: [],
      now: new Date("2026-08-22T09:00:00+09:00"),
      demo: true,
    });

    expect(result.totalCaptured).toBe(842);
    expect(result.reopenedCount).toBe(126);
    expect(result.retainedAfterReviewCount).toBe(38);
    expect(result.recentWeekAverage).toBe(6.4);
    expect(result.recentMonthAverage).toBe(5.8);
    expect(result.week.map((day) => day.count)).toEqual([4, 7, 2, 8, 11, 6, 0]);
    expect(result.week.find((day) => day.isToday)?.weekday).toBe("토");
  });

  it("keeps Sunday inside the current Monday-to-Sunday week", () => {
    const result = presentCuriosityDashboard({
      items: mockScreenshotItems,
      sessions: [],
      decisions: [],
      now: new Date("2026-08-23T12:00:00+09:00"),
      demo: true,
    });

    expect(result.week.map((day) => day.weekday)).toEqual([
      "월",
      "화",
      "수",
      "목",
      "금",
      "토",
      "일",
    ]);
    expect(result.week.filter((day) => day.isToday)).toHaveLength(1);
    expect(result.week.at(-1)?.isToday).toBe(true);
  });

  it("counts available captures and unique, explicit reopen activity", () => {
    const items = [
      item("monday", "2026-08-17T10:00:00+09:00"),
      item("today", "2026-08-22T10:00:00+09:00", "completed"),
      item("removed", "2026-08-22T11:00:00+09:00", "removed"),
      item("sensitive", "2026-08-21T11:00:00+09:00", "saved", true),
    ];
    const recallInteractions: RecallInteraction[] = [
      { id: "open-1", itemId: "monday", type: "opened", occurredAt: "2026-08-22T12:00:00+09:00" },
      { id: "open-2", itemId: "monday", type: "opened", occurredAt: "2026-08-22T13:00:00+09:00" },
      { id: "shown", itemId: "today", type: "shown", occurredAt: "2026-08-22T13:10:00+09:00" },
      {
        id: "sensitive-open",
        itemId: "sensitive",
        type: "opened",
        occurredAt: "2026-08-22T13:20:00+09:00",
      },
    ];
    const decisions: ReviewItemDecision[] = [
      {
        id: "keep-monday",
        sessionId: "session-1",
        groupId: "group-1",
        itemId: "monday",
        outcome: "saved",
        createdAt: "2026-08-22T13:30:00+09:00",
        updatedAt: "2026-08-22T13:30:00+09:00",
      },
    ];

    const result = presentCuriosityDashboard({
      items,
      sessions: [],
      decisions,
      recallInteractions,
      now: new Date("2026-08-22T14:00:00+09:00"),
    });

    expect(result.totalCaptured).toBe(3);
    expect(result.reopenedCount).toBe(1);
    expect(result.retainedAfterReviewCount).toBe(1);
    expect(result.week.map((day) => day.count)).toEqual([1, 0, 0, 0, 1, 1, 0]);
  });
});
