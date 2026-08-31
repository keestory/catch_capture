import type { Intent, ScreenshotGroup, ScreenshotItem } from "@/contracts/domain";
import { intentLabel } from "@/localization/ko";

import { isScreenshotSensitive } from "./sensitive-presentation";

export const TODAY_CONNECTION_LIMIT = 3;

export interface TodayConnectionPresentation {
  accessibilityLabel: string;
  connectionReason: string;
  position: number;
  protectedGroup: boolean;
  representative?: ScreenshotItem;
  selectedIntent?: Intent;
  source?: string;
  title: string;
}

export function presentTodayConnection(
  group: ScreenshotGroup,
  items: ScreenshotItem[],
  index: number,
  total: number,
): TodayConnectionPresentation {
  const position = index + 1;
  const protectedGroup = items.some(isScreenshotSensitive);

  if (protectedGroup) {
    const title = "민감한 내용이 포함된 묶음";
    const connectionReason = "내용과 이미지를 기본으로 가렸어요.";
    return {
      accessibilityLabel: `연결 ${position}/${total}, 보호된 캡처 ${items.length}장, ${title}, ${connectionReason}`,
      connectionReason,
      position,
      protectedGroup: true,
      title,
    };
  }

  const representative = items.find((item) => item.id === group.representativeItemId) ?? items[0];
  const selectedIntent = group.reviewIntent ?? group.suggestedIntent;
  const source = items.map((item) => item.source.appName).find(Boolean) ?? "출처 혼합";
  const connectionReason = group.reason ?? "";
  const accessibilityLabel = `연결 ${position}/${total}, ${source} 캡처 ${items.length}장, ${group.title}, 제안 분류 ${intentLabel[selectedIntent]}${connectionReason ? `, 연결 근거 ${connectionReason}` : ""}`;

  return {
    accessibilityLabel,
    connectionReason,
    position,
    protectedGroup: false,
    representative,
    selectedIntent,
    source,
    title: group.title,
  };
}
