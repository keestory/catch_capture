import type { Intent } from "@/contracts/domain";

export const INTENT_ICON_VIEW_BOX = "0 0 20 20";
export const INTENT_ICON_STROKE_WIDTH = 2;

/**
 * Local, platform-stable line geometry for the five canonical intents.
 * The social-action direction uses familiar paperclip, shopping bag, send,
 * document, and star metaphors. Paths stay sparse at 14–18pt and avoid a
 * shared decorative container so each intent keeps a distinct silhouette.
 */
export const INTENT_ICON_PATHS: Record<Intent, readonly string[]> = {
  reference: ["M7.2 10.8l5.7-5.7a3 3 0 0 1 4.2 4.2l-7.4 7.4a5 5 0 0 1-7.1-7.1L10 2.2"],
  want: ["M4 6h12l1 11H3z", "M7 7V5a3 3 0 0 1 6 0v2"],
  share: ["M3 3l14 7-14 7 3-7z", "M6 10h11"],
  read: ["M5 2.5h6l4 4v11H5z", "M11 2.5v4h4", "M7.5 10h5M7.5 13h5"],
  keep: ["M10 2.7l2.2 4.5 5 .7-3.6 3.5.8 5-4.4-2.4-4.4 2.4.8-5-3.6-3.5 5-.7z"],
};
