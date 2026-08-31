# Echo Design System v1.0

## Product

Name: Echo

Tagline: Your AI memory companion

## Core Concept

Echo is not a screenshot organizer.

Echo is an AI companion that remembers why users cared about something and helps them rediscover it later.

Primary emotional response:

"I forgot I saved this. I'm glad Echo remembered."

## Design Philosophy

70% Premium Intelligence
30% Living Companion

Reference:

- Apple Intelligence
- Pinterest
- Arc Browser
- Linear
- Pixar subtle emotion

Avoid:

- Generic AI chatbot UI
- Blue gradient AI style
- Productivity dashboard feeling
- File manager feeling
- Cartoon mascot feeling

## Brand Asset

### Echo Orb

Role:
A visual representation of AI memory.

Not a robot or pet character.

Visual:

- Rounded sphere
- Glass material
- Floating
- Internal aurora light
- Soft reflection

Emotion:
Expressed through brightness, particles, and orbit movement.

## Character States

### Listening

Screenshot captured.
A screenshot fragment approaches Echo Orb and creates a light pulse.

### Thinking

AI analyzes screenshots. Fragments orbit around Echo Orb.

### Discovery

AI finds relationships. Fragments merge into a constellation.

### Morning

Daily Brief reveal with warm sunrise lighting.

## Design Tokens

Colors:

- Echo Indigo: AI, Memory, Trust
- Aurora Violet: Discovery, Insight
- Mint Light: Positive actions
- Warm White: Background

Radius:

- Card: 24px
- Button: 16px
- Badge: 999px

Shadow:
Soft floating shadow only.

## Component System

### MemoryCard

Purpose:
Convert screenshot into meaningful memory.

Structure:

- ScreenshotImage
- CategoryBadge
- Title
- AISummary
- AIReasonChip
- URLButton
- Actions

Actions:

- Keep
- Delete

### AIReasonChip

Never show only a category.

Good examples:

- Recent running interest increased
- Saved 5 similar products
- Matches your travel plans

## Screens

### Inbox

First screen for captured memories.

### DailyBrief

Morning rediscovery experience.

### InterestMap

Weekly reflection of interests.

## Cleanup Mode

Tinder-style review.

Swipe right:
Keep

Swipe left:
Delete

AI can recommend:
"Keep recommended"
with reasoning.

## Category Illustration

Style:

- Soft 3D object
- Glass
- Rounded
- Floating
- Minimal

Categories:

- Shopping: Glass shopping bag
- Work: Floating design layers
- Travel: Glass compass
- Social: Glass message bubble
- Learning: Glass book with light

## Motion Rules

Capture:
Screenshot -> Card -> Echo Orb -> Light pulse

Grouping:
Cards orbit -> Connect -> Cluster

Morning Reveal:
Echo appears -> Memories unfold

## App Icon

Echo Ring

Concept:
Interest returns.

Structure:

- Center Echo Orb
- Circular echo wave

## Development Rules

Components:

- EchoOrb
- MemoryCard
- DailyBriefCard
- InterestChip
- CategoryBadge
- AIReasonChip
- CleanupCard
- InterestMap

## Product Decision Rules

Every feature should help users:

1. Remember what they cared about
2. Understand why they saved it
3. Rediscover forgotten interests

## Final Product Feeling

"Apple Photos Memories, but for everything I care about."

"Pinterest, but personalized by AI."

"A small intelligent companion that remembers my curiosity."

---

## Production Brand Layer v1.1

이 섹션은 제공된 로고를 실제 Echo/Catch 제품에 적용하기 위한 운영 규칙이다. 위 v1.0의 감정 방향은 유지하지만 루트 `AGENTS.md`, 개인정보·접근성·Finite Recall Feed 규칙이 우선한다.

### Brand idea

> Full-color Orb는 브랜드의 보석이고, Cobalt Thread와 Signal Lime은 제품의 언어다.

로고의 핵심 의미는 세 가지다.

1. `Returning Orbit` — 끊긴 고리가 중심으로 돌아오며 잊은 장면의 재발견을 표현한다.
2. `Memory Core` — 중앙 Orb는 캐릭터가 아니라 사용자가 남긴 기억의 압축된 핵이다.
3. `Quiet Asymmetry` — 완전한 원 대신 열린 간격으로 유한함과 다시 이어짐을 표현한다.

Orb는 사용자를 지켜보거나 대화하는 AI가 아니다. 제품 화면에서의 지능은 요약, 연결 단서, 그룹화, 쉬운 수정으로 드러난다.

