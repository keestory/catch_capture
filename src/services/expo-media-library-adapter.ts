import { Linking, Platform } from "react-native";

import type {
  DevicePhotoAssetPresence,
  DevicePhotoDeletionResult,
  DevicePhotoLibrary,
} from "./device-photo-library";

const normalizeAssetReference = (deviceAssetId: string): string | undefined => {
  if (!deviceAssetId || deviceAssetId.startsWith("mock-asset-")) return undefined;
  if (Platform.OS === "ios") {
    return deviceAssetId.startsWith("ph://") ? deviceAssetId : `ph://${deviceAssetId}`;
  }
  if (Platform.OS === "android" && deviceAssetId.startsWith("content://")) return deviceAssetId;
  return undefined;
};

const classifyNativeError = (reason: unknown): DevicePhotoDeletionResult => {
  const message = reason instanceof Error ? reason.message.toLocaleLowerCase() : "";
  if (message.includes("cancel")) return { status: "cancelled", errorCode: "user_cancelled" };
  if (
    message.includes("permission") ||
    message.includes("denied") ||
    message.includes("not authorized")
  ) {
    return { status: "permission_denied", errorCode: "permission_denied" };
  }
  if (message.includes("not found") || message.includes("does not exist")) {
    return { status: "not_found", errorCode: "asset_not_found" };
  }
  return { status: "failed", errorCode: "native_delete_failed" };
};

export class ExpoDevicePhotoLibrary implements DevicePhotoLibrary {
  async deleteAsset(deviceAssetId: string): Promise<DevicePhotoDeletionResult> {
    if (Platform.OS === "web") return { status: "unavailable", errorCode: "web_unsupported" };
    const assetReference = normalizeAssetReference(deviceAssetId);
    if (!assetReference) return { status: "unavailable", errorCode: "invalid_asset_reference" };

    try {
      const { Asset } = await import("expo-media-library");
      await new Asset(assetReference).delete();
      return { status: "deleted" };
    } catch (reason) {
      return classifyNativeError(reason);
    }
  }

  async assetPresence(deviceAssetId: string): Promise<DevicePhotoAssetPresence> {
    if (Platform.OS === "web") return "unknown";
    const assetReference = normalizeAssetReference(deviceAssetId);
    if (!assetReference) return "unknown";
    try {
      const { Asset } = await import("expo-media-library");
      await new Asset(assetReference).getInfo();
      return "exists";
    } catch (reason) {
      return classifyNativeError(reason).status === "not_found" ? "missing" : "unknown";
    }
  }

  async openSettings(): Promise<boolean> {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }
}
