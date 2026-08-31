import {
  type ImageEmbedding,
  type ImageVectorizer,
  SummaryPipeline,
  type TextSummaryModel,
  type VisualSummaryModel,
} from "./summary-pipeline";

const EMBEDDING_DIMENSIONS = 12;

function shortSegments(text: string): string[] {
  return text
    .split(/(?:\n|[·|•])/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((segment) => segment.slice(0, 48));
}

export class MockTextSummaryModel implements TextSummaryModel {
  readonly modelVersion = "mock-text-summary-v1";

  async summarize(text: string): Promise<{ summary: string; signals: string[] }> {
    const signals = shortSegments(text.replace(/\s+/g, " "));
    return {
      summary: signals.slice(0, 2).join(" · ").slice(0, 90),
      signals,
    };
  }
}

export class MockImageVectorizer implements ImageVectorizer {
  async embed(imageUri: string): Promise<ImageEmbedding> {
    if (!imageUri.trim()) throw new Error("이미지를 확인할 수 없어요.");

    const buckets = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
    for (const [index, character] of Array.from(imageUri).entries()) {
      buckets[index % EMBEDDING_DIMENSIONS] += character.codePointAt(0) ?? 0;
    }
    const magnitude = Math.sqrt(buckets.reduce((sum, value) => sum + value * value, 0)) || 1;
    return {
      vector: buckets.map((value) => Number((value / magnitude).toFixed(6))),
      modelVersion: "mock-image-embedding-v1",
    };
  }
}

interface VisualRule {
  test: RegExp;
  summary: string;
  signals: string[];
}

const visualRules: VisualRule[] = [
  {
    test: /(youtube|video|frame|performance)/,
    summary: "영상에서 저장한 한 장면으로 보여요.",
    signals: ["영상 화면 구성", "재생 장면"],
  },
  {
    test: /(shoe|bag|product|shopping|style)/,
    summary: "상품 이미지와 구매 정보가 함께 보이는 화면이에요.",
    signals: ["상품 이미지", "구매 정보 영역"],
  },
  {
    test: /(interior|room|travel|landscape)/,
    summary: "다시 보고 싶은 공간이나 풍경을 담은 장면이에요.",
    signals: ["공간 또는 풍경", "이미지 중심 구성"],
  },
  {
    test: /(ui|landing|reference)/,
    summary: "화면 구성과 인터페이스를 참고하려고 저장한 장면으로 보여요.",
    signals: ["인터페이스 구성", "화면 배치"],
  },
];

export class MockVisualSummaryModel implements VisualSummaryModel {
  readonly modelVersion = "mock-visual-summary-v1";

  async summarize({ imageUri }: { imageUri: string; embedding: ImageEmbedding }) {
    const match = visualRules.find((rule) => rule.test.test(imageUri.toLowerCase()));
    return (
      match ?? {
        summary: "화면의 주요 장면과 구성을 정리했어요.",
        signals: ["주요 이미지", "화면 구성"],
      }
    );
  }
}

export function createMockSummaryPipeline(): SummaryPipeline {
  return new SummaryPipeline(
    new MockTextSummaryModel(),
    new MockImageVectorizer(),
    new MockVisualSummaryModel(),
  );
}
