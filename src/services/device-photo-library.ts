export type DevicePhotoDeletionStatus =
  "deleted" | "not_found" | "cancelled" | "permission_denied" | "unavailable" | "failed";

export interface DevicePhotoDeletionResult {
  status: DevicePhotoDeletionStatus;
  errorCode?: string;
}

export type DevicePhotoAssetPresence = "exists" | "missing" | "unknown";

export interface DevicePhotoLibrary {
  deleteAsset(deviceAssetId: string): Promise<DevicePhotoDeletionResult>;
  assetPresence(deviceAssetId: string): Promise<DevicePhotoAssetPresence>;
  openSettings(): Promise<boolean>;
}