### Brand asset palette

아래 값은 제공된 raster reference에서 추출한 근사값이며 `design/design-tokens.json`의 `color.brandAsset`이 canonical source다.

| Token | Value | Use |
|---|---:|---|
| `brandAsset.orbitNight` | `#16033A` | icon/store의 dark field |
| `brandAsset.pearlLilac` | `#DDCEE3` | light brand field |
| `brandAsset.orbViolet` | `#936CD2` | Orb midtone |
| `brandAsset.orbAqua` | `#64CDDE` | orbit/highlight |
| `brandAsset.orbSky` | `#A7DCED` | pearl highlight |
| `brandAsset.orbPeach` | `#EAD0B6` | 제한적인 reflected light |

이 원색은 CTA, 본문, intent, 성공·오류·민감 상태, 요약, Why Now에 직접 사용하지 않는다. 기능 UI는 계속 `primary #2447E8`, `signal #CDEB59`, intent semantic colors를 사용한다. 다만 원색을 warm white와 혼합한 `color.echoSurface.*`는 페이지 분위기, 카드 프레임, 반사 레일과 선택된 내비게이션의 비기능적 표면에 사용할 수 있다.

### Logo variants

| Variant | Recommended size | Use |
|---|---:|---|
| Full-color Orb raster | 80pt+ | app icon, splash, onboarding, completion, marketing |
| Flat returning-orbit SVG | 40–64pt | About, empty/complete, optional Today header |
| Monochrome returning-orbit SVG | 16–32pt | high contrast, small navigation mark, themed source |

Clear space is at least 14% of the icon canvas on every side. Do not bake an OS corner mask, outer presentation shadow, micro text, or a tile-inside-tile frame into production icons.

### Orb placement

허용:

- App icon and splash
- onboarding의 단일 hero
- empty 또는 complete에서 화면당 최대 한 개
- About/brand presentation
- App Store and marketing artwork

금지:

- 모든 RecallPost/MemoryCard 반복
- chatbot, avatar, floating action, loading spinner
- screenshot 위 overlay
- Keep/Delete/추천/민감 상태 icon
- 실제 screenshot fragment나 민감 이미지의 reflection
- 색·glow·pulse만으로 기능 상태 전달

### Surface and material

- Full-color glass is restricted to brand assets.
- Functional content surfaces use a near-white canvas, white cards, and warm-grey separators. `echoSurface` aliases this neutral hierarchy; raw aqua/violet/peach does not become a functional fill.
- Recall cards and generated mock previews do not use reflection rails or clipped orbits. Real screenshots are never tinted or overlaid.
- Intent icons keep five distinct meanings through ordinary symbols. Labels remain mandatory; selection is never color-only.
- `radius.feature = 24` is reserved for one hero or end surface, not every card.
- Navigation may use system material with opaque accessibility fallback.
- A privacy blur is never treated as protection; sensitive image sources remain unmounted.

### Motion

- Entry fade: 180ms
- One-time discovery alignment: 180–220ms
- Completion settle: maximum 220ms
- Reduce Motion: static mark or 120–180ms crossfade

Continuous orbit, floating, breathing pulse, particle field, parallax, 600–900ms capture ceremony, and 1–2s morning reveal are prohibited.

### Accessibility

- Decorative marks are excluded from the accessibility tree.
- A state-changing mark is accompanied by text and optional live-region announcement.
- The mark is not an interactive control below 44×44pt.
- Increase Contrast uses the flat/mono mark.
- Reduce Transparency uses an opaque pearl surface.
- Dynamic Type 200% may reduce or hide the decorative mark to protect text layout.
- Brand violet is not a text background; white on `orbViolet` is below normal-text AA.

### Asset source

Production candidates and prompt provenance are documented in [`assets/brand/echo/asset-manifest.md`](../../assets/brand/echo/asset-manifest.md).

### Echo functional surface v1.3

The logo remains a brand asset instead of becoming functional chrome:

1. `Neutral canvas` — near-white page field with no ambient color wash.
2. `Quiet surface` — white cards and warm-grey separators.
3. `Cobalt action` — primary CTA, focus, and links only.
4. `Echo jewel` — onboarding, completion, splash, store, and marketing only.

Functional screens and list items do not import `brandAsset.*` or repeat orbit, reflection-rail, or multicolor fragments. `color.echoSurface.*` aliases neutral surfaces for backward compatibility. Signal lime is not a recommendation badge; danger, success, and sensitive states keep their own semantic colors.
