import { beforeEach, describe, expect, it } from "vitest";

import { mockSeed } from "@/data/mock-data";
import { createRepositories } from "@/data/repositories";
import type { StorageDriver } from "@/data/storage-driver";
import { MemoryStorageDriver } from "@/data/storage-driver";
import { DeviceDeletionCoordinator } from "@/services/device-deletion-coordinator";
import type {
  DevicePhotoAssetPresence,
  DevicePhotoDeletionResult,
  DevicePhotoLibrary,
} from "@/services/device-photo-library";

class FakePhotoLibrary implements DevicePhotoLibrary {
  deleteCalls: string[] = [];
  deleteResult: DevicePhotoDeletionResult = { status: "deleted" };
  presence: DevicePhotoAssetPresence = "exists";

  async deleteAsset(deviceAssetId: string) {
    this.deleteCalls.push(deviceAssetId);
    return this.deleteResult;
  }

  async assetPresence() {
    return this.presence;
  }

  async openSettings() {
    return true;
  }
}

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

describe("device photo deletion", () => {
  let driver: MemoryStorageDriver;
  let library: FakePhotoLibrary;

  beforeEach(() => {
    driver = new MemoryStorageDriver();
    library = new FakePhotoLibrary();
  });

  it("persists a request before deleting and tombstones only after native success", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DeviceDeletionCoordinator(repositories.store, library);
    const beforeGroups = await repositories.groups.list();
    const beforeSessions = await repositories.sessions.list();

    const result = await coordinator.deleteItem("reference-ad");

    expect(result.status).toBe("deleted");
    expect(library.deleteCalls).toEqual(["mock-asset-reference-ad"]);
    expect(await repositories.items.get("reference-ad")).toMatchObject({
      status: "deleted_from_device",
      deviceAssetId: "mock-asset-reference-ad",
    });
    expect((await repositories.items.get("reference-ad"))?.deletedFromDeviceAt).toBeDefined();
    expect((await repositories.items.list()).some((item) => item.id === "reference-ad")).toBe(
      false,
    );
    expect(await repositories.items.search("크리에이티브")).not.toContainEqual(
      expect.objectContaining({ id: "reference-ad" }),
    );
    expect(await repositories.groups.list()).toEqual(beforeGroups);
    expect(await repositories.sessions.list()).toEqual(beforeSessions);
    expect(repositories.store.read((snapshot) => snapshot.deviceDeletionRequests[0])).toMatchObject(
      { itemId: "reference-ad", state: "succeeded" },
    );
  });

  it("keeps the item unchanged when permission is denied", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    library.deleteResult = { status: "permission_denied", errorCode: "permission_denied" };
    const coordinator = new DeviceDeletionCoordinator(repositories.store, library);

    const result = await coordinator.deleteItem("reference-ad");

    expect(result.status).toBe("permission_denied");
    expect(await repositories.items.get("reference-ad")).toMatchObject({ status: "saved" });
    expect(repositories.store.read((snapshot) => snapshot.deviceDeletionRequests[0])).toMatchObject(
      { state: "failed", errorCode: "permission_denied" },
    );
  });

  it("never calls the native adapter when the pending request cannot be persisted", async () => {
    const failingDriver = new FailingStorageDriver();
    const repositories = createRepositories(failingDriver);
    await repositories.store.initialize(mockSeed);
    failingDriver.failNextWrite = true;
    const coordinator = new DeviceDeletionCoordinator(repositories.store, library);

    await expect(coordinator.deleteItem("reference-ad")).rejects.toThrow("mock storage failure");
    expect(library.deleteCalls).toHaveLength(0);
    expect(await repositories.items.get("reference-ad")).toMatchObject({ status: "saved" });
  });

  it("rejects an unapproved review item before any native deletion", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DeviceDeletionCoordinator(repositories.store, library);

    await expect(coordinator.deleteItem("want-bag")).rejects.toThrow("묶음을 먼저 보관");
    expect(library.deleteCalls).toHaveLength(0);
  });

  it("deduplicates concurrent deletion taps", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    const coordinator = new DeviceDeletionCoordinator(repositories.store, library);

    const [first, second] = await Promise.all([
      coordinator.deleteItem("reference-ad"),
      coordinator.deleteItem("reference-ad"),
    ]);

    expect(first.status).toBe("deleted");
    expect(second.status).toBe("deleted");
    expect(library.deleteCalls).toHaveLength(1);
  });

  it("reconciles a persisted pending request when the asset is confirmed missing", async () => {
    const repositories = createRepositories(driver);
    await repositories.store.initialize(mockSeed);
    await repositories.store.mutate((snapshot) => {
      snapshot.deviceDeletionRequests.push({
        id: "pending-reference-ad",
        itemId: "reference-ad",
        deviceAssetId: "mock-asset-reference-ad",
        previousStatus: "saved",
        state: "pending",
        requestedAt: "2026-08-21T21:30:00+09:00",
      });
    });
    library.presence = "missing";

    await new DeviceDeletionCoordinator(repositories.store, library).reconcilePending();

    expect(await repositories.items.get("reference-ad")).toMatchObject({
      status: "deleted_from_device",
    });
    expect(repositories.store.read((snapshot) => snapshot.deviceDeletionRequests[0].state)).toBe(
      "succeeded",
    );
  });
});
