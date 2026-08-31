import { describe, expect, it } from "vitest";

import type {
  Intent,
  RecallInteraction,
  ScreenshotItem,
  ScreenshotStatus,
} from "@/contracts/domain";
import { emptyRepositorySeed, createRepositories } from "@/data/repositories";
import { MemoryStorageDriver } from "@/data/storage-driver";
import {
  buildDailyRecallSnapshot,
  presentRecallReason,
  recallIntentWindows,
} from "@/domain/recall-policy";
import { RecallCoordinator } from "@/services/recall-coordinator";

const NOW = "2026-08-22T12:00:00+09:00";

const daysAgo = (days: number): string =>
  new Date(Date.parse(NOW) - days * 24 * 60 * 60 * 1000).toISOString();

const item = (
  id: string,
  ageDays: number,
  options: {
    intent?: Intent;
    status?: ScreenshotStatus;
    source?: string;
    keyword?: string;
    entity?: string;
    sensitive?: boolean;
    analysisSensitive?: boolean;
  } = {},
): ScreenshotItem => {
  const intent = options.intent ?? "reference";
  return {
    id,
    imageUri: `mock-photo://${id}`,
    width: 1179,
    height: 2556,
    capturedAt: daysAgo(ageDays),
    importedAt: daysAgo(ageDays),
    source: { appName: options.source ?? "KREAM" },
    status: options.status ?? "saved",
    intent: options.status === "ready_for_review" ? undefined : intent,
    contentType: "product",
    analysis: {
      title: id,
      suggestedIntent: intent,
      intentConfidence: 0.9,
      needsReview: false,
      contentType: "product",
      contentTypeConfidence: 0.9,
      keywords: options.keyword ? [options.keyword] : [],
      extractedEntities: options.entity ? [{ type: "product", value: options.entity }] : undefined,
      sensitive: options.analysisSensitive ?? false,
      sensitiveRegions: [],
      analyzerVersion: "test",
      analyzedAt: NOW,
    },
    groupIds: [],
    collectionIds: [],
    isLongCapture: false,
    isSensitive: options.sensitive ?? false,
  };
};

const event = (
  itemId: string,
  type: RecallInteraction["type"],
  ageDays: number,
  snoozedUntil?: string,
): RecallInteraction => ({
  id: `${itemId}-${type}-${ageDays}`,
  itemId,
  type,
  occurredAt: daysAgo(ageDays),
  snoozedUntil,
});

