import type { DeviceDeletionRequest, ScreenshotItem } from "@/contracts/domain";
import type { LocalDataStore } from "@/data/repositories";

import type { DevicePhotoDeletionResult, DevicePhotoLibrary } from "./device-photo-library";

export type DeviceDeletionOutcome = DevicePhotoDeletionResult & {
  requestId?: string;
};

const requestId = (itemId: string, requestedAt: string): string =>
  `device-delete-${itemId}-${requestedAt.replace(/[^0-9]/g, "")}`;

export class DeviceDeletionCoordinator {
  private readonly inFlight = new Map<string, Promise<DeviceDeletionOutcome>>();

  constructor(
    private readonly store: LocalDataStore,
    private readonly photoLibrary: DevicePhotoLibrary,
  ) {}

  deleteItem(itemId: string): Promise<DeviceDeletionOutcome> {
    const existing = this.inFlight.get(itemId);
    if (existing) return existing;
    const operation = this.runDelete(itemId).finally(() => this.inFlight.delete(itemId));
    this.inFlight.set(itemId, operation);
    return operation;
  }

  async reconcilePending(): Promise<void> {
    const pending = this.store.read((snapshot) =>
      snapshot.deviceDeletionRequests.filter((request) => request.state === "pending"),
    );
    for (const request of pending) {
      const presence = await this.photoLibrary.assetPresence(request.deviceAssetId);
      if (presence === "missing") await this.finalize(request.id, request.itemId);
      else if (presence === "exists") await this.fail(request.id, "interrupted_before_delete");
    }
  }

  private async runDelete(itemId: string): Promise<DeviceDeletionOutcome> {
    const prepared = await this.prepare(itemId);
    if (prepared.state === "succeeded") return { status: "deleted", requestId: prepared.id };

    const nativeResult = await this.photoLibrary.deleteAsset(prepared.deviceAssetId);
    if (nativeResult.status === "deleted" || nativeResult.status === "not_found") {
      await this.finalize(prepared.id, itemId);
      return { status: "deleted", requestId: prepared.id };
    }

    await this.fail(prepared.id, nativeResult.errorCode ?? nativeResult.status);
    return { ...nativeResult, requestId: prepared.id };
  }

  private prepare(
    itemId: string,
    requestedAt = new Date().toISOString(),
  ): Promise<DeviceDeletionRequest> {
    return this.store.mutate((snapshot) => {
      const item = snapshot.items.find((candidate) => candidate.id === itemId);
      if (!item) throw new Error("삭제할 캡처를 찾지 못했어요.");
      const succeeded = snapshot.deviceDeletionRequests.find(
        (request) => request.itemId === itemId && request.state === "succeeded",
      );
      if (succeeded || item.status === "deleted_from_device") {
        if (succeeded) return succeeded;
        throw new Error("이미 기기 사진에서 삭제된 캡처예요.");
      }
      if (item.status !== "saved" && item.status !== "completed" && item.status !== "removed") {
        throw new Error("묶음을 먼저 보관한 뒤 기기 사진을 삭제해 주세요.");
      }
      if (!item.deviceAssetId) throw new Error("기기 사진 원본을 찾을 수 없어요.");
      const pending = snapshot.deviceDeletionRequests.find(
        (request) => request.itemId === itemId && request.state === "pending",
      );
      if (pending) return pending;

      const request: DeviceDeletionRequest = {
        id: requestId(itemId, requestedAt),
        itemId,
        deviceAssetId: item.deviceAssetId,
        previousStatus: item.status,
        state: "pending",
        requestedAt,
      };
      snapshot.deviceDeletionRequests.push(request);
      return request;
    });
  }

  private finalize(
    requestIdValue: string,
    itemId: string,
    completedAt = new Date().toISOString(),
  ): Promise<ScreenshotItem> {
    return this.store.mutate((snapshot) => {
      const request = snapshot.deviceDeletionRequests.find(
        (candidate) => candidate.id === requestIdValue,
      );
      const item = snapshot.items.find((candidate) => candidate.id === itemId);
      if (!request || !item) throw new Error("삭제 결과를 저장하지 못했어요.");
      request.state = "succeeded";
      request.completedAt = completedAt;
      delete request.errorCode;
      item.status = "deleted_from_device";
      item.deletedFromDeviceAt = completedAt;
      delete item.removedAt;
      return item;
    });
  }

  private fail(
    requestIdValue: string,
    errorCode: string,
    completedAt = new Date().toISOString(),
  ): Promise<void> {
    return this.store.mutate((snapshot) => {
      const request = snapshot.deviceDeletionRequests.find(
        (candidate) => candidate.id === requestIdValue,
      );
      if (!request || request.state === "succeeded") return;
      request.state = "failed";
      request.completedAt = completedAt;
      request.errorCode = errorCode;
    });
  }
}
