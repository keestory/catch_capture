# Echo Brand Asset Manifest

상태: Brand system v1.1 · 2026-08-21

## Asset inventory

| File                           |      Canvas | Alpha | Use                                         | Release status                           |
| ------------------------------ | ----------: | ----- | ------------------------------------------- | ---------------------------------------- |
| `source-reference.png`         |    1000×750 | no    | 사용자가 제공한 방향성 원본                 | reference only                           |
| `icon-master.png`              |   1024×1024 | no    | iOS/legacy icon production master           | candidate; small-size/device QA required |
| `splash-mark.png`              |   1024×1024 | no    | `#F5F2EA` 배경의 정적 splash artwork        | candidate; native preview QA required    |
| `onboarding-memory-return.png` |   1024×1536 | no    | 온보딩 hero, `capture → group → rediscover` | ready for product mockup                 |
| `store-hero.png`               |   1536×1024 | no    | App Store/landing brand hero                | ready for copy composition               |
| `echo-mark-flat.svg`           | 256 viewBox | yes   | 40–64pt 인앱 정적 mark                      | ready; visual QA required                |
| `echo-mark-mono.svg`           | 256 viewBox | yes   | 16–32pt, 고대비, 단색 환경                  | ready; themed-icon source candidate      |

## Excluded output

두 차례 생성한 transparent raster Orb는 실제 alpha channel 대신 checkerboard pixels를 포함해 제외했다. 이 실패본은 프로젝트에 복사하지 않았다. Android adaptive foreground와 transparent in-app raster는 검증된 alpha export가 준비되기 전까지 `app.json`에 연결하지 않는다.

## Geometry and safe area

- Production icon은 OS가 mask를 적용하므로 baked rounded corners를 사용하지 않는다.
- Orb와 orbit의 optical bounds는 square canvas의 72% 이내를 목표로 한다.
- 핵심 highlight와 core는 중앙 68% 안에 둔다.
- Android adaptive export는 108dp canvas의 중앙 66dp safe zone을 별도 검증한다.
- 24pt에서는 `echo-mark-mono.svg`, 40–64pt에서는 `echo-mark-flat.svg`, 80pt 이상에서는 full-color raster를 사용한다.

## Usage boundary

Full-color assets are allowed in app icon, splash, onboarding, completion, store, and marketing contexts. They are not functional UI colors and must not replace `primary`, `signal`, intent, danger, success, or sensitive-state tokens.

Do not place the Orb:

- on every MemoryCard/RecallPost
- above screenshots as an overlay
- as a chatbot/avatar or floating CTA
- as a loading spinner or AI confidence indicator
- inside destructive, sensitive, or sharing controls

## Runtime integration boundary

- This asset pass does not rename the runtime app, slug, scheme, bundle ID, or package ID.
- `icon-master.png` and `splash-mark.png` require a native rebuild when connected.
- The existing Expo adaptive icon remains until a transparent 1024×1024 foreground and matching monochrome PNG pass alpha/safe-zone QA.
- The separate Swift/Xcode target requires an independent AppIcon/LaunchScreen update if it remains a shipping target.

## Generation provenance

Selected raster assets were produced with the built-in Image Generation tool from the user-provided `source-reference.png`. Generated source copies remain in Codex's generated-image directory; selected project assets live here.

### `icon-master.png`

```text
Use case: logo-brand
Asset type: production mobile app icon master
Input: user's approved logo reference
Request: preserve the luminous striped Echo Orb and broken orbital ring with the same calm premium 3D glass feeling and cyan–lilac–violet palette; centered strong small-size silhouette; edge-to-edge deep eggplant/lavender field.
Constraints: no text, captions, watermark, mockup, baked rounded-corner mask, transparency, or extra objects.
```

### `onboarding-memory-return.png`

```text
Use case: stylized-concept
Asset type: Echo mobile onboarding hero
Input: approved Echo mark
Request: one calm Echo mark above three abstract screenshot-paper tiles aligning into a finite group on warm #F5F2EA paper canvas.
Constraints: portrait-friendly, no readable UI/text/private content, faces, chatbot, extra particles, or watermark.
```

### `store-hero.png`

```text
Use case: stylized-concept
Asset type: Echo brand/store hero
Input: approved Echo mark
Request: wide premium deep-eggplant scene with three subtle capture planes tracing one finite return path toward the ring; negative space for later store copy.
Constraints: no in-image text, faces, chatbot, stars, magic wand, dashboard, infinite trail, real screenshot content, or watermark.
```

### `splash-mark.png`

```text
Use case: logo-brand
Asset type: static mobile splash artwork
Input: approved Echo mark
Request: simplified striped memory core and broken returning ring, centered at about 38% on uniform #F5F2EA.
Constraints: no text, wordmark, watermark, tile, shadow, cards, particles, background gradient, or extra objects.
```
