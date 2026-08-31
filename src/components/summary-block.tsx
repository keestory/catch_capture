import { StyleSheet, Text, View } from "react-native";

import type { SummaryPresentation } from "@/domain/summary-presentation";
import { ko } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

interface SummaryBlockProps {
  presentation: SummaryPresentation;
  variant: "group" | "item";
}

export function SummaryBlock({ presentation, variant }: SummaryBlockProps) {
  const methodLabel =
    presentation.basis === "ocr_text"
      ? ko.summary.textBasis
      : presentation.basis === "visual_embedding"
        ? ko.summary.visualBasis
        : undefined;
  const evidenceSignals = presentation.signals?.slice(0, 3) ?? [];
  const summaryForAccessibility = presentation.summary.replace(/[.!?。]+$/, "");
  const accessibilityDetails = [
    methodLabel,
    presentation.explanation?.replace(/[.!?。]+$/, ""),
    evidenceSignals.length
      ? `${ko.summary.evidenceLabel} ${evidenceSignals.length}개. ${evidenceSignals.join(". ")}`
      : undefined,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <View
      accessibilityLabel={`${variant === "group" ? ko.summary.groupLabel : ko.summary.itemLabel}. ${summaryForAccessibility}${accessibilityDetails ? `. ${accessibilityDetails}` : ""}`}
      accessible
      style={[styles.container, variant === "item" && styles.itemContainer]}
    >
      <View style={styles.labelRow}>
        {presentation.protected ? <Text style={styles.lockMark}>▣</Text> : null}
        <Text style={[styles.label, presentation.protected && styles.protectedLabel]}>
          {presentation.protected
            ? ko.summary.protectedLabel
            : variant === "group"
              ? ko.summary.groupLabel
              : ko.summary.itemLabel}
        </Text>
      </View>
      <Text style={[styles.summary, presentation.protected && styles.protectedSummary]}>
        {presentation.summary}
      </Text>

      {methodLabel && !presentation.protected ? (
        <View style={styles.methodBlock}>
          <Text style={styles.methodLabel}>{methodLabel}</Text>
          {presentation.explanation ? (
            <Text style={styles.methodExplanation}>{presentation.explanation}</Text>
          ) : null}
          {evidenceSignals.length ? (
            <View style={styles.signalRow}>
              <Text style={styles.signalLabel}>{ko.summary.evidenceLabel}</Text>
              <Text style={styles.signalText}>{evidenceSignals.join(" · ")}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {presentation.commonality ? (
        <View style={styles.evidenceRow}>
          <View style={styles.detailCopy}>
            <Text style={styles.detailLabel}>{ko.summary.commonalityLabel}</Text>
            <Text style={styles.detailText}>{presentation.commonality}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.space[2] },
  itemContainer: {
    marginTop: tokens.space[1],
    paddingTop: tokens.space[3],
    borderTopWidth: 1,
    borderTopColor: tokens.color.line,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: tokens.space[1] },
  lockMark: { color: tokens.color.inkSecondary, fontSize: 11 },
  label: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    fontWeight: "800",
  },
  protectedLabel: { color: tokens.color.inkSecondary },
  summary: {
    color: tokens.color.ink,
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
    fontWeight: "600",
  },
  protectedSummary: { color: tokens.color.inkSecondary },
  methodBlock: {
    gap: 3,
    paddingTop: tokens.space[1],
  },
  methodLabel: {
    color: tokens.color.inkTertiary,
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    fontWeight: "800",
  },
  methodExplanation: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
  signalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: tokens.space[2],
    paddingTop: 2,
  },
  signalLabel: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    fontWeight: "800",
  },
  signalText: {
    flexShrink: 1,
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
  },
  evidenceRow: {
    paddingTop: tokens.space[3],
    borderTopWidth: 1,
    borderTopColor: tokens.color.line,
  },
  detailCopy: { flex: 1, gap: 2 },
  detailLabel: {
    color: tokens.color.inkTertiary,
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    fontWeight: "800",
  },
  detailText: {
    color: tokens.color.inkSecondary,
    fontSize: tokens.typography.metadata.fontSize,
    lineHeight: tokens.typography.metadata.lineHeight,
  },
});
