import { describe, expect, it } from "vitest";

import { primaryNavigationItems } from "../src/domain/primary-navigation-presentation";

describe("primary navigation presentation", () => {
  it("keeps the organizer between Library and Search", () => {
    expect(primaryNavigationItems.map((item) => item.name)).toEqual(["library", "index", "search"]);
    expect(primaryNavigationItems[1]).toMatchObject({
      icon: "organize",
      emphasis: "primary",
      title: "오늘",
    });
  });

  it("retains meaningful Korean names when visible labels are hidden", () => {
    expect(primaryNavigationItems.map((item) => item.accessibilityLabel)).toEqual([
      "보관함",
      "오늘의 스크린샷 정리",
      "찾기",
    ]);
    expect(new Set(primaryNavigationItems.map((item) => item.accessibilityLabel)).size).toBe(
      primaryNavigationItems.length,
    );
  });
});
