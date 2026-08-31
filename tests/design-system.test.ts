import { describe, expect, it } from "vitest";

import rawTokens from "../design/design-tokens.json";
import { tokens } from "../src/theme/tokens";

const relativeLuminance = (hex: string): number => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4),
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrast = (foreground: string, background: string): number => {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
};

describe("Warm Editorial Utility design system", () => {
  it("keeps typed semantic tokens synchronized with the source tokens", () => {
    expect(tokens.color.canvas).toBe(rawTokens.color.canvas.value);
    expect(tokens.color.signal).toBe(rawTokens.color.signal.value);
    expect(tokens.color.brandAsset.orbitNight).toBe(rawTokens.color.brandAsset.orbitNight.value);
    expect(tokens.color.echoSurface.ambientAqua).toBe(
      rawTokens.color.echoSurface.ambientAqua.value,
    );
    expect(tokens.color.echoSurface.recallBorder).toBe(
      rawTokens.color.echoSurface.recallBorder.value,
    );
    expect(tokens.radius.tray).toBe(rawTokens.radius.tray.value);
    expect(tokens.radius.feature).toBe(rawTokens.radius.feature.value);
    expect(tokens.layout.maxContentWidth).toBe(rawTokens.layout.maxContentWidth.value);
    expect(tokens.layout.maxWorkspaceWidth).toBe(rawTokens.layout.maxWorkspaceWidth.value);
  });

  it("keeps normal text and placeholder colors at WCAG AA contrast", () => {
    expect(contrast(tokens.color.ink, tokens.color.canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.color.inkSecondary, tokens.color.canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.color.inkTertiary, tokens.color.canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.color.signalInk, tokens.color.signal)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.color.ink, tokens.color.brandAsset.pearlLilac)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrast("#FFFFFF", tokens.color.brandAsset.orbitNight)).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#FFFFFF", tokens.color.primary)).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(tokens.color.inkSecondary, tokens.color.echoSurface.navigationSurface),
    ).toBeGreaterThanOrEqual(4.5);
    Object.values(tokens.color.intent).forEach((palette) => {
      expect(contrast(palette.text, palette.background)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("preserves accessible controls and a mobile-first reading width", () => {
    expect(tokens.size.touchTarget).toBeGreaterThanOrEqual(44);
    expect(tokens.layout.maxContentWidth).toBeLessThanOrEqual(480);
    expect(tokens.layout.maxWorkspaceWidth).toBeGreaterThan(tokens.layout.maxContentWidth);
    expect(tokens.motion.default).toBeLessThanOrEqual(220);
  });

  it("keeps functional Echo surface aliases neutral", () => {
    expect(tokens.color.echoSurface.recallSurface).toBe(tokens.color.surface);
    expect(tokens.color.echoSurface.recallBorder).toBe(tokens.color.line);
    expect(tokens.color.echoSurface.navigationSurface).toBe(tokens.color.surface);
    expect(tokens.color.echoSurface.navigationSelected).toBe("#F0F0ED");
  });
});
