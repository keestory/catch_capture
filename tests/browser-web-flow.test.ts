import { describe, expect, it } from "vitest";

import { mockSeed } from "@/data/mock-data";
import {
  createRepositories,
  DailyReviewCoordinator,
  emptyRepositorySeed,
} from "@/data/repositories";
import { MemoryStorageDriver } from "@/data/storage-driver";
import { resolveItemReviewDate, resolveReviewDate } from "@/domain/review-date";
import {
  BROWSER_IMAGE_ACCEPT,
  BROWSER_SELECTION_LIMIT,
  BrowserScreenshotSource,
  isSupportedBrowserImage,
  limitBrowserSelection,
} from "@/services/browser-screenshot-source";
import { ko } from "@/localization/ko";
import type {
  DeviceScreenshotAsset,
  DeviceScreenshotSource,
} from "@/services/expo-screenshot-source";
import { ScreenshotImportCoordinator } from "@/services/screenshot-import-coordinator";

class SelectedBrowserSource implements DeviceScreenshotSource {
  constructor(private readonly assets: DeviceScreenshotAsset[]) {}

  async requestAccess() {
    return "denied" as const;
  }

  async getAccess() {
    return "limited" as const;
  }

  async presentLimitedSelection() {}

  async listScreenshots() {
    return this.assets;
  }
}

describe("web-first screenshot entry", () => {
  it("accepts only supported browser image formats", () => {
    expect(isSupportedBrowserImage({ type: "image/png" })).toBe(true);
    expect(isSupportedBrowserImage({ type: "image/jpeg" })).toBe(true);
    expect(isSupportedBrowserImage({ type: "image/webp" })).toBe(true);
    expect(isSupportedBrowserImage({ type: "image/gif" })).toBe(false);
    expect(isSupportedBrowserImage({ type: "application/pdf" })).toBe(false);
  });

  it("keeps the first browser slice intentionally bounded", () => {
    const files = Array.from({ length: 20 }, (_, index) => index);
    expect(limitBrowserSelection(files)).toEqual(
      Array.from({ length: BROWSER_SELECTION_LIMIT }, (_, index) => index),
    );
  });

  it("asks for supported screenshot image types through the system picker", () => {
    expect(BROWSER_IMAGE_ACCEPT).toContain(".png");
    expect(BROWSER_IMAGE_ACCEPT).toContain(".jpg");
    expect(BROWSER_IMAGE_ACCEPT).toContain(".webp");
    expect(BROWSER_IMAGE_ACCEPT).not.toContain("image/*");
  });

  it("explains the mobile web boundary without pretending to grant photo access", () => {
    expect(ko.onboarding.webTitle).toContain("사진 접근 권한 대신");
    expect(ko.onboarding.webBoundaryTitle).toContain("사진 전체 접근 권한을 받지 않아요");
    expect(ko.onboarding.webSelect).toBe("사진 앱에서 스크린샷 고르기");
    expect(ko.today.webImportBody).toContain("고른 스크린샷만");
    expect(ko.today.webImportFootnote).toContain("최대 6장");
  });

  it("does not pretend the browser has photo-library permission", async () => {
    const source = new BrowserScreenshotSource();
    expect(await source.requestAccess()).toBe("denied");
    expect(await source.getAccess()).toBe("denied");
    expect(await source.listScreenshots()).toEqual([]);
  });

  it("reviews manually selected old captures on their import day", () => {
    const item = {
      ...mockSeed.items[0],
      capturedAt: "2025-01-02T08:30:00.000Z",
      importedAt: "2026-08-29T12:00:00.000Z",
      status: "ready_for_review" as const,
    };

    expect(resolveItemReviewDate(item, "manual")).toBe("2026-08-29");
    expect(resolveReviewDate([item], "manual")).toBe("2026-08-29");
  });

  it("imports one browser selection as a bounded manual review group", async () => {
    const repositories = createRepositories(new MemoryStorageDriver());
    await repositories.store.initialize(emptyRepositorySeed());
    const source = new SelectedBrowserSource([
      {
        deviceAssetId: "browser:first",
        imageUri: "data:image/webp;base64,first",
        width: 390,
        height: 844,
        capturedAt: "2025-01-02T08:30:00.000Z",
        filename: "running-shoes.png",
      },
      {
        deviceAssetId: "browser:second",
        imageUri: "data:image/webp;base64,second",
        width: 390,
        height: 844,
        capturedAt: "2025-01-03T08:30:00.000Z",
        filename: "event-reference.png",
      },
    ]);

    expect(
      await new ScreenshotImportCoordinator(
        repositories.store,
        source,
        undefined,
        () => new Date("2026-08-29T12:00:00.000Z"),
      ).sync(),
    ).toMatchObject({ status: "ready", importedCount: 2 });

    const items = await repositories.items.list();
    const groups = await repositories.groups.list();
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      source: { appName: "브라우저 직접 선택" },
      analysis: { needsReview: true, analyzerVersion: "browser-preview-v1" },
    });
    expect(items[0].thumbnailUri).toBeUndefined();
    expect(items.map((item) => item.analysis?.title)).toEqual(["running-shoes", "event-reference"]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ type: "manual", itemIds: expect.any(Array) });
    expect(groups[0].itemIds).toHaveLength(2);

    const session = await new DailyReviewCoordinator(repositories.store).startOrResume(
      "2026-08-29",
      "2026-08-29T12:01:00.000Z",
      undefined,
      "manual",
    );
    expect(session.initialItemIds).toHaveLength(2);
  });
});
