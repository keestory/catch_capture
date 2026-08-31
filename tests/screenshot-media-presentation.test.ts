import { describe, expect, it, vi } from "vitest";

import type { ScreenshotItem } from "@/contracts/domain";
import { mockScreenshotItems } from "@/data/mock-data";
import { presentScreenshotMedia } from "@/domain/screenshot-media-presentation";

const getItem = (id: string): ScreenshotItem => {
  const item = mockScreenshotItems.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing fixture: ${id}`);
  return item;
};

describe("screenshot media presentation", () => {
  it("short-circuits sensitive items before resolving an asset", () => {
    const resolver = vi.fn(() => 1);
    const sensitive: ScreenshotItem = {
      ...getItem("keep-order-sensitive"),
      imageUri: "mock-photo://should-never-resolve",
      thumbnailUri: "mock-photo://should-never-resolve",
    };

    expect(presentScreenshotMedia(sensitive, { resolveBundled: resolver })).toEqual({
      kind: "sensitive",
    });
    expect(resolver).not.toHaveBeenCalled();
  });

  it("uses the original image instead of the thumbnail in fullscreen", () => {
    const item: ScreenshotItem = {
      ...getItem("reference-live-shopping"),
      imageUri: "mock-photo://original",
      thumbnailUri: "mock-photo://thumbnail",
    };
    const resolver = vi.fn((uri: string) => (uri.endsWith("original") ? 27 : 13));

    expect(
      presentScreenshotMedia(item, { preferOriginal: true, resolveBundled: resolver }),
    ).toEqual({ kind: "bundled", source: 27, uri: "mock-photo://original" });
    expect(resolver).toHaveBeenCalledWith("mock-photo://original");
  });

  it("keeps device, generated scene and broken bundled sources distinct", () => {
    const base = getItem("reference-live-shopping");
    expect(
      presentScreenshotMedia(
        { ...base, imageUri: "ph://original", thumbnailUri: "file://thumb.jpg" },
        { preferOriginal: true, resolveBundled: () => undefined },
      ),
    ).toEqual({ kind: "device", source: { uri: "ph://original" }, uri: "ph://original" });
    expect(
      presentScreenshotMedia(
        { ...base, imageUri: "mock://scene", thumbnailUri: "mock-thumb://scene" },
        { resolveBundled: () => undefined },
      ),
    ).toEqual({ kind: "scene", uri: "mock-thumb://scene" });
    expect(
      presentScreenshotMedia(
        { ...base, imageUri: "mock-photo://missing", thumbnailUri: undefined },
        { resolveBundled: () => undefined },
      ),
    ).toEqual({ kind: "unavailable", uri: "mock-photo://missing" });
  });
});
