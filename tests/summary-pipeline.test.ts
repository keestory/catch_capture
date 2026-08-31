import { describe, expect, it, vi } from "vitest";

import {
  MockImageVectorizer,
  MockTextSummaryModel,
  MockVisualSummaryModel,
} from "@/analysis/mock-summary-models";
import {
  hasMeaningfulOcrText,
  type ImageEmbedding,
  SummaryPipeline,
} from "@/analysis/summary-pipeline";

describe("SummaryPipeline", () => {
  it("routes meaningful OCR to the text summarizer without vectorizing the image", async () => {
    const textModel = new MockTextSummaryModel();
    const imageVectorizer = new MockImageVectorizer();
    const textSpy = vi.spyOn(textModel, "summarize");
    const vectorSpy = vi.spyOn(imageVectorizer, "embed");
    const pipeline = new SummaryPipeline(textModel, imageVectorizer, new MockVisualSummaryModel());

    const result = await pipeline.summarize({
      imageUri: "mock://running-shoe-product",
      ocrText: "Cloud Runner Black · 129,000원",
    });

    expect(textSpy).toHaveBeenCalledOnce();
    expect(vectorSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      summary: "Cloud Runner Black · 129,000원",
      evidence: { basis: "ocr_text", modelVersion: "mock-text-summary-v1" },
      fallbackUsed: false,
    });
    expect(result.embedding).toBeUndefined();
  });

  it("vectorizes an image before visual summarization when readable text is absent", async () => {
    const pipeline = new SummaryPipeline(
      new MockTextSummaryModel(),
      new MockImageVectorizer(),
      new MockVisualSummaryModel(),
    );

    const first = await pipeline.summarize({ imageUri: "mock://youtube-video-frame" });
    const second = await pipeline.summarize({
      imageUri: "mock://youtube-video-frame",
      ocrText: "  24  ",
    });

    expect(first.evidence).toMatchObject({
      basis: "visual_embedding",
      modelVersion: "mock-visual-summary-v1",
    });
    expect(first.summary).toContain("영상");
    expect(first.embedding?.vector).toHaveLength(12);
    expect(second.embedding?.vector).toEqual(first.embedding?.vector);
    const magnitude = Math.sqrt(
      first.embedding!.vector.reduce((sum, value) => sum + value * value, 0),
    );
    expect(magnitude).toBeCloseTo(1, 5);
  });

  it("falls back to the visual route when text summarization fails", async () => {
    const pipeline = new SummaryPipeline(
      {
        modelVersion: "failing-text-v1",
        summarize: vi.fn().mockRejectedValue(new Error("provider raw failure")),
      },
      new MockImageVectorizer(),
      new MockVisualSummaryModel(),
    );

    const result = await pipeline.summarize({
      imageUri: "mock://product-image",
      ocrText: "읽을 수 있는 충분한 상품 설명입니다",
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.evidence.basis).toBe("visual_embedding");
    expect(result.evidence.explanation).not.toContain("provider");
    expect(JSON.stringify(result)).not.toContain("raw failure");
  });

  it("passes an in-memory embedding to the visual model without putting it in evidence", async () => {
    const visualModel = {
      modelVersion: "visual-test-v1",
      summarize: vi.fn().mockResolvedValue({
        summary: "붉은 배경의 상품 화면",
        signals: ["붉은 배경", "상품 이미지", "가격 영역", "ignored fourth"],
      }),
    };
    const pipeline = new SummaryPipeline(
      new MockTextSummaryModel(),
      {
        embed: vi.fn().mockResolvedValue({
          vector: [0.25, 0.75],
          modelVersion: "embedding-test-v1",
        } satisfies ImageEmbedding),
      },
      visualModel,
    );

    const result = await pipeline.summarize({ imageUri: "mock://visual-only" });

    expect(visualModel.summarize).toHaveBeenCalledWith(
      expect.objectContaining({
        embedding: expect.objectContaining({ vector: [0.25, 0.75] }),
      }),
    );
    expect(result.evidence.signals).toEqual(["붉은 배경", "상품 이미지", "가격 영역"]);
    expect("vector" in result.evidence).toBe(false);
  });

  it("uses a conservative OCR quality gate", () => {
    expect(hasMeaningfulOcrText("Cloud Runner 129,000원")).toBe(true);
    expect(hasMeaningfulOcrText("    ")).toBe(false);
    expect(hasMeaningfulOcrText("24")).toBe(false);
    expect(hasMeaningfulOcrText("••••••••••••")).toBe(false);
  });
});
