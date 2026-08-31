import { describe, expect, it } from "vitest";

import type { ContentType } from "../src/contracts/domain";
import { echoContentTypeLabel, echoMemoryAssetName } from "../src/domain/content-type-presentation";

const contentTypes: ContentType[] = [
  "product",
  "article",
  "ui_reference",
  "social_post",
  "conversation",
  "place",
  "event",
  "video_frame",
  "document",
  "other",
];

describe("Echo Memory Asset taxonomy", () => {
  it("covers every canonical content type", () => {
    expect(Object.keys(echoMemoryAssetName).sort()).toEqual([...contentTypes].sort());
    expect(Object.keys(echoContentTypeLabel).sort()).toEqual([...contentTypes].sort());
  });

  it("keeps every asset name and visible Korean label distinct", () => {
    expect(new Set(Object.values(echoMemoryAssetName)).size).toBe(contentTypes.length);
    expect(new Set(Object.values(echoContentTypeLabel)).size).toBe(contentTypes.length);
    contentTypes.forEach((contentType) => {
      expect(echoMemoryAssetName[contentType]).not.toHaveLength(0);
      expect(echoContentTypeLabel[contentType]).toMatch(/[가-힣]/);
    });
  });
});
