import type {
  ScreenshotAnalysis,
  ScreenshotAnalyzer,
  ScreenshotGroup,
  ScreenshotItem,
} from "@/contracts/domain";
import type { LocalDataStore } from "@/data/repositories";
import { MockScreenshotAnalyzer } from "@/data/mock-analyzer";

import type {
  DevicePhotoAccessStatus,
  DeviceScreenshotAsset,
  DeviceScreenshotSource,
} from "./expo-screenshot-source";

export type ScreenshotImportStatus =
  "ready" | "permission_denied" | "permission_not_determined" | "failed";

export interface ScreenshotImportResult {
  status: ScreenshotImportStatus;
  access: DevicePhotoAccessStatus;
  discoveredCount: number;
  importedCount: number;
}

const stableId = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `device-${(hash >>> 0).toString(36)}`;
};

const buildBrowserPreviewAnalysis = (
  asset: DeviceScreenshotAsset,
  analyzedAt: string,
): ScreenshotAnalysis => ({
  title: asset.filename?.replace(/\.[^.]+$/, "").slice(0, 80) || "확인이 필요한 새 캡처",
  summary: "브라우저에서 직접 고른 스크린샷이에요.",
  suggestedIntent: "reference",
  intentConfidence: 0.35,
  needsReview: true,
  contentType: "other",
  contentTypeConfidence: 0.4,
  keywords: ["확인 필요", ...(asset.filename ? [asset.filename.slice(0, 80)] : [])],
  sensitive: false,
  sensitiveRegions: [],
  analyzerVersion: "browser-preview-v1",
  analyzedAt,
});

const buildItem = (
  asset: DeviceScreenshotAsset,
  analysis: ScreenshotAnalysis | undefined,
  importedAt: string,
): ScreenshotItem => ({
  id: stableId(asset.deviceAssetId),
  imageUri: asset.imageUri,
  thumbnailUri: asset.imageUri.startsWith("data:") ? undefined : asset.imageUri,
  width: asset.width,
  height: asset.height,
  capturedAt: asset.capturedAt,
  importedAt,
  source: asset.deviceAssetId.startsWith("browser:") ? { appName: "브라우저 직접 선택" } : {},
  status: analysis ? "ready_for_review" : "new",
  analysis,
  groupIds: [],
  collectionIds: [],
  isLongCapture: asset.height / Math.max(asset.width, 1) >= 2.4,
  isSensitive: analysis?.sensitive ?? false,
  deviceAssetId: asset.deviceAssetId,
});

const buildGroup = (items: ScreenshotItem[], analysis: ScreenshotAnalysis): ScreenshotGroup => ({
  id: `import-group-${stableId(items.map((item) => item.id).join(":"))}`,
  type: "manual",
  itemIds: items.map((item) => item.id),
  representativeItemId: items[0].id,
  suggestedIntent: analysis.suggestedIntent,
  title: items.length > 1 ? `${analysis.title} ${items.length}장` : analysis.title,
  summary: analysis.summary,
  reason:
    items.length > 1 ? "이번에 직접 고른 캡처를 한 번에 확인해요." : "새로 가져온 스크린샷이에요.",
  confidence: analysis.intentConfidence,
  createdAt: items[0].importedAt,
});

const groupImportedItems = (items: ScreenshotItem[]): ScreenshotGroup[] => {
  const buckets = new Map<string, ScreenshotItem[]>();
  for (const item of items) {
    if (!item.analysis) continue;
    const key = `${item.analysis.suggestedIntent}:${item.analysis.contentType}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(item);
    buckets.set(key, bucket);
  }

  const groups: ScreenshotGroup[] = [];
  for (const bucket of buckets.values()) {
    for (let index = 0; index < bucket.length; index += 6) {
      const chunk = bucket.slice(index, index + 6);
      const analysis = chunk[0].analysis;
      if (!analysis) continue;
      const group = buildGroup(chunk, analysis);
      chunk.forEach((item) => item.groupIds.push(group.id));
      groups.push(group);
    }
  }
  return groups;
};

export class ScreenshotImportCoordinator {
  private inFlight?: Promise<ScreenshotImportResult>;

  constructor(
    private readonly store: LocalDataStore,
    private readonly source: DeviceScreenshotSource,
    private readonly analyzer: ScreenshotAnalyzer = new MockScreenshotAnalyzer(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  sync(): Promise<ScreenshotImportResult> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.runSync().finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  private async runSync(): Promise<ScreenshotImportResult> {
    const access = await this.source.getAccess();
    if (access === "denied") {
      return { status: "permission_denied", access, discoveredCount: 0, importedCount: 0 };
    }
    if (access === "not_determined") {
      return {
        status: "permission_not_determined",
        access,
        discoveredCount: 0,
        importedCount: 0,
      };
    }

    const now = this.now();
    const since = new Date(now);
    since.setDate(since.getDate() - 7);
    const assets = await this.source.listScreenshots({ since });
    const knownIds = new Set(
      this.store
        .read((snapshot) => snapshot.items)
        .map((item) => item.deviceAssetId)
        .filter((value): value is string => Boolean(value)),
    );
    const newAssets = assets.filter((asset) => !knownIds.has(asset.deviceAssetId));
    const importedAt = now.toISOString();
    const items: ScreenshotItem[] = [];

    for (const asset of newAssets) {
      let analysis: ScreenshotAnalysis | undefined;
      try {
        analysis = asset.deviceAssetId.startsWith("browser:")
          ? buildBrowserPreviewAnalysis(asset, importedAt)
          : await this.analyzer.analyze({
              id: stableId(asset.deviceAssetId),
              imageUri: asset.imageUri,
              capturedAt: asset.capturedAt,
            });
      } catch {
        analysis = undefined;
      }
      const item = buildItem(asset, analysis, importedAt);
      items.push(item);
    }
    const groups = groupImportedItems(items);

    if (items.length > 0) {
      await this.store.mutate((snapshot) => {
        snapshot.items.push(...items);
        snapshot.groups.push(...groups);
      });
    }

    return {
      status: "ready",
      access,
      discoveredCount: assets.length,
      importedCount: items.length,
    };
  }
}
