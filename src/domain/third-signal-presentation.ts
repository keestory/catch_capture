import type { ThirdSignalSuggestion } from "@/contracts/domain";
import { interpolate, ko } from "@/localization/ko";

export interface ThirdSignalPresentation {
  label: string;
  title: string;
  reason: string;
  actionLabel: string;
  dismissLabel: string;
}

export function presentThirdSignal(suggestion: ThirdSignalSuggestion): ThirdSignalPresentation {
  const subject = suggestion.subject || "관련 캡처";
  const shared = {
    label: ko.thirdSignal.label,
    dismissLabel: ko.thirdSignal.dismiss,
  };

  if (suggestion.artifactType === "product_decision") {
    return {
      ...shared,
      title: interpolate(ko.thirdSignal.productTitle, { subject }),
      reason: ko.thirdSignal.productReason,
      actionLabel: ko.thirdSignal.productAction,
    };
  }
  if (suggestion.artifactType === "reference_board") {
    return {
      ...shared,
      title: interpolate(ko.thirdSignal.referenceTitle, { subject }),
      reason: ko.thirdSignal.referenceReason,
      actionLabel: ko.thirdSignal.referenceAction,
    };
  }
  if (suggestion.artifactType === "article_brief") {
    return {
      ...shared,
      title: interpolate(ko.thirdSignal.articleTitle, { subject }),
      reason: ko.thirdSignal.articleReason,
      actionLabel: ko.thirdSignal.articleAction,
    };
  }
  return {
    ...shared,
    title: interpolate(ko.thirdSignal.shareTitle, { subject }),
    reason: ko.thirdSignal.shareReason,
    actionLabel: ko.thirdSignal.shareAction,
  };
}
