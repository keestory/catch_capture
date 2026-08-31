# Echo Library Asset Family v1.0

## Purpose

Echo Memory Assets are quiet, code-native placeholders for demo or mock captures. They help a user recognize **what kind of thing was captured** when a real screenshot is unavailable.

They do not classify why the user saved something. Intent remains owned by `IntentChip`, its label, and its semantic palette.

```text
Echo Memory Asset geometry = content type
Intent icon + label + color = why it was saved
Title + source = the actual memory
```

## Shared grammar

Every asset is composed from the same system:

- an aqua Returning Orbit;
- a lilac secondary orbit;
- one content-specific neutral structure;
- small aqua/lilac/peach reflections;
- flat 1.35–1.6pt strokes, no glass, blur, shadow, gradient, or animation.

The family uses `echoSurface.*` and neutral structure colors only. It does not receive an intent, title, source, OCR text, keyword, price, address, person, or other user data.

## Asset taxonomy

| Content type | Asset name | Structural idea |
|---|---|---|
| `product` | Orbit Capsule | one object and its option capsule |
| `ui_reference` | Frame Stack | offset screens and a connected control |
| `video_frame` | Play Pulse | framed moment and a finite progress line |
| `place` | Place Compass | an abstract compass and remembered route |
| `social_post` | Reply Pair | two offset post/reply panels |
| `article` | Reading Leaves | stacked pages and headline/body rhythm |
| `document` | Note Grid | a structured page and table cells |
| `event` | Date Gate | a bounded calendar/ticket field |
| `conversation` | Thread Core | three connected message rows |
| `other` | Neutral Frame | three non-semantic memory fragments |

Visible labels are Korean and typed through `Record<ContentType, string>` so a new domain type cannot silently miss its asset or label.

## Runtime boundaries

`ScreenshotVisual` keeps this priority:

1. Sensitive capture → protected neutral placeholder; no asset is mounted.
2. Real media URI → original screenshot with `contain`; no asset or tint is mounted.
3. `mock://` or `mock-thumb://` → Echo Memory Asset.

The component is decorative and has no pointer or accessibility presence. The parent screenshot card owns the readable label.

## Density and performance

- Compact asset: 60pt for the two-column Library grid and group stacks.
- Regular asset: 78pt for review, detail, and search-result mock visuals.
- Maximum descendant budget: 12 Views including the shared orbit and reflections.
- No runtime asset decode, SVG, canvas, measurement, timer, or animation.
- `React.memo` keeps repeated list cells stable.

## Prohibited use

- Do not render an asset over, behind, or as a fallback for a real screenshot.
- Do not reveal a sensitive item's content type through an asset.
- Do not assign a category color such as product=orange or article=green.
- Do not use Signal Lime; it is reserved for an actual recommendation or connection.
- Do not insert app logos, readable UI, faces, price, address, message text, followers, urgency, or counts.
- Do not treat the asset as an AI confidence, loading, or status indicator.
