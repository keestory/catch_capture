import type { ScreenshotGroup, ScreenshotItem, SummaryBasis } from "@/contracts/domain";
import { ko } from "@/localization/ko";

export interface SummaryPresentation {
  summary: string;
  commonality?: string;
  basis?: SummaryBasis;
  signals?: string[];
  explanation?: string;
  protected: boolean;
}

export function presentItemSummary(item: ScreenshotItem): SummaryPresentation | undefined {
  if (item.isSensitive) {
    return { summary: ko.summary.protectedBody, protected: true };
  }
  if (!item.analysis?.summary) return undefined;
  return {
    summary: item.analysis.summary,
    basis: item.analysis.summaryEvidence?.basis,
    signals: item.analysis.summaryEvidence?.signals,
    explanation: item.analysis.summaryEvidence?.explanation,
    protected: false,
  };
}

export function presentGroupSummary(
  group: ScreenshotGroup,
  items: ScreenshotItem[],
): SummaryPresentation | undefined {
  if (items.some((item) => item.isSensitive)) {
    return { summary: ko.summary.protectedBody, protected: true };
  }
  if (!group.summary) return undefined;
  return {
    summary: group.summary,
    commonality: group.reason,
    protected: false,
  };
}
