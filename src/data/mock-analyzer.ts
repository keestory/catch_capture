import type {
  AnalyzeScreenshotInput,
  ContentType,
  Intent,
  ScreenshotAnalysis,
  ScreenshotAnalyzer,
} from "@/contracts/domain";
import { createMockSummaryPipeline } from "@/analysis/mock-summary-models";
import type { SummaryPipeline } from "@/analysis/summary-pipeline";

interface Rule {
  test: (searchable: string) => boolean;
  intent: Intent;
  contentType: ContentType;
  title: string;
  keywords: string[];
}

const rules: Rule[] = [
  {
    test: (value) => /(shoe|bag|product|shopping|musinsa|kream)/.test(value),
    intent: "want",
    contentType: "product",
    title: "사고 싶은 상품 후보",
    keywords: ["상품", "구매 후보"],
  },
  {
    test: (value) => /(article|news|report|hankyung)/.test(value),
    intent: "read",
    contentType: "article",
    title: "나중에 읽을 자료",
    keywords: ["기사", "읽기"],
  },
  {
    test: (value) => /(meme|quote|threads|youtube)/.test(value),
    intent: "share",
    contentType: "social_post",
    title: "공유할 소셜 콘텐츠",
    keywords: ["소셜", "공유"],
  },
  {
    test: (value) => /(ui|landing|pricing|work)/.test(value),
    intent: "reference",
    contentType: "ui_reference",
    title: "업무 참고 자료",
    keywords: ["업무", "레퍼런스"],
  },
];

export class MockScreenshotAnalyzer implements ScreenshotAnalyzer {
  constructor(private readonly summaryPipeline: SummaryPipeline = createMockSummaryPipeline()) {}

  async analyze(input: AnalyzeScreenshotInput): Promise<ScreenshotAnalysis> {
    if (input.imageUri.includes("analysis-failure")) {
      throw new Error("이미지에서 읽을 수 있는 정보를 찾지 못했어요.");
    }

    const searchable = [input.imageUri, input.source?.appName, input.source?.domain]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("ko-KR");
    const match = rules.find((rule) => rule.test(searchable));
    const fallback: Omit<Rule, "test"> = {
      intent: "reference",
      contentType: "other",
      title: "확인이 필요한 새 캡처",
      keywords: ["확인 필요"],
    };
    const result = match ?? fallback;
    const generatedSummary = await this.summaryPipeline.summarize({
      imageUri: input.imageUri,
      ocrText: input.ocrText,
    });

    return {
      title: result.title,
      summary: generatedSummary.summary,
      summaryEvidence: generatedSummary.evidence,
      ocrText: input.ocrText,
      suggestedIntent: result.intent,
      intentConfidence: match ? 0.82 : 0.35,
      needsReview: !match,
      contentType: result.contentType,
      contentTypeConfidence: match ? 0.86 : 0.4,
      keywords: result.keywords,
      sensitive: false,
      sensitiveRegions: [],
      analyzerVersion: "mock-v1",
      analyzedAt: new Date().toISOString(),
    };
  }
}
