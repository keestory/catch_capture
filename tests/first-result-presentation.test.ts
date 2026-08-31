import { describe, expect, it } from "vitest";

import type { ScreenshotGroup, ScreenshotItem } from "@/contracts/domain";
import { buildFirstResultPresentation } from "@/onboarding/first-result-presentation";

const item = (id: string, capturedAt: string, imageUri = `mock-photo://${id}`): ScreenshotItem => ({
  id,
  imageUri,
  thumbnailUri: imageUri,
  width: 1179,
  height: 2556,
  capturedAt,
  importedAt: capturedAt,
  source: { appName: "Test" },
  status: "ready_for_review",
  analysis: {
    title: id,
    suggestedIntent: "reference",
    intentConfidence: 0.9,
    needsReview: false,
    contentType: "ui_reference",
    contentTypeConfidence: 0.9,
    keywords: [],
    sensitive: false,
    sensitiveRegions: [],
    analyzerVersion: "test",
    analyzedAt: capturedAt,
  },
  groupIds: [],
  collectionIds: [],
  isLongCapture: false,
  isSensitive: false,
});

const group = (id: string, itemIds: string[]): ScreenshotGroup => ({
  id,
  type: "same_topic",
  itemIds,
  representativeItemId: itemIds[0],
  suggestedIntent: "reference",
  title: id,
  confidence: 0.9,
  createdAt: "2026-08-22T10:00:00+09:00",
});

describe("first result presentation", () => {
  it("uses measured review counts and keeps an older real screenshot in the evidence row", () => {
    const oldA = item("old-a", "2026-08-01T09:00:00+09:00");
    oldA.status = "saved";
    oldA.intent = "reference";
    const oldB = item("old-b", "2026-07-31T09:00:00+09:00");
    oldB.status = "saved";
    oldB.intent = "reference";
    const items = [
      item("new-a", "2026-08-22T10:00:00+09:00"),
      item("new-b", "2026-08-22T09:00:00+09:00"),
      oldA,
      oldB,
    ];
    const groups = [group("a", ["new-a", "new-b"]), group("b", ["old-a"]), group("c", ["old-b"])];

    const result = buildFirstResultPresentation(items, groups, 3, "2026-08-22T12:00:00+09:00");

    expect(result).toMatchObject({ itemCount: 4, groupCount: 3, pastCount: 2 });
    expect(result.evidenceItems.map((candidate) => candidate.id)).toEqual([
      "new-a",
      "new-b",
      "old-a",
    ]);
  });

  it("does not call an older unreviewed capture a past recall", () => {
    const recent = item("recent", "2026-08-22T10:00:00+09:00");
    const unreviewed = item("unreviewed", "2026-07-01T10:00:00+09:00");

    const result = buildFirstResultPresentation(
      [recent, unreviewed],
      [group("today", [recent.id])],
      3,
      "2026-08-22T12:00:00+09:00",
    );

    expect(result.pastCount).toBe(0);
    expect(result.evidenceItems.map((candidate) => candidate.id)).toEqual(["recent"]);
  });

  it("excludes placeholder scenes and sensitive originals", () => {
    const sensitive = { ...item("private", "2026-08-22T10:00:00+09:00"), isSensitive: true };
    const analysisSensitive = item("analysis-private", "2026-08-22T09:30:00+09:00");
    analysisSensitive.analysis = { ...analysisSensitive.analysis!, sensitive: true };
    const placeholder = item("scene", "2026-08-22T09:00:00+09:00", "mock://scene");

    expect(
      buildFirstResultPresentation([sensitive, analysisSensitive, placeholder], []).evidenceItems,
    ).toEqual([]);
  });
});
