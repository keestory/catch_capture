import type { ScreenshotItem } from "@/contracts/domain";

export type ReviewImportMode = "automatic" | "manual" | "demo";

export const currentReviewDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const resolveItemReviewDate = (
  item: ScreenshotItem,
  importMode?: ReviewImportMode,
): string => (importMode === "manual" ? item.importedAt : item.capturedAt).slice(0, 10);

export const resolveReviewDate = (
  items: ScreenshotItem[],
  importMode?: ReviewImportMode,
): string => {
  if (importMode !== "demo" && importMode !== "manual") return currentReviewDate();
  return (
    items
      .filter((item) => item.status === "ready_for_review" && Boolean(item.analysis))
      .map((item) => resolveItemReviewDate(item, importMode))
      .sort()
      .at(-1) ?? currentReviewDate()
  );
};
