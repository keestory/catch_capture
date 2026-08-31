import type { ScreenshotGroup, ScreenshotItem } from "@/contracts/domain";
import { buildDailyRecallSnapshot } from "@/domain/recall-policy";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const canShowOriginal = (item: ScreenshotItem): boolean => {
  const uri = item.thumbnailUri ?? item.imageUri;
  return (
    !isScreenshotSensitive(item) && !uri.startsWith("mock://") && !uri.startsWith("mock-thumb://")
  );
};

const calendarDate = (value: string): string => value.slice(0, 10);

export interface FirstResultPresentation {
  itemCount: number;
  groupCount: number;
  pastCount: number;
  recentDateLabel: string;
  pastDateLabel: string;
  evidenceItems: ScreenshotItem[];
}

const formatDate = (value?: string): string => {
  if (!value) return "날짜 미상";
  return new Date(value).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
};

export function buildFirstResultPresentation(
  items: ScreenshotItem[],
  groups: ScreenshotGroup[],
  groupLimit = 3,
  now = new Date().toISOString(),
): FirstResultPresentation {
  const selectedGroups = groups.slice(0, Math.max(0, groupLimit));
  const reviewItemIds = unique(selectedGroups.flatMap((group) => group.itemIds));
  const mediaItems = items
    .filter(canShowOriginal)
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
  const newestDate = mediaItems[0] ? calendarDate(mediaItems[0].capturedAt) : undefined;
  const recent = mediaItems
    .filter((item) => calendarDate(item.capturedAt) === newestDate)
    .slice(0, 2);
  const recall = buildDailyRecallSnapshot({
    items: mediaItems,
    anchorItems: recent,
    now,
    limit: 2,
  });
  const recallItemIds = new Set(recall.candidates.map((candidate) => candidate.itemId));
  const older = mediaItems.filter((item) => recallItemIds.has(item.id));
  const evidenceItems = unique([
    ...recent,
    ...older.slice(0, Math.max(0, 3 - recent.length)),
  ]).slice(0, 3);
  const pastItem = evidenceItems.find((item) => calendarDate(item.capturedAt) !== newestDate);

  return {
    itemCount: reviewItemIds.length,
    groupCount: selectedGroups.length,
    pastCount: recall.candidates.length,
    recentDateLabel: formatDate(evidenceItems[0]?.capturedAt),
    pastDateLabel: formatDate(pastItem?.capturedAt),
    evidenceItems,
  };
}