describe("recall policy", () => {
  it("uses intent-specific useful windows instead of one global age cutoff", () => {
    expect(recallIntentWindows).toMatchObject({
      share: { minAgeDays: 2, defaultMaxAgeDays: 14 },
      want: { minAgeDays: 3, defaultMaxAgeDays: 45 },
      reference: { minAgeDays: 14, defaultMaxAgeDays: 180 },
      keep: { minAgeDays: 30, defaultMaxAgeDays: 365 },
    });

    const snapshot = buildDailyRecallSnapshot({
      items: [
        item("share-too-new", 1, { intent: "share" }),
        item("share-useful", 7, { intent: "share" }),
        item("want-useful", 20, { intent: "want" }),
        item("keep-too-new", 20, { intent: "keep" }),
      ],
      now: NOW,
    });

    expect(snapshot.candidates.map((candidate) => candidate.itemId)).toEqual([
      "share-useful",
      "want-useful",
    ]);
  });

  it("fails closed for every non-saved lifecycle and both sensitive flags", () => {
    const statuses: ScreenshotStatus[] = [
      "new",
      "processing",
      "ready_for_review",
      "snoozed",
      "completed",
      "removed",
      "deleted_from_device",
    ];
    const candidates = buildDailyRecallSnapshot({
      items: [
        ...statuses.map((status) => item(`status-${status}`, 40, { status })),
        item("sensitive-item", 40, { sensitive: true }),
        item("sensitive-analysis", 40, { analysisSensitive: true }),
      ],
      now: NOW,
    });

    expect(candidates.candidates).toEqual([]);
  });

  it("lets an aged-out item return only with an exact entity and a second signal", () => {
    const old = item("old-share", 20, {
      intent: "share",
      entity: "Salomon Pulse Belt",
      source: "Instagram",
    });
    const weakAnchor = item("weak-anchor", 0, {
      status: "ready_for_review",
      intent: "share",
      keyword: "running",
      source: "Safari",
    });
    const entityOnlyAnchor = item("entity-only-anchor", 0, {
      status: "ready_for_review",
      intent: "share",
      entity: "Salomon Pulse Belt",
      source: "Safari",
    });
    entityOnlyAnchor.contentType = "article";
    entityOnlyAnchor.analysis = { ...entityOnlyAnchor.analysis!, contentType: "article" };
    const strongAnchor = item("strong-anchor", 0, {
      status: "ready_for_review",
      intent: "share",
      entity: "Salomon Pulse Belt",
      source: "Instagram",
    });

    expect(
      buildDailyRecallSnapshot({ items: [old], anchorItems: [weakAnchor], now: NOW }).candidates,
    ).toEqual([]);
    expect(
      buildDailyRecallSnapshot({ items: [old], anchorItems: [entityOnlyAnchor], now: NOW })
        .candidates,
    ).toEqual([]);
    const resurrected = buildDailyRecallSnapshot({
      items: [old],
      anchorItems: [strongAnchor],
      now: NOW,
    }).candidates[0];
    expect(resurrected).toMatchObject({
      itemId: "old-share",
      anchorItemId: "strong-anchor",
      reasonCode: "same_entity",
      evidence: { sharedEntity: "salomon pulse belt" },
    });
    expect(presentRecallReason(resurrected, "3주 전")).toContain("salomon pulse belt");
  });

  it("never resurrects past the hard maximum age", () => {
    const old = item("too-old-share", 31, {
      intent: "share",
      entity: "same thing",
      source: "Instagram",
    });
    const anchor = item("anchor", 0, {
      status: "ready_for_review",
      intent: "share",
      entity: "same thing",
      source: "Instagram",
    });
    expect(
      buildDailyRecallSnapshot({ items: [old], anchorItems: [anchor], now: NOW }).candidates,
    ).toEqual([]);
  });

  it("treats dismiss, completion, expiry and active snooze as absolute gates", () => {
    const items = ["dismissed", "completed", "expired", "snoozed"].map((id) => item(id, 40));
    const interactions: RecallInteraction[] = [
      event("dismissed", "dismissed", 20),
      event("completed", "completed", 20),
      event("expired", "expired", 20),
      event("snoozed", "snoozed", 1, daysAgo(-6)),
    ];

    expect(buildDailyRecallSnapshot({ items, interactions, now: NOW }).candidates).toEqual([]);
  });

  it("respects opened and shown cooldown boundaries without treating a scroll-past as dismiss", () => {
    const items = [item("opened-recent", 40), item("shown-recent", 40), item("shown-ready", 40)];
    const interactions = [
      event("opened-recent", "opened", 6.99),
      event("shown-recent", "shown", 13.99),
      event("shown-ready", "shown", 14),
    ];
    expect(
      buildDailyRecallSnapshot({ items, interactions, now: NOW }).candidates.map(
        (candidate) => candidate.itemId,
      ),
    ).toEqual(["shown-ready"]);
  });

  it("caps the day at three and limits one intent or source from taking every slot", () => {
    const items = [
      item("ref-a", 40, { source: "KREAM" }),
      item("ref-b", 41, { source: "KREAM" }),
      item("ref-c", 42, { source: "KREAM" }),
      item("want-a", 20, { intent: "want", source: "Instagram" }),
      item("read-a", 20, { intent: "read", source: "Safari" }),
    ];
    const result = buildDailyRecallSnapshot({ items, now: NOW });
    const selected = result.candidates.map((candidate) => candidate.itemId);

    expect(selected).toHaveLength(3);
    expect(selected.filter((id) => id.startsWith("ref-")).length).toBeLessThanOrEqual(2);
    expect(selected.some((id) => id === "want-a" || id === "read-a")).toBe(true);
  });

  it("keeps the daily order stable and removes a snoozed candidate without refilling", async () => {
    const repositories = createRepositories(new MemoryStorageDriver());
    const seed = emptyRepositorySeed();
    seed.items = [item("a", 40), item("b", 50), item("c", 60), item("d", 70)];
    await repositories.store.initialize(seed);
    const coordinator = new RecallCoordinator(repositories.store);

    const first = await coordinator.getOrCreateDaily("2026-08-22", { now: NOW });
    const second = await coordinator.getOrCreateDaily("2026-08-22", {
      now: "2026-08-22T18:00:00+09:00",
      anchorItems: [item("new-anchor", 0, { status: "ready_for_review", entity: "new" })],
    });
    expect(second.candidates).toEqual(first.candidates);

    await coordinator.record(
      first.candidates[0].itemId,
      "snoozed",
      NOW,
      "2026-08-29T12:00:00+09:00",
    );
    const afterSnooze = await coordinator.getOrCreateDaily("2026-08-22", {
      now: "2026-08-22T18:01:00+09:00",
    });
    expect(afterSnooze.candidates).toHaveLength(first.candidates.length - 1);
    expect(
      afterSnooze.candidates.some((value) => value.itemId === first.candidates[0].itemId),
    ).toBe(false);
  });

  it("validates snooze dates and protects sensitive interaction history", async () => {
    const repositories = createRepositories(new MemoryStorageDriver());
    const seed = emptyRepositorySeed();
    seed.items = [item("safe", 40), item("private", 40, { analysisSensitive: true })];
    await repositories.store.initialize(seed);
    const coordinator = new RecallCoordinator(repositories.store);

    await expect(coordinator.record("safe", "snoozed", NOW, daysAgo(1))).rejects.toThrow(
      "현재보다 뒤",
    );
    await expect(coordinator.record("private", "opened", NOW)).rejects.toThrow("보호된 장면");
    expect(await repositories.recallInteractions.list()).toEqual([]);
  });

  it("rejects an invalid clock and ignores an item with a malformed capture time", () => {
    expect(() => buildDailyRecallSnapshot({ items: [], now: "not-a-date" })).toThrow(
      "올바른 기준 시각",
    );
    const malformed = item("malformed", 40);
    malformed.capturedAt = "not-a-date";
    expect(buildDailyRecallSnapshot({ items: [malformed], now: NOW }).candidates).toEqual([]);
  });
});
