import { describe, expect, it } from "vitest";

import type {
  ActionDraftInteraction,
  ContentType,
  Intent,
  ScreenshotGroup,
  ScreenshotItem,
} from "@/contracts/domain";
import {
  buildThirdSignalSuggestions,
  THIRD_SIGNAL_POLICY_VERSION,
} from "@/domain/third-signal-policy";

const NOW = "2026-08-22T12:00:00+09:00";

const item = (
  id: string,
  order: number,
  intent: Intent = "want",
  contentType: ContentType = "product",
): ScreenshotItem => ({
  id,
  imageUri: `mock-photo://${id}`,
  width: 1179,
  height: 2556,
  capturedAt: `2026-08-${String(18 + order).padStart(2, "0")}T12:00:00+09:00`,
  importedAt: NOW,
  source: { appName: "KREAM" },
  status: "saved",
  intent,
  contentType,
  analysis: {
    title: `러닝화 단서 ${order}`,
    summary: "검정 러닝화 화면",
    suggestedIntent: intent,
    intentConfidence: 0.94,
    needsReview: false,
    contentType,
    contentTypeConfidence: 0.94,
    keywords: ["검정 러닝화", `단서 ${order}`],
    extractedEntities: [{ type: "product", value: "Cloud Runner Black" }],
    sensitive: false,
    sensitiveRegions: [],
    analyzerVersion: "test",
    analyzedAt: NOW,
  },
  groupIds: ["group-1"],
  collectionIds: [],
  isLongCapture: false,
  isSensitive: false,
});

const group = (
  items: ScreenshotItem[],
  options: Partial<ScreenshotGroup> = {},
): ScreenshotGroup => ({
  id: "group-1",
  type: "same_entity",
  itemIds: items.map((candidate) => candidate.id),
  representativeItemId: items[0]?.id ?? "missing",
  suggestedIntent: "want",
  approvedIntent: "want",
  title: "같은 검정 러닝화 3장",
  summary: "상품, 사이즈와 착용 장면",
  confidence: 0.94,
  createdAt: NOW,
  approvedAt: NOW,
  ...options,
});

const build = (
  items: ScreenshotItem[],
  candidateGroup = group(items),
  interactions: ActionDraftInteraction[] = [],
) => buildThirdSignalSuggestions({ items, groups: [candidateGroup], interactions, now: NOW });

describe("third signal policy", () => {
  it("requires three approved captures and emits one deterministic decision draft", () => {
    const two = [item("one", 1), item("two", 2)];
    expect(build(two)).toEqual([]);

    const three = [...two, item("three", 3)];
    const suggestion = build(three)[0];
    expect(suggestion).toMatchObject({
      artifactType: "product_decision",
      intent: "want",
      itemIds: ["one", "two", "three"],
      triggerItemId: "three",
      subject: "검정 러닝화",
      policyVersion: THIRD_SIGNAL_POLICY_VERSION,
    });
    expect(suggestion.id).toBe(build(three)[0]?.id);
  });

  it("keeps the same suggestion fingerprint when a fourth capture arrives", () => {
    const three = [item("one", 1), item("two", 2), item("three", 3)];
    const original = build(three)[0];
    const withFourth = [...three, item("four", 4)];

    expect(build(withFourth)[0]?.id).toBe(original.id);
    expect(build(withFourth)[0]?.itemIds).toEqual(original.itemIds);
  });

  it("maps approved repeated behavior to one intent-specific artifact", () => {
    const cases: {
      expected: string;
      intent: Exclude<Intent, "keep">;
      type: ScreenshotGroup["type"];
      contentType: ContentType;
    }[] = [
      { intent: "want", type: "same_entity", contentType: "product", expected: "product_decision" },
      {
        intent: "reference",
        type: "same_topic",
        contentType: "ui_reference",
        expected: "reference_board",
      },
      { intent: "read", type: "same_topic", contentType: "article", expected: "article_brief" },
      { intent: "share", type: "same_topic", contentType: "social_post", expected: "share_pack" },
    ];

    for (const testCase of cases) {
      const items = [1, 2, 3].map((order) =>
        item(`${testCase.intent}-${order}`, order, testCase.intent, testCase.contentType),
      );
      const candidateGroup = group(items, {
        type: testCase.type,
        suggestedIntent: testCase.intent,
        approvedIntent: testCase.intent,
      });
      expect(build(items, candidateGroup)[0]?.artifactType).toBe(testCase.expected);
    }
  });

  it("fails closed for lifecycle, confidence, review, privacy and supersession gates", () => {
    const base = [item("one", 1), item("two", 2), item("three", 3)];

    expect(build(base, group(base, { approvedAt: undefined }))).toEqual([]);
    expect(build(base, group(base, { confidence: 0.71 }))).toEqual([]);
    expect(build(base, group(base, { supersededAt: NOW }))).toEqual([]);
    expect(build(base, group(base, { type: "duplicate" }))).toEqual([]);

    const removed = base.map((candidate) => ({ ...candidate }));
    removed[1].status = "removed";
    expect(build(removed)).toEqual([]);

    const needsReview = base.map((candidate) => ({
      ...candidate,
      analysis: candidate.analysis ? { ...candidate.analysis } : undefined,
    }));
    needsReview[1].analysis!.needsReview = true;
    expect(build(needsReview)).toEqual([]);

    const sensitiveItem = base.map((candidate) => ({ ...candidate }));
    sensitiveItem[0].isSensitive = true;
    expect(build(sensitiveItem)).toEqual([]);

    const sensitiveAnalysis = base.map((candidate) => ({
      ...candidate,
      analysis: candidate.analysis ? { ...candidate.analysis } : undefined,
    }));
    sensitiveAnalysis[2].analysis!.sensitive = true;
    expect(build(sensitiveAnalysis)).toEqual([]);
  });

  it("rejects mixed intent, stale span and identical evidence", () => {
    const mixed = [item("one", 1), item("two", 2), item("three", 3)];
    mixed[1].intent = "reference";
    expect(build(mixed)).toEqual([]);

    const stale = [item("one", 1), item("two", 2), item("three", 3)];
    stale[0].capturedAt = "2026-01-01T12:00:00+09:00";
    expect(build(stale)).toEqual([]);

    const same = [item("one", 1), item("two", 2), item("three", 3)].map((candidate) => ({
      ...candidate,
      analysis: {
        ...candidate.analysis!,
        title: "같은 화면",
        keywords: ["동일"],
        extractedEntities: [],
      },
    }));
    expect(build(same)).toEqual([]);
  });

  it("does not suggest keep intent and remembers accept or dismiss", () => {
    const keepItems = [1, 2, 3].map((order) => item(`keep-${order}`, order, "keep", "other"));
    expect(
      build(keepItems, group(keepItems, { suggestedIntent: "keep", approvedIntent: "keep" })),
    ).toEqual([]);

    const items = [item("one", 1), item("two", 2), item("three", 3)];
    const suggestion = build(items)[0];
    for (const type of ["accepted", "dismissed"] as const) {
      expect(
        build(items, group(items), [
          {
            id: `interaction-${type}`,
            suggestionId: suggestion.id,
            type,
            occurredAt: NOW,
          },
        ]),
      ).toEqual([]);
    }
  });

  it("stores only IDs and safe display metadata, never OCR contents", () => {
    const items = [item("one", 1), item("two", 2), item("three", 3)];
    items[0].analysis!.ocrText = "private raw OCR";

    expect(JSON.stringify(build(items)[0])).not.toContain("private raw OCR");
  });
});
