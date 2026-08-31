import type { Intent, ScreenshotGroup, ScreenshotItem } from "@/contracts/domain";
import { intentLabel } from "@/localization/ko";

import { isScreenshotSensitive } from "./sensitive-presentation";

export interface CaptureHistoryRow {
  label: string;
  value: string;
}

export interface CaptureHistoryPresentation {
  protected: boolean;
  rows: CaptureHistoryRow[];
  note: string;
}

const activeStatuses = new Set([
  "new",
  "processing",
  "ready_for_review",
  "saved",
  "snoozed",
  "completed",
]);

const parseTime = (value: string): number | undefined => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
};

const datePart = (value: number, type: Intl.DateTimeFormatPartTypes): string =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .formatToParts(value)
    .find((part) => part.type === type)?.value ?? "";

export const formatCaptureMoment = (value: string): string | undefined => {
  const timestamp = parseTime(value);
  if (timestamp === undefined) return undefined;
  const year = datePart(timestamp, "year");
  const month = datePart(timestamp, "month");
  const day = datePart(timestamp, "day");
  const dayPeriod = datePart(timestamp, "dayPeriod");
  const hour = datePart(timestamp, "hour");
  const minute = datePart(timestamp, "minute");
  return `${year}. ${month}. ${day}. ${dayPeriod} ${hour}:${minute}`;
};

const formatRecordStart = (timestamp: number): string => {
  const month = datePart(timestamp, "month");
  const day = datePart(timestamp, "day");
  return `${month}월 ${day}일부터`;
};

const effectiveIntent = (item: ScreenshotItem): Intent | undefined =>
  item.intent ?? item.analysis?.suggestedIntent;

const sourceKey = (item: ScreenshotItem): string | undefined =>
  item.source.appName ?? item.source.domain;

export function presentCaptureHistory(
  item: ScreenshotItem,
  items: ScreenshotItem[],
  groups: ScreenshotGroup[],
): CaptureHistoryPresentation {
  if (isScreenshotSensitive(item)) {
    return {
      protected: true,
      rows: [],
      note: "이 장면의 내용과 기록을 기본으로 가렸어요.",
    };
  }

  const visibleItems = items.filter(
    (candidate) => activeStatuses.has(candidate.status) && !isScreenshotSensitive(candidate),
  );
  const capturedAt = formatCaptureMoment(item.capturedAt);
  const capturedTimes = visibleItems
    .map((candidate) => parseTime(candidate.capturedAt))
    .filter((timestamp): timestamp is number => timestamp !== undefined);
  const firstCapturedAt = capturedTimes.length > 0 ? Math.min(...capturedTimes) : undefined;
  const rows: CaptureHistoryRow[] = [];

  if (capturedAt) rows.push({ label: "캡처한 때", value: capturedAt });
  if (firstCapturedAt !== undefined) {
    rows.push({
      label: "보관함 전체",
      value: `${formatRecordStart(firstCapturedAt)} ${visibleItems.length}장`,
    });
  }

  const intent = effectiveIntent(item);
  if (intent) {
    const intentCount = visibleItems.filter(
      (candidate) => effectiveIntent(candidate) === intent,
    ).length;
    rows.push({ label: "이 분류", value: `${intentLabel[intent]}로 남긴 ${intentCount}장` });
  }

  const currentSource = sourceKey(item);
  if (currentSource) {
    const sourceCount = visibleItems.filter(
      (candidate) => sourceKey(candidate) === currentSource,
    ).length;
    rows.push({
      label: "이 출처",
      value:
        sourceCount === 1
          ? `${currentSource}에서 남긴 첫 장면`
          : `${currentSource}에서 남긴 ${sourceCount}장`,
    });
  }

  const relatedIds = new Set(
    groups
      .filter((group) => !group.supersededAt && group.itemIds.includes(item.id))
      .flatMap((group) => group.itemIds)
      .filter((itemId) => itemId !== item.id),
  );
  const relatedCount = visibleItems.filter((candidate) => relatedIds.has(candidate.id)).length;
  if (relatedCount > 0) {
    rows.push({ label: "함께 묶인 장면", value: `이 장면 외 ${relatedCount}장` });
  }

  return {
    protected: false,
    rows,
    note: "현재 이 기기에 남아 있는 Echo 기록을 기준으로 보여드려요.",
  };
}
