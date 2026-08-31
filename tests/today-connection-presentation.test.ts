import { describe, expect, it } from "vitest";

import type { ScreenshotGroup, ScreenshotItem } from "../src/contracts/domain";
import { mockScreenshotGroups, mockScreenshotItems } from "../src/data/mock-data";
import {
  presentTodayConnection,
  TODAY_CONNECTION_LIMIT,
} from "../src/domain/today-connection-presentation";

const fixture = (): { group: ScreenshotGroup; items: ScreenshotItem[] } => {
  const group = mockScreenshotGroups[0];
  const items = group.itemIds.map((id) => mockScreenshotItems.find((item) => item.id === id)!);
  return { group, items };
};

describe("Today connection presentation", () => {
  it("keeps the daily social feed finite", () => {
    expect(TODAY_CONNECTION_LIMIT).toBe(3);
  });

  it("uses the connection reason instead of the review summary", () => {
    const { group, items } = fixture();
    const presentation = presentTodayConnection(group, items, 0, 3);

    expect(presentation.representative?.id).toBe(group.representativeItemId);
    expect(presentation.connectionReason).toBe(group.reason);
    expect(presentation.accessibilityLabel).toContain("연결 1/3");
    expect(presentation.accessibilityLabel).toContain("제안 분류 참고");
    expect(presentation.accessibilityLabel).not.toContain(group.summary);
  });

  it("short-circuits all sensitive group presentation details", () => {
    const { group, items } = fixture();
    const sensitiveItems = items.map((item, index) =>
      index === 0 ? { ...item, isSensitive: true } : item,
    );
    const presentation = presentTodayConnection(group, sensitiveItems, 0, 3);

    expect(presentation.protectedGroup).toBe(true);
    expect(presentation.representative).toBeUndefined();
    expect(presentation.source).toBeUndefined();
    expect(presentation.selectedIntent).toBeUndefined();
    expect(presentation.title).toBe("민감한 내용이 포함된 묶음");
    expect(presentation.accessibilityLabel).not.toContain(group.title);
    expect(presentation.accessibilityLabel).not.toContain(group.summary);
    expect(presentation.accessibilityLabel).not.toContain(items[0].source.appName);
  });

  it("also protects a group when analysis marks one item sensitive", () => {
    const { group, items } = fixture();
    const sensitiveItems = items.map((item, index) =>
      index === 1 && item.analysis
        ? { ...item, analysis: { ...item.analysis, sensitive: true } }
        : item,
    );
    const presentation = presentTodayConnection(group, sensitiveItems, 0, 3);

    expect(presentation.protectedGroup).toBe(true);
    expect(presentation.representative).toBeUndefined();
    expect(presentation.source).toBeUndefined();
    expect(presentation.selectedIntent).toBeUndefined();
  });
});
