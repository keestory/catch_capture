import { describe, expect, it } from "vitest";

import type { Intent } from "@/contracts/domain";
import {
  INTENT_ICON_PATHS,
  INTENT_ICON_STROKE_WIDTH,
  INTENT_ICON_VIEW_BOX,
} from "@/domain/intent-icon-geometry";

const intents: Intent[] = ["reference", "want", "share", "read", "keep"];

const socialActionMetaphors: Record<Intent, string> = {
  reference: "paperclip",
  want: "shopping-bag",
  share: "send",
  read: "file-text",
  keep: "star",
};

describe("intent icon geometry", () => {
  it("maps every canonical intent to sparse local vector paths", () => {
    expect(Object.keys(INTENT_ICON_PATHS).sort()).toEqual([...intents].sort());
    intents.forEach((intent) => {
      expect(INTENT_ICON_PATHS[intent].length).toBeGreaterThan(0);
      expect(INTENT_ICON_PATHS[intent].length).toBeLessThanOrEqual(3);
      expect(
        INTENT_ICON_PATHS[intent].every((path) => path.startsWith("M") && path.length > 6),
      ).toBe(true);
    });
  });

  it("uses one platform-stable 20pt, 2px line system", () => {
    expect(INTENT_ICON_VIEW_BOX).toBe("0 0 20 20");
    expect(INTENT_ICON_STROKE_WIDTH).toBe(2);
  });

  it("keeps the approved social-action metaphor contract explicit", () => {
    expect(socialActionMetaphors).toEqual({
      reference: "paperclip",
      want: "shopping-bag",
      share: "send",
      read: "file-text",
      keep: "star",
    });
  });
});
