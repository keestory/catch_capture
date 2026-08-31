import { describe, expect, it } from "vitest";

import type { ScreenshotGroup, ScreenshotItem } from "@/contracts/domain";
import { mockScreenshotItems } from "@/data/mock-data";
import { formatCaptureMoment, presentCaptureHistory } from "@/domain/item-detail-presentation";

const getItem = (id: string): ScreenshotItem => {
  const item = mockScreenshotItems.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing fixture: ${id}`);
  return item;
};

describe("item detail capture history", () => {
  it("shows exact local capture time and grounded source history", () => {
    const whatnot = getItem("reference-live-shopping");
    const presentation = presentCaptureHistory(whatnot, [whatnot], []);

    expect(presentation).toEqual({
      protected: false,
      rows: [
        { label: "캡처한 때", value: "2026. 8. 20. 오후 9:47" },
        { label: "보관함 전체", value: "8월 20일부터 1장" },
        { label: "이 분류", value: "참고로 남긴 1장" },
        { label: "이 출처", value: "Whatnot에서 남긴 첫 장면" },
      ],
      note: "현재 이 기기에 남아 있는 Echo 기록을 기준으로 보여드려요.",
    });
  });

  it("normalizes mixed timezone timestamps by instant", () => {
    expect(formatCaptureMoment("2026-08-20T12:47:00Z")).toBe("2026. 8. 20. 오후 9:47");
    expect(formatCaptureMoment("not-a-date")).toBeUndefined();
  });

  it("shows only exact group membership as related history", () => {
    const current = getItem("reference-live-shopping");
    const related = getItem("reference-ui-1");
    const group: ScreenshotGroup = {
      id: "detail-related",
      type: "same_topic",
      itemIds: [current.id, related.id],
      representativeItemId: current.id,
      confidence: 0.8,
      reason: "같은 라이브 쇼핑 UI",
      suggestedIntent: "reference",
      title: "같은 라이브 쇼핑 UI",
      createdAt: "2026-08-21T00:00:00+09:00",
    };

    const presentation = presentCaptureHistory(current, [current, related], [group]);

    expect(presentation.rows).toContainEqual({
      label: "함께 묶인 장면",
      value: "이 장면 외 1장",
    });
  });

  it("ignores superseded group membership", () => {
    const current = getItem("reference-live-shopping");
    const related = getItem("reference-ui-1");
    const supersededGroup: ScreenshotGroup = {
      id: "superseded-detail-related",
      type: "same_topic",
      itemIds: [current.id, related.id],
      representativeItemId: current.id,
      confidence: 0.8,
      reason: "사용자가 이미 분리한 이전 묶음",
      suggestedIntent: "reference",
      title: "이전 묶음",
      createdAt: "2026-08-21T00:00:00+09:00",
      supersededAt: "2026-08-21T01:00:00+09:00",
    };

    const presentation = presentCaptureHistory(current, [current, related], [supersededGroup]);

    expect(presentation.rows.some((row) => row.label === "함께 묶인 장면")).toBe(false);
  });

  it("does not reveal history fields for sensitive items", () => {
    const sensitive = getItem("keep-order-sensitive");
    const presentation = presentCaptureHistory(sensitive, mockScreenshotItems, []);

    expect(presentation.protected).toBe(true);
    expect(presentation.rows).toEqual([]);
    expect(JSON.stringify(presentation)).not.toContain(sensitive.source.appName);
    expect(JSON.stringify(presentation)).not.toContain(sensitive.analysis?.ocrText);
  });
});
