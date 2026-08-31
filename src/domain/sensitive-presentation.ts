import type { ScreenshotItem } from "@/contracts/domain";

export function isScreenshotSensitive(item: ScreenshotItem): boolean {
  return item.isSensitive || item.analysis?.sensitive === true;
}
