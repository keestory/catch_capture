import type { SummaryBasis, SummaryEvidence } from "@/contracts/domain";

const MAX_EVIDENCE_SIGNALS = 3;
const MAX_SIGNAL_LENGTH = 48;

export interface TextSummaryModel {
  modelVersion: string;
  summarize(text: string): Promise<{ summary: string; signals: string[] }>;
}

export interface ImageEmbedding {
  vector: number[];
  modelVersion: string;
}

export interface ImageVectorizer {
  embed(imageUri: string): Promise<ImageEmbedding>;
}

export interface VisualSummaryModel {
  modelVersion: string;
  summarize(input: {
    imageUri: string;
    embedding: ImageEmbedding;
  }): Promise<{ summary: string; signals: string[] }>;
}

export interface SummaryPipelineInput {
  imageUri: string;
  ocrText?: string;
}

export interface SummaryPipelineResult {
  summary: string;
  evidence: SummaryEvidence;
  embedding?: ImageEmbedding;
  fallbackUsed: boolean;
}

export function normalizeOcrText(value?: string): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function hasMeaningfulOcrText(value?: string): boolean {
  const normalized = normalizeOcrText(value);
  const visibleCharacters = normalized.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
  const tokens = normalized.split(/\s+/).filter(Boolean).length;
  return visibleCharacters >= 8 && tokens >= 2;
}

function sanitizeSignals(signals: string[]): string[] {
  return signals
    .map((signal) => normalizeOcrText(signal).slice(0, MAX_SIGNAL_LENGTH))
    .filter(Boolean)
    .filter((signal, index, values) => values.indexOf(signal) === index)
    .slice(0, MAX_EVIDENCE_SIGNALS);
}

function makeEvidence(
  basis: SummaryBasis,
  signals: string[],
  modelVersion: string,
  fallbackUsed: boolean,
): SummaryEvidence {
  return {
    basis,
    signals: sanitizeSignals(signals),
    explanation:
      basis === "ocr_text"
        ? "화면에서 읽은 문장과 숫자를 바탕으로 정리했어요."
        : fallbackUsed
          ? "글자를 충분히 읽지 못해 화면의 모습과 비슷한 장면을 바탕으로 정리했어요."
          : "화면의 모습과 비슷한 장면을 바탕으로 정리했어요.",
    modelVersion,
  };
}

export class SummaryPipeline {
  constructor(
    private readonly textModel: TextSummaryModel,
    private readonly imageVectorizer: ImageVectorizer,
    private readonly visualModel: VisualSummaryModel,
  ) {}

  async summarize(input: SummaryPipelineInput): Promise<SummaryPipelineResult> {
    const normalizedText = normalizeOcrText(input.ocrText);
    let fallbackUsed = false;

    if (hasMeaningfulOcrText(normalizedText)) {
      try {
        const result = await this.textModel.summarize(normalizedText);
        return {
          summary: result.summary,
          evidence: makeEvidence("ocr_text", result.signals, this.textModel.modelVersion, false),
          fallbackUsed: false,
        };
      } catch {
        fallbackUsed = true;
      }
    }

    const embedding = await this.imageVectorizer.embed(input.imageUri);
    const result = await this.visualModel.summarize({ imageUri: input.imageUri, embedding });
    return {
      summary: result.summary,
      evidence: makeEvidence(
        "visual_embedding",
        result.signals,
        this.visualModel.modelVersion,
        fallbackUsed,
      ),
      embedding,
      fallbackUsed,
    };
  }
}
