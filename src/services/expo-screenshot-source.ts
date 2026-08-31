import { Platform } from "react-native";

export type DevicePhotoAccessStatus = "not_determined" | "full" | "limited" | "denied";

export interface DeviceScreenshotAsset {
  deviceAssetId: string;
  imageUri: string;
  width: number;
  height: number;
  capturedAt: string;
  filename?: string;
}

export interface DeviceScreenshotSource {
  requestAccess(preferredMode?: "full" | "limited"): Promise<DevicePhotoAccessStatus>;
  getAccess(): Promise<DevicePhotoAccessStatus>;
  presentLimitedSelection(): Promise<void>;
  listScreenshots(options: { since: Date }): Promise<DeviceScreenshotAsset[]>;
}

type MediaLibraryModule = typeof import("expo-media-library");
type MediaLibraryLoader = () => Promise<MediaLibraryModule>;

const mapPermission = (
  response: Awaited<ReturnType<MediaLibraryModule["getPermissionsAsync"]>>,
): DevicePhotoAccessStatus => {
  if (response.accessPrivileges === "all") return "full";
  if (response.accessPrivileges === "limited") return "limited";
  if (response.status === "granted") return "full";
  if (response.status === "undetermined") return "not_determined";
  return "denied";
};

const filenameLooksLikeScreenshot = (filename: string | null): boolean =>
  Boolean(filename && /(screen[ _-]?shot|screenshot|스크린샷)/i.test(filename));

const toLocalIsoString = (timestamp: number): string => {
  const date = new Date(timestamp);
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetRemainder = String(absoluteOffset % 60).padStart(2, "0");
  const local = new Date(timestamp + offsetMinutes * 60_000).toISOString().slice(0, -1);
  return `${local}${sign}${offsetHours}:${offsetRemainder}`;
};

export class ExpoScreenshotSource implements DeviceScreenshotSource {
  constructor(
    private readonly loadMediaLibrary: MediaLibraryLoader = () => import("expo-media-library"),
    private readonly platform: typeof Platform.OS = Platform.OS,
  ) {}

  async requestAccess(preferredMode: "full" | "limited" = "full") {
    if (this.platform === "web") return "denied" as const;
    const mediaLibrary = await this.loadMediaLibrary();
    const current = mapPermission(await mediaLibrary.getPermissionsAsync(false, ["photo"]));

    if (current === "limited" && preferredMode === "limited") {
      await mediaLibrary.presentPermissionsPicker(["photo"]);
      return mapPermission(await mediaLibrary.getPermissionsAsync(false, ["photo"]));
    }
    if (current === "full" || current === "limited") return current;

    return mapPermission(await mediaLibrary.requestPermissionsAsync(false, ["photo"]));
  }

  async getAccess() {
    if (this.platform === "web") return "denied" as const;
    const mediaLibrary = await this.loadMediaLibrary();
    return mapPermission(await mediaLibrary.getPermissionsAsync(false, ["photo"]));
  }

  async presentLimitedSelection(): Promise<void> {
    if (this.platform === "web") return;
    const mediaLibrary = await this.loadMediaLibrary();
    const access = mapPermission(await mediaLibrary.getPermissionsAsync(false, ["photo"]));
    if (access === "limited") await mediaLibrary.presentPermissionsPicker(["photo"]);
  }

  async listScreenshots({ since }: { since: Date }): Promise<DeviceScreenshotAsset[]> {
    if (this.platform === "web") return [];
    const mediaLibrary = await this.loadMediaLibrary();
    const access = mapPermission(await mediaLibrary.getPermissionsAsync(false, ["photo"]));
    if (access !== "full" && access !== "limited") return [];

    const metadata = await new mediaLibrary.Query()
      .eq(mediaLibrary.AssetField.MEDIA_TYPE, mediaLibrary.MediaType.IMAGE)
      .gte(mediaLibrary.AssetField.CREATION_TIME, since.getTime())
      .orderBy({ key: mediaLibrary.AssetField.CREATION_TIME, ascending: false })
      .exeForMetadata();

    const screenshots: DeviceScreenshotAsset[] = [];
    const batchSize = 20;
    for (let index = 0; index < metadata.length; index += batchSize) {
      const batch = metadata.slice(index, index + batchSize);
      const matches = await Promise.all(
        batch.map(async (asset) => {
          if (this.platform === "android") return filenameLooksLikeScreenshot(asset.filename);
          try {
            const subtypes = await new mediaLibrary.Asset(asset.id).getMediaSubtypes();
            return subtypes.includes(mediaLibrary.MediaSubtype.SCREENSHOT);
          } catch {
            return false;
          }
        }),
      );

      batch.forEach((asset, batchIndex) => {
        if (!matches[batchIndex] || asset.creationTime === null) return;
        screenshots.push({
          deviceAssetId: asset.id,
          imageUri: asset.id,
          width: asset.width ?? 1,
          height: asset.height ?? 1,
          capturedAt: toLocalIsoString(asset.creationTime),
          filename: asset.filename ?? undefined,
        });
      });
    }
    return screenshots;
  }
}
