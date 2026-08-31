import { describe, expect, it, vi } from "vitest";

import type { ScreenshotAnalysis, ScreenshotAnalyzer } from "@/contracts/domain";
import { createRepositories, emptyRepositorySeed, ReviewCoordinator } from "@/data/repositories";
import { MemoryStorageDriver } from "@/data/storage-driver";
import { NativePhotoAccessAdapter } from "@/onboarding/photo-access-adapter";
import { DeviceDeletionCoordinator } from "@/services/device-deletion-coordinator";
import type { DevicePhotoLibrary } from "@/services/device-photo-library";
import { ExpoScreenshotSource } from "@/services/expo-screenshot-source";
import type {
  DevicePhotoAccessStatus,
  DeviceScreenshotAsset,
  DeviceScreenshotSource,
} from "@/services/expo-screenshot-source";
import { ScreenshotImportCoordinator } from "@/services/screenshot-import-coordinator";

vi.mock("react-native", () => ({
  Linking: { openSettings: vi.fn(async () => undefined) },
  Platform: { OS: "ios" },
}));

const analysis: ScreenshotAnalysis = {
  title: "새 스크린샷",
  summary: "기기에서 가져온 스크린샷이에요.",
  suggestedIntent: "reference",
  intentConfidence: 0.7,
  needsReview: true,
  contentType: "other",
  contentTypeConfidence: 0.4,
  keywords: ["확인 필요"],
  sensitive: false,
  sensitiveRegions: [],
  analyzerVersion: "test-v1",
  analyzedAt: "2026-08-21T10:00:00.000Z",
};

class FakeScreenshotSource implements DeviceScreenshotSource {
  access: DevicePhotoAccessStatus = "full";
  assets: DeviceScreenshotAsset[] = [];
  pickerCount = 0;

  async requestAccess() {
    return this.access;
  }

  async getAccess() {
    return this.access;
  }

  async presentLimitedSelection() {
    this.pickerCount += 1;
  }

  async listScreenshots() {
    return this.assets;
  }
}

class TestAnalyzer implements ScreenshotAnalyzer {
  async analyze() {
    return analysis;
  }
}

class RecordingPhotoLibrary implements DevicePhotoLibrary {
  deletedIds: string[] = [];

  async deleteAsset(deviceAssetId: string) {
    this.deletedIds.push(deviceAssetId);
    return { status: "deleted" as const };
  }

  async assetPresence() {
    return "exists" as const;
  }

  async openSettings() {
    return true;
  }
}

describe("native photo flow", () => {
  it("stores the real ph asset id and sends the same id to device deletion", async () => {
    const repositories = createRepositories(new MemoryStorageDriver());
    await repositories.store.initialize(emptyRepositorySeed());
    const source = new FakeScreenshotSource();
    source.assets = [
      {
        deviceAssetId: "ph://A1/L0/001",
        imageUri: "ph://A1/L0/001",
        width: 1179,
        height: 2556,
        capturedAt: "2026-08-21T08:30:00.000Z",
      },
    ];
    const importer = new ScreenshotImportCoordinator(
      repositories.store,
      source,
      new TestAnalyzer(),
      () => new Date("2026-08-21T10:00:00.000Z"),
    );

    expect(await importer.sync()).toMatchObject({ status: "ready", importedCount: 1 });
    expect(await importer.sync()).toMatchObject({ importedCount: 0 });
    const [item] = await repositories.items.list();
    const [group] = await repositories.groups.list();
    expect(item).toMatchObject({
      imageUri: "ph://A1/L0/001",
      deviceAssetId: "ph://A1/L0/001",
      status: "ready_for_review",
    });
    expect(group.itemIds).toEqual([item.id]);

    await new ReviewCoordinator(repositories.store).approveGroup(group.id, "reference");
    const photoLibrary = new RecordingPhotoLibrary();
    expect(
      await new DeviceDeletionCoordinator(repositories.store, photoLibrary).deleteItem(item.id),
    ).toMatchObject({ status: "deleted" });
    expect(photoLibrary.deletedIds).toEqual(["ph://A1/L0/001"]);
    expect(await repositories.items.get(item.id)).toMatchObject({ status: "deleted_from_device" });
  });

  it("does not query or mutate the repository when access is denied", async () => {
    const repositories = createRepositories(new MemoryStorageDriver());
    await repositories.store.initialize(emptyRepositorySeed());
    const source = new FakeScreenshotSource();
    source.access = "denied";

    const result = await new ScreenshotImportCoordinator(
      repositories.store,
      source,
      new TestAnalyzer(),
    ).sync();

    expect(result).toMatchObject({ status: "permission_denied", importedCount: 0 });
    expect(await repositories.items.list()).toEqual([]);
  });

  it("uses the limited-library picker and counts only accessible screenshots", async () => {
    const source = new FakeScreenshotSource();
    source.access = "limited";
    source.assets = [
      {
        deviceAssetId: "ph://selected",
        imageUri: "ph://selected",
        width: 1179,
        height: 2556,
        capturedAt: "2026-08-21T08:30:00.000Z",
      },
    ];

    expect(await new NativePhotoAccessAdapter(source).selectScreenshots()).toBe(1);
    expect(source.pickerCount).toBe(1);
  });

  it("filters iOS photo metadata by the screenshot subtype without changing the asset id", async () => {
    const metadata = [
      {
        id: "ph://screenshot",
        filename: "IMG_1001.PNG",
        mediaType: "image",
        width: 1179,
        height: 2556,
        duration: null,
        creationTime: new Date("2026-08-21T08:30:00.000Z").getTime(),
        modificationTime: null,
        isFavorite: false,
      },
      {
        id: "ph://camera-photo",
        filename: "IMG_1002.HEIC",
        mediaType: "image",
        width: 4032,
        height: 3024,
        duration: null,
        creationTime: new Date("2026-08-21T08:31:00.000Z").getTime(),
        modificationTime: null,
        isFavorite: false,
      },
    ];
    class FakeQuery {
      eq() {
        return this;
      }
      gte() {
        return this;
      }
      orderBy() {
        return this;
      }
      async exeForMetadata() {
        return metadata;
      }
    }
    class FakeAsset {
      constructor(readonly id: string) {}
      async getMediaSubtypes() {
        return this.id === "ph://screenshot" ? ["screenshot"] : [];
      }
    }
    const mediaLibrary = {
      Query: FakeQuery,
      Asset: FakeAsset,
      AssetField: { MEDIA_TYPE: "mediaType", CREATION_TIME: "creationTime" },
      MediaType: { IMAGE: "image" },
      MediaSubtype: { SCREENSHOT: "screenshot" },
      async getPermissionsAsync() {
        return {
          status: "granted",
          granted: true,
          canAskAgain: true,
          expires: "never",
          accessPrivileges: "all",
        };
      },
    };
    const source = new ExpoScreenshotSource(
      async () => mediaLibrary as unknown as typeof import("expo-media-library"),
      "ios",
    );

    expect(await source.listScreenshots({ since: new Date("2026-08-20T00:00:00.000Z") })).toEqual([
      expect.objectContaining({
        deviceAssetId: "ph://screenshot",
        imageUri: "ph://screenshot",
      }),
    ]);
  });
});
