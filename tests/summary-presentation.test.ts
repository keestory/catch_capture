import { describe, expect, it } from "vitest";

import type { ScreenshotGroup, ScreenshotItem } from "@/contracts/domain";
import { mockScreenshotGroups, mockScreenshotItems } from "@/data/mock-data";
import { presentGroupSummary, presentItemSummary } from "@/domain/summary-presentation";
import { ko } from "@/localization/ko";

describe("content summary presentation", () => {
  it("shows the factual analysis summary for a regular capture", () => {
    const item = mockScreenshotItems.find((candidate) => candidate.id === "want-shoe-1")!;

    expect(presentItemSummary(item)).toEqual({
      summary: "가벼운 데일리 러닝화, 129,000원",
      basis: "ocr_text",
      signals: ["Cloud Runner Black", "129,000원"],
      explanation: "화면에서 읽은 문장과 숫자를 바탕으로 정리했어요.",
      protected: false,
    });
  });

  it("describes an image-only summary with visual evidence", () => {
    const item = mockScreenshotItems.find((candidate) => candidate.id === "share-video-frame")!;

    expect(presentItemSummary(item)).toMatchObject({
      summary: "다시 열어보고 친구에게 공유하고 싶었던 유튜브 장면",
      basis: "visual_embedding",
      signals: ["영상 화면 구성", "재생 장면"],
      protected: false,
    });
  });

  it("does not expose OCR-derived content from a sensitive capture", () => {
    const item = mockScreenshotItems.find((candidate) => candidate.id === "keep-order-sensitive")!;

    const presentation = presentItemSummary(item);
    expect(presentation).toEqual({ summary: ko.summary.protectedBody, protected: true });
    expect(presentation?.summary).not.toContain("용산구");
    expect(presentation?.summary).not.toContain("주문번호");
  });

  it("keeps group content and grouping evidence as separate sentences", () => {
    const group = mockScreenshotGroups.find((candidate) => candidate.id === "group-running-shoes")!;
    const items = group.itemIds.map((itemId) =>
      mockScreenshotItems.find((item) => item.id === itemId)!,
    );

    expect(presentGroupSummary(group, items)).toEqual({
      summary: group.summary,
      commonality: group.reason,
      protected: false,
    });
  });

  it("omits a missing summary without blocking review", () => {
    const group = { ...mockScreenshotGroups[0], summary: undefined } satisfies ScreenshotGroup;
    const item = {
      ...mockScreenshotItems[0],
      analysis: { ...mockScreenshotItems[0].analysis!, summary: undefined },
    } satisfies ScreenshotItem;

    expect(presentGroupSummary(group, [item])).toBeUndefined();
    expect(presentItemSummary(item)).toBeUndefined();
  });
});
