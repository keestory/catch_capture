import { describe, expect, it } from "vitest";

import { mockScreenshotGroups, mockScreenshotItems } from "@/data/mock-data";
import { MOCK_PHOTO_ASSET_KEYS } from "@/data/mock-photo-manifest";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";

describe("Phase 1 mock data", () => {
  it("contains at least 20 realistic items across all intents", () => {
    expect(mockScreenshotItems.length).toBeGreaterThanOrEqual(20);
    expect(
      new Set(
        mockScreenshotItems
          .map((item) => item.intent ?? item.analysis?.suggestedIntent)
          .filter((intent) => intent !== undefined),
      ),
    ).toEqual(new Set(["reference", "want", "share", "read", "keep"]));
  });

  it("covers required grouping fixtures", () => {
    const groupTypes = new Set(mockScreenshotGroups.map((group) => group.type));
    for (const type of ["duplicate", "same_entity", "scroll_sequence", "same_topic"] as const) {
      expect(groupTypes.has(type)).toBe(true);
    }
    expect(
      mockScreenshotGroups.find((group) => group.type === "same_entity")?.itemIds,
    ).toHaveLength(3);
  });

  it("puts every reviewable item in a pending group", () => {
    const groupedIds = new Set(mockScreenshotGroups.flatMap((group) => group.itemIds));
    const reviewable = mockScreenshotItems.filter(
      (item) => item.status === "ready_for_review" || item.status === "new",
    );
    expect(reviewable.every((item) => groupedIds.has(item.id))).toBe(true);
  });

  it("keeps suggestions separate from user-approved intents", () => {
    const reviewable = mockScreenshotItems.filter(
      (item) => item.status === "ready_for_review" || item.status === "new",
    );
    expect(reviewable.every((item) => item.intent === undefined)).toBe(true);
    const lowConfidence = reviewable.find((item) => item.analysis?.needsReview);
    expect(lowConfidence?.analysis?.suggestedIntent).not.toBe("keep");
  });

  it("keeps item and group relationships reciprocal", () => {
    for (const group of mockScreenshotGroups) {
      for (const itemId of group.itemIds) {
        expect(mockScreenshotItems.find((item) => item.id === itemId)?.groupIds).toContain(
          group.id,
        );
      }
    }
    for (const item of mockScreenshotItems) {
      for (const groupId of item.groupIds) {
        expect(mockScreenshotGroups.find((group) => group.id === groupId)?.itemIds).toContain(
          item.id,
        );
      }
    }
  });

  it("provides a concise factual summary for every review group", () => {
    for (const group of mockScreenshotGroups) {
      expect(group.summary?.trim().length).toBeGreaterThan(0);
      expect(group.summary?.length).toBeLessThanOrEqual(90);
    }
  });

  it("provides a reviewable summary method and evidence for every analyzed item", () => {
    for (const item of mockScreenshotItems.filter((candidate) => candidate.analysis)) {
      expect(item.analysis?.summaryEvidence?.signals.length).toBeGreaterThan(0);
      expect(item.analysis?.summaryEvidence?.signals.length).toBeLessThanOrEqual(3);
      expect(item.analysis?.summaryEvidence).not.toHaveProperty("reasoning");
    }
    expect(
      mockScreenshotItems.find((item) => item.id === "share-video-frame")?.analysis?.summaryEvidence
        ?.basis,
    ).toBe("visual_embedding");
  });

  it("uses the FlagPick product capture as a grounded OCR summary example", () => {
    const item = mockScreenshotItems.find(
      (candidate) => candidate.id === "example-flagpick-salomon-pulse-belt",
    );

    expect(item).toMatchObject({
      status: "saved",
      intent: "reference",
      contentType: "product",
      source: { appName: "FlagPick" },
      analysis: {
        title: "Salomon Pulse Belt Black",
        summaryEvidence: {
          basis: "ocr_text",
          signals: [
            "Salomon Pulse Belt Black · LC2179800",
            "최근 거래가 ₩53,000 · 선택 S",
            "도착 원가 ₩45,000 · 예상 차익 +₩14,000",
          ],
        },
      },
    });
    expect(item?.analysis?.ocrText).not.toContain("김기현");
  });

  it("contains long, sensitive, low-confidence, unknown-source and analysis-failure cases", () => {
    expect(mockScreenshotItems.some((item) => item.isLongCapture && item.height >= 5000)).toBe(
      true,
    );
    expect(mockScreenshotItems.filter((item) => item.isSensitive).length).toBeGreaterThanOrEqual(2);
    expect(
      mockScreenshotItems.some((item) => item.analysis && item.analysis.intentConfidence < 0.5),
    ).toBe(true);
    expect(mockScreenshotItems.some((item) => !item.source.appName && !item.source.domain)).toBe(
      true,
    );
    expect(mockScreenshotItems.some((item) => !item.analysis && item.status === "new")).toBe(true);
  });

  it("keeps bundled example photos separate from device photo identifiers", () => {
    const sampleItems = mockScreenshotItems.filter((item) =>
      item.imageUri.startsWith("mock-photo://"),
    );

    expect(sampleItems).toEqual([]);
    expect(sampleItems.map((item) => item.imageUri.replace("mock-photo://", "")).sort()).toEqual(
      [...MOCK_PHOTO_ASSET_KEYS].sort(),
    );
    expect(sampleItems.every((item) => item.deviceAssetId?.startsWith("mock-asset-"))).toBe(true);
    expect(
      mockScreenshotItems
        .filter(isScreenshotSensitive)
        .every((item) => !item.imageUri.startsWith("mock-photo://")),
    ).toBe(true);
  });
});
