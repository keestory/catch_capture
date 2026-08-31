import type { ScreenshotItem } from "@/contracts/domain";

import { isScreenshotSensitive } from "./sensitive-presentation";

export type ScreenshotMediaPresentation<TBundledSource> =
  | { kind: "sensitive" }
  | { kind: "bundled"; source: TBundledSource; uri: string }
  | { kind: "device"; source: { uri: string }; uri: string }
  | { kind: "scene"; uri: string }
  | { kind: "unavailable"; uri: string };

export function presentScreenshotMedia<TBundledSource>(
  item: ScreenshotItem,
  options: {
    preferOriginal?: boolean;
    resolveBundled(uri: string): TBundledSource | undefined;
  },
): ScreenshotMediaPresentation<TBundledSource> {
  if (isScreenshotSensitive(item)) return { kind: "sensitive" };

  const uri = options.preferOriginal ? item.imageUri : (item.thumbnailUri ?? item.imageUri);
  if (uri.startsWith("mock-photo://")) {
    const source = options.resolveBundled(uri);
    return source ? { kind: "bundled", source, uri } : { kind: "unavailable", uri };
  }
  if (uri.startsWith("mock://") || uri.startsWith("mock-thumb://")) {
    return { kind: "scene", uri };
  }
  return { kind: "device", source: { uri }, uri };
}
