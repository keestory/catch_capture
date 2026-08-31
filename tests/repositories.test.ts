import { beforeEach, describe, expect, it } from "vitest";

import { mockSeed } from "@/data/mock-data";
import { createRepositories, DailyReviewCoordinator, ReviewCoordinator } from "@/data/repositories";
import { MemoryStorageDriver } from "@/data/storage-driver";
import type { StorageDriver } from "@/data/storage-driver";

class FailingStorageDriver implements StorageDriver {
  private readonly values = new Map<string, string>();
  failNextWrite = false;

  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      throw new Error("mock storage failure");
    }
    this.values.set(key, value);
  }

  async removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("local repositories", () => {
  let driver: MemoryStorageDriver;

  beforeEach(() => {
    driver = new MemoryStorageDriver();
  });

  it("persists updated records across repository instances", async () => {
    const first = createRepositories(driver);
    await first.store.initialize(mockSeed);
    const item = await first.items.get("want-bag");
    expect(item).toBeDefined();
    await first.items.save({ ...item!, intent: "keep", status: "saved" });

    const second = createRepositories(driver);
    await second.store.initialize(mockSeed);
    expect((await second.items.get("want-bag"))?.intent).toBe("keep");
  });

  it("approves a whole group without opening each item", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);

    const result = await new ReviewCoordinator(repositories.store).approveGroup(
      "group-running-shoes",
      "want",
      "2026-08-21T21:30:00+09:00",
    );

    expect(result.itemCount).toBe(3);
    expect(await repositories.groups.pending()).toHaveLength(mockSeed.groups.length - 1);
    for (const id of ["want-shoe-1", "want-shoe-2", "want-shoe-3"]) {
      expect(await repositories.items.get(id)).toMatchObject({ intent: "want", status: "saved" });
    }
  });

  it("keeps app removal reversible without pretending to delete the device photo", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);

    await repositories.items.removeFromApp("reference-ad", "2026-08-21T22:00:00+09:00");
    expect(await repositories.items.get("reference-ad")).toMatchObject({ status: "removed" });

    await repositories.items.restore("reference-ad");
    expect(await repositories.items.get("reference-ad")).toMatchObject({ status: "saved" });

    expect(await repositories.items.get("reference-ad")).toMatchObject({ status: "saved" });
  });

  it("restores an unapproved item to review instead of silently saving it", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);

    await repositories.items.removeFromApp("want-bag");
    await repositories.items.restore("want-bag");

    const restored = await repositories.items.get("want-bag");
    expect(restored?.status).toBe("ready_for_review");
    expect(restored?.intent).toBeUndefined();
  });

  it("can complete every analyzable review item through grouped approvals", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new ReviewCoordinator(repositories.store);

    const actionableGroups = mockSeed.groups.filter((group) =>
      group.itemIds.every((itemId) =>
        mockSeed.items.some(
          (item) => item.id === itemId && item.status === "ready_for_review" && item.analysis,
        ),
      ),
    );
    for (const group of actionableGroups) {
      await coordinator.approveGroup(group.id, group.suggestedIntent);
    }

    const remaining = (await repositories.items.list()).filter(
      (item) => item.status === "ready_for_review" && item.analysis,
    );
    expect(remaining).toHaveLength(0);
    expect(await repositories.groups.pending()).toHaveLength(
      mockSeed.groups.length - actionableGroups.length,
    );
  });

  it("starts once, persists progress and resumes the same daily review", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);

    const started = await coordinator.startOrResume("2026-08-21", "2026-08-21T21:00:00+09:00");
    const resumed = await coordinator.startOrResume("2026-08-21", "2026-08-21T21:05:00+09:00");
    expect(resumed.id).toBe(started.id);

    const firstGroup = mockSeed.groups[0];
    const result = await coordinator.approveCurrentGroup(
      started.id,
      firstGroup.id,
      firstGroup.suggestedIntent,
      "2026-08-21T21:00:10+09:00",
    );
    expect(result.session).toMatchObject({
      currentGroupIndex: 1,
      reviewedItemCount: firstGroup.itemIds.length,
      correctedItemCount: 0,
    });

    const relaunched = createRepositories(driver);
    await relaunched.store.initialize(mockSeed);
    expect(await relaunched.sessions.activeForDate("2026-08-21")).toMatchObject({
      id: started.id,
      currentGroupIndex: 1,
    });
  });

  it("snapshots only analyzable groups captured on the review date", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);

    const session = await coordinator.startOrResume("2026-08-21");

    expect(session.groupIds).toHaveLength(10);
    expect(session.groupIds).not.toContain("group-analysis-failure");
    for (const groupId of session.groupIds) {
      const group = mockSeed.groups.find((candidate) => candidate.id === groupId)!;
      expect(
        group.itemIds.every((itemId) => {
          const item = mockSeed.items.find((candidate) => candidate.id === itemId)!;
          return item.status === "ready_for_review" && Boolean(item.analysis);
        }),
      ).toBe(true);
    }
  });

  it("can snapshot the same finite group count promised by Today", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);

    const session = await coordinator.startOrResume("2026-08-21", undefined, 3);

    expect(session.groupIds).toHaveLength(3);
    expect(session.initialGroupIds).toEqual(session.groupIds);
  });

  it("serializes concurrent starts and duplicate approvals", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);

    const [firstStart, secondStart] = await Promise.all([
      coordinator.startOrResume("2026-08-21"),
      coordinator.startOrResume("2026-08-21"),
    ]);
    expect(secondStart.id).toBe(firstStart.id);
    expect(await repositories.sessions.list()).toHaveLength(1);

    const firstGroup = mockSeed.groups.find((group) => group.id === firstStart.groupIds[0])!;
    const [firstApproval, duplicateApproval] = await Promise.all([
      coordinator.approveCurrentGroup(firstStart.id, firstGroup.id, firstGroup.suggestedIntent),
      coordinator.approveCurrentGroup(firstStart.id, firstGroup.id, firstGroup.suggestedIntent),
    ]);
    expect(firstApproval.alreadyApproved).toBe(false);
    expect(duplicateApproval.alreadyApproved).toBe(true);
    expect((await repositories.sessions.get(firstStart.id))?.reviewedItemCount).toBe(
      firstGroup.itemIds.length,
    );
  });

  it("persists intent corrections and completes a grouped review", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);
    const session = await coordinator.startOrResume("2026-08-21");
    const first = mockSeed.groups[0];

    await coordinator.changeCurrentGroupIntent(session.id, first.id, "keep");
    const changed = await coordinator.approveCurrentGroup(session.id, first.id, "keep");
    expect(changed.correctedItemCount).toBe(first.itemIds.length);
    expect(await repositories.groups.get(first.id)).toMatchObject({
      suggestedIntent: first.suggestedIntent,
      approvedIntent: "keep",
    });

    for (let index = 1; index < session.groupIds.length; index += 1) {
      const group = mockSeed.groups.find((candidate) => candidate.id === session.groupIds[index])!;
      await coordinator.approveCurrentGroup(
        session.id,
        group.id,
        group.suggestedIntent,
        `2026-08-21T21:${String(index).padStart(2, "0")}:00+09:00`,
      );
    }

    const completed = await repositories.sessions.get(session.id);
    expect(completed?.completedAt).toBeDefined();
    expect(completed?.currentGroupIndex).toBe(session.groupIds.length);
    expect(completed?.reviewedItemCount).toBe(
      session.groupIds.reduce(
        (sum, groupId) =>
          sum + mockSeed.groups.find((group) => group.id === groupId)!.itemIds.length,
        0,
      ),
    );
  });

  it("rejects approving a later group before the current one", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);
    const session = await coordinator.startOrResume("2026-08-21");

    await expect(
      coordinator.approveCurrentGroup(
        session.id,
        mockSeed.groups[1].id,
        mockSeed.groups[1].suggestedIntent,
      ),
    ).rejects.toThrow("현재 확인 중인 묶음");
  });

  it("rolls back in-memory state when persistence fails", async () => {
    const failingDriver = new FailingStorageDriver();
    const repositories = createRepositories(failingDriver);
    await repositories.store.initialize(mockSeed);
    const before = await repositories.items.get("want-bag");
    failingDriver.failNextWrite = true;

    await expect(
      repositories.items.save({ ...before!, status: "saved", intent: "want" }),
    ).rejects.toThrow("mock storage failure");

    expect(await repositories.items.get("want-bag")).toEqual(before);
    const relaunched = createRepositories(failingDriver);
    await relaunched.store.initialize(mockSeed);
    expect(await relaunched.items.get("want-bag")).toEqual(before);
  });

  it("commits per-item intent exceptions with the group as one atomic review", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);
    const session = await coordinator.startOrResume("2026-08-21");
    const group = mockSeed.groups.find((candidate) => candidate.id === session.groupIds[0])!;
    const [firstItemId, secondItemId] = group.itemIds;

    await coordinator.setCurrentItemDecision(session.id, group.id, firstItemId, "saved", "keep");
    const beforeApproval = await repositories.decisions.list(session.id);
    expect(beforeApproval).toMatchObject([
      { itemId: firstItemId, outcome: "saved", intent: "keep" },
    ]);
    expect(beforeApproval[0].committedAt).toBeUndefined();
    expect((await repositories.items.get(firstItemId))?.status).toBe("ready_for_review");

    const result = await coordinator.approveCurrentGroup(
      session.id,
      group.id,
      group.suggestedIntent,
      "2026-08-21T21:00:10+09:00",
    );

    expect(result).toMatchObject({ itemCount: 2, correctedItemCount: 1, removedItemCount: 0 });
    expect(await repositories.items.get(firstItemId)).toMatchObject({
      status: "saved",
      intent: "keep",
    });
    expect(await repositories.items.get(secondItemId)).toMatchObject({
      status: "saved",
      intent: "reference",
    });
    const approvedGroup = await repositories.groups.get(group.id);
    expect(approvedGroup).toMatchObject({ resolutionMode: "individual" });
    expect(approvedGroup?.approvedIntent).toBeUndefined();
    expect(await repositories.sessions.get(session.id)).toMatchObject({
      reviewedItemCount: 2,
      correctedItemCount: 1,
    });
    expect(
      (await repositories.decisions.list(session.id)).every((value) => value.committedAt),
    ).toBe(true);
  });

  it("stages app removal, preserves the device asset and can undo before approval", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);
    const session = await coordinator.startOrResume("2026-08-21");
    const group = mockSeed.groups.find((candidate) => candidate.id === session.groupIds[0])!;
    const itemId = group.itemIds[0];
    const deviceAssetId = (await repositories.items.get(itemId))?.deviceAssetId;

    await coordinator.setCurrentItemDecision(session.id, group.id, itemId, "removed");
    expect(await repositories.items.get(itemId)).toMatchObject({
      status: "ready_for_review",
      deviceAssetId,
    });

    await coordinator.undoCurrentItemRemoval(session.id, group.id, itemId);
    expect((await repositories.decisions.list(session.id))[0]).toMatchObject({
      itemId,
      outcome: "saved",
    });
    await coordinator.approveCurrentGroup(session.id, group.id, group.suggestedIntent);
    expect(await repositories.items.get(itemId)).toMatchObject({
      status: "saved",
      deviceAssetId,
    });
    expect((await repositories.sessions.get(session.id))?.removedItemCount).toBe(0);
  });

  it("commits app removal without deleting the device photo", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);
    const session = await coordinator.startOrResume("2026-08-21");
    const group = mockSeed.groups.find((candidate) => candidate.id === session.groupIds[0])!;
    const itemId = group.itemIds[0];
    const deviceAssetId = (await repositories.items.get(itemId))?.deviceAssetId;

    await coordinator.setCurrentItemDecision(session.id, group.id, itemId, "removed");
    const result = await coordinator.approveCurrentGroup(
      session.id,
      group.id,
      group.suggestedIntent,
    );

    expect(result.removedItemCount).toBe(1);
    expect(await repositories.items.get(itemId)).toMatchObject({
      status: "removed",
      deviceAssetId,
    });
    expect((await repositories.items.list()).some((item) => item.id === itemId)).toBe(false);
    expect(
      (await repositories.items.list({ includeRemoved: true })).some((item) => item.id === itemId),
    ).toBe(true);
    expect(await repositories.sessions.get(session.id)).toMatchObject({
      reviewedItemCount: 2,
      removedItemCount: 1,
    });
  });

  it("separates a group into persistent singletons and can merge it back", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);
    const session = await coordinator.startOrResume("2026-08-21");
    const originalGroupId = session.groupIds[0];
    const original = mockSeed.groups.find((group) => group.id === originalGroupId)!;

    const separated = await coordinator.separateCurrentGroup(
      session.id,
      originalGroupId,
      "2026-08-21T21:01:00+09:00",
    );
    expect(separated.groupIds).toHaveLength(original.itemIds.length);
    expect(separated.session.groupIds).toHaveLength(session.groupIds.length + 1);
    expect(await repositories.groups.get(originalGroupId)).toMatchObject({
      supersededByGroupIds: separated.groupIds,
    });
    for (const [index, childId] of separated.groupIds.entries()) {
      expect(await repositories.groups.get(childId)).toMatchObject({
        itemIds: [original.itemIds[index]],
        splitFromGroupId: originalGroupId,
      });
      expect((await repositories.items.get(original.itemIds[index]))?.groupIds).toContain(childId);
    }

    const relaunched = createRepositories(driver);
    await relaunched.store.initialize(mockSeed);
    expect((await relaunched.sessions.get(session.id))?.groupIds).toContain(separated.groupIds[0]);
    expect((await relaunched.groups.pending()).some((group) => group.id === originalGroupId)).toBe(
      false,
    );

    const merged = await new DailyReviewCoordinator(relaunched.store).mergeSplitGroup(
      session.id,
      separated.groupIds[0],
      "2026-08-21T21:02:00+09:00",
    );
    expect(merged.session.groupIds).toEqual(session.groupIds);
    expect(merged.group.supersededAt).toBeUndefined();
    for (const childId of separated.groupIds) {
      expect((await relaunched.groups.get(childId))?.supersededAt).toBeDefined();
    }
    for (const itemId of original.itemIds) {
      expect((await relaunched.items.get(itemId))?.groupIds).toContain(originalGroupId);
    }
  });

  it("keeps a group unchanged when a split cannot be persisted", async () => {
    const failingDriver = new FailingStorageDriver();
    const repositories = createRepositories(failingDriver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);
    const session = await coordinator.startOrResume("2026-08-21");
    const groupId = session.groupIds[0];
    failingDriver.failNextWrite = true;

    await expect(coordinator.separateCurrentGroup(session.id, groupId)).rejects.toThrow(
      "mock storage failure",
    );
    expect((await repositories.groups.get(groupId))?.supersededAt).toBeUndefined();
    expect((await repositories.sessions.get(session.id))?.groupIds).toEqual(session.groupIds);
    expect(
      (await repositories.groups.list()).filter((group) => group.splitFromGroupId),
    ).toHaveLength(0);
  });

  it("blocks structural changes after an individual draft exists", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);
    const session = await coordinator.startOrResume("2026-08-21");
    const group = mockSeed.groups.find((candidate) => candidate.id === session.groupIds[0])!;
    await coordinator.setCurrentItemDecision(
      session.id,
      group.id,
      group.itemIds[0],
      "saved",
      "keep",
    );

    await expect(coordinator.separateCurrentGroup(session.id, group.id)).rejects.toThrow(
      "개별 변경을 적용하기 전에",
    );
    expect((await repositories.sessions.get(session.id))?.groupIds).toEqual(session.groupIds);
  });

  it("completes the daily review with saved and app-removed counts separated", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DailyReviewCoordinator(repositories.store);
    const session = await coordinator.startOrResume("2026-08-21");
    const first = mockSeed.groups.find((group) => group.id === session.groupIds[0])!;
    await coordinator.setCurrentItemDecision(session.id, first.id, first.itemIds[0], "removed");

    for (const groupId of session.groupIds) {
      const group = mockSeed.groups.find((candidate) => candidate.id === groupId)!;
      await coordinator.approveCurrentGroup(session.id, group.id, group.suggestedIntent);
    }

    const completed = await repositories.sessions.get(session.id);
    expect(completed).toMatchObject({
      reviewedItemCount: session.initialItemIds.length,
      removedItemCount: 1,
    });
    expect(completed?.completedAt).toBeDefined();
    expect(
      (await repositories.items.list()).filter((item) => session.initialItemIds.includes(item.id)),
    ).toHaveLength(session.initialItemIds.length - 1);
  });

  it("migrates a phase 3 session to immutable phase 4 review bounds", async () => {
    const groupIds = ["group-reference-duplicate", "group-running-shoes"];
    await driver.setItem(
      "catch.phase1.snapshot.v1",
      JSON.stringify({
        schemaVersion: 1,
        items: mockSeed.items,
        groups: mockSeed.groups,
        collections: mockSeed.collections,
        corrections: [],
        sessions: [
          {
            id: "legacy-session",
            reviewDate: "2026-08-21",
            groupIds,
            currentGroupIndex: 1,
            startedAt: "2026-08-21T21:00:00+09:00",
            reviewedItemCount: 2,
            correctedItemCount: 0,
            removedItemCount: 0,
          },
        ],
      }),
    );

    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const migrated = await repositories.sessions.get("legacy-session");
    expect(migrated).toMatchObject({
      initialGroupIds: groupIds,
      initialItemIds: [
        "reference-ui-1",
        "reference-ui-2",
        "want-shoe-1",
        "want-shoe-2",
        "want-shoe-3",
      ],
      revision: 0,
    });
    expect(await repositories.decisions.list("legacy-session")).toEqual([]);
  });

  it("does not trust a schema 2 device-deleted flag without a native request record", async () => {
    const legacyItem = {
      ...mockSeed.items.find((item) => item.id === "reference-ad")!,
      status: "deleted_from_device" as const,
      removedAt: "2026-08-21T22:00:00+09:00",
    };
    await driver.setItem(
      "catch.phase1.snapshot.v1",
      JSON.stringify({
        schemaVersion: 2,
        items: mockSeed.items.map((item) => (item.id === legacyItem.id ? legacyItem : item)),
        groups: mockSeed.groups,
        collections: mockSeed.collections,
        corrections: [],
        decisions: [],
        sessions: [],
      }),
    );

    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);

    expect(await repositories.items.get(legacyItem.id)).toMatchObject({ status: "removed" });
    expect(repositories.store.read((snapshot) => snapshot.deviceDeletionRequests[0])).toMatchObject(
      { itemId: legacyItem.id, state: "legacy_unverified" },
    );
  });

  it("backfills verified optional seed summaries and evidence without resetting progress", async () => {
    const groupsWithoutSummaries = mockSeed.groups.map(({ summary: _summary, ...group }) => group);
    const itemsWithoutEvidence = mockSeed.items
      .filter((item) => item.id !== "example-flagpick-salomon-pulse-belt")
      .map((item) =>
        item.analysis
          ? {
              ...item,
              analysis: { ...item.analysis, summaryEvidence: undefined },
            }
          : item,
      );
    await driver.setItem(
      "catch.phase1.snapshot.v1",
      JSON.stringify({
        schemaVersion: 2,
        items: itemsWithoutEvidence,
        groups: groupsWithoutSummaries,
        collections: mockSeed.collections,
        corrections: [],
        decisions: [],
        sessions: [
          {
            id: "persisted-session",
            reviewDate: "2026-08-21",
            initialGroupIds: ["group-reference-duplicate"],
            initialItemIds: ["reference-ui-1", "reference-ui-2"],
            groupIds: ["group-reference-duplicate"],
            currentGroupIndex: 0,
            revision: 3,
            startedAt: "2026-08-21T21:00:00+09:00",
            reviewedItemCount: 0,
            correctedItemCount: 0,
            removedItemCount: 0,
          },
        ],
      }),
    );

    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);

    expect((await repositories.groups.get("group-reference-duplicate"))?.summary).toBe(
      mockSeed.groups.find((group) => group.id === "group-reference-duplicate")?.summary,
    );
    expect((await repositories.items.get("share-video-frame"))?.analysis?.summaryEvidence).toEqual(
      mockSeed.items.find((item) => item.id === "share-video-frame")?.analysis?.summaryEvidence,
    );
    expect(await repositories.items.get("example-flagpick-salomon-pulse-belt")).toMatchObject({
      status: "saved",
      source: { appName: "FlagPick" },
    });
    expect((await repositories.sessions.get("persisted-session"))?.revision).toBe(3);
  });

  it("does not infer evidence for a persisted item whose summary changed", async () => {
    const changedItem = {
      ...mockSeed.items[0],
      analysis: {
        ...mockSeed.items[0].analysis!,
        summary: "사용자가 바꾼 요약",
        summaryEvidence: undefined,
      },
    };
    await driver.setItem(
      "catch.phase1.snapshot.v1",
      JSON.stringify({
        schemaVersion: 3,
        items: [changedItem, ...mockSeed.items.slice(1)],
        groups: mockSeed.groups,
        collections: mockSeed.collections,
        corrections: [],
        decisions: [],
        sessions: [],
        deviceDeletionRequests: [],
      }),
    );

    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);

    expect(
      (await repositories.items.get(changedItem.id))?.analysis?.summaryEvidence,
    ).toBeUndefined();
  });

  it("migrates schema 3 to empty recall and action-draft histories without inventing events", async () => {
    await driver.setItem(
      "catch.phase1.snapshot.v1",
      JSON.stringify({
        schemaVersion: 3,
        items: mockSeed.items,
        groups: mockSeed.groups,
        collections: mockSeed.collections,
        corrections: [],
        decisions: [],
        sessions: [],
        deviceDeletionRequests: [],
      }),
    );

    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);

    expect(repositories.store.read((snapshot) => snapshot.schemaVersion)).toBe(5);
    expect(await repositories.recallInteractions.list()).toEqual([]);
    expect(await repositories.recallSnapshots.get("2026-08-22")).toBeUndefined();
    expect(await repositories.actionDraftInteractions.list()).toEqual([]);
  });

  it("migrates schema 4 to an empty action-draft history", async () => {
    await driver.setItem(
      "catch.phase1.snapshot.v1",
      JSON.stringify({
        schemaVersion: 4,
        items: mockSeed.items,
        groups: mockSeed.groups,
        collections: mockSeed.collections,
        corrections: [],
        decisions: [],
        sessions: [],
        deviceDeletionRequests: [],
        recallInteractions: [],
        recallSnapshots: [],
      }),
    );

    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);

    expect(repositories.store.read((snapshot) => snapshot.schemaVersion)).toBe(5);
    expect(await repositories.actionDraftInteractions.list()).toEqual([]);
  });

  it("searches approved title, OCR, source, intent and date locally", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);

    expect((await repositories.items.search("볼캡"))[0]?.id).toBe("want-cap");
    expect(await repositories.items.search("검정 러닝화")).toEqual([]);
    expect((await repositories.items.search("Instagram")).length).toBeGreaterThan(1);
    expect((await repositories.items.search("2026-08-19")).length).toBeGreaterThan(0);
    expect((await repositories.items.search("reference")).length).toBeGreaterThan(0);
  });

  it("never exposes sensitive captures through search text or empty-query results", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);

    expect(await repositories.items.search("20260821-001")).toEqual([]);
    expect(await repositories.items.search("출시 일정과 담당자")).toEqual([]);
    expect((await repositories.items.search("")).some((item) => item.analysis?.sensitive)).toBe(
      false,
    );
  });
});
