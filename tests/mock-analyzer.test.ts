import { describe, expect, it } from "vitest";

import { MockScreenshotAnalyzer } from "@/data/mock-analyzer";

describe("MockScreenshotAnalyzer", () => {
  const analyzer = new MockScreenshotAnalyzer();

  it("keeps the analyzer behind the provider-independent contract", async () => {
    const result = await analyzer.analyze({
      id: "shoe",
      imageUri: "mock://running-shoe-product",
      capturedAt: "2026-08-21T12:00:00+09:00",
      source: { appName: "MUSINSA" },
    });
    expect(result).toMatchObject({ suggestedIntent: "want", contentType: "product" });
    expect(result.intentConfidence).toBeGreaterThan(0.5);
    expect(result.summaryEvidence?.basis).toBe("visual_embedding");
    expect(result.summary).toContain("상품");
  });

  it("summarizes readable OCR and exposes only short, verifiable evidence", async () => {
    const result = await analyzer.analyze({
      id: "shoe-with-text",
      imageUri: "mock://running-shoe-product",
      capturedAt: "2026-08-21T12:00:00+09:00",
      ocrText: "Cloud Runner Black · 129,000원",
    });

    expect(result.summary).toBe("Cloud Runner Black · 129,000원");
    expect(result.summaryEvidence).toMatchObject({
      basis: "ocr_text",
      signals: ["Cloud Runner Black", "129,000원"],
    });
    expect(result.summaryEvidence).not.toHaveProperty("reasoning");
  });

  it("uses a low-confidence reviewable fallback instead of silently guessing", async () => {
    const result = await analyzer.analyze({
      id: "unknown",
      imageUri: "mock://unknown-scene",
      capturedAt: "2026-08-21T12:00:00+09:00",
    });
    expect(result.suggestedIntent).not.toBe("keep");
    expect(result.needsReview).toBe(true);
    expect(result.intentConfidence).toBeLessThan(0.5);
  });

  it("surfaces an item-level analysis failure for retry", async () => {
    await expect(
      analyzer.analyze({
        id: "failure",
        imageUri: "mock://analysis-failure",
        capturedAt: "2026-08-21T12:00:00+09:00",
      }),
    ).rejects.toThrow("읽을 수 있는 정보");
  });
});
