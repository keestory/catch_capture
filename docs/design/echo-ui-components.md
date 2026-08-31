# Echo UI Components v1.0

## Framework Direction

Target: React Native

Design principle: Premium mobile experience with subtle intelligence.

## Components

## EchoOrb

Purpose: AI companion visual.

States:

- Listening
- Thinking
- Discovery
- Morning

## MemoryCard

Props:

- image
- category
- title
- summary
- reason
- url
- actions

Actions:

- Keep
- Delete
- Open

## DailyBriefCard

Purpose:

Morning discovery.

Contains:

- Greeting
- Interest groups
- Recommended actions

## CategoryBadge

Categories:

- Shopping
- Work
- Travel
- Social
- Learning

## AIReasonChip

Purpose:

Show why Echo understands the memory.

Examples:

"Saved similar items 5 times"

"Matches recent interests"

## CleanupCard

Interaction:

Swipe right: Keep

Swipe left: Delete

## InterestMap

Purpose:

Visualize changing interests.

Display:

- Topics
- Trends
- Growth patterns

## Animation

Use subtle motion.

Avoid:

- Game-like effects
- Excessive particles

Preferred:

- Floating
- Fade
- Orbit
- Glow

---

## Production component mapping v1.1

### EchoBrandAsset

Purpose: render an approved static brand asset without turning the Orb into an assistant.

Variants:

- `fullColor`: onboarding, splash composition, complete, marketing; 80pt+
- `flat`: empty/complete/About; 40–64pt
- `mono`: compact/high-contrast contexts; 16–32pt

Rules:

- Decorative by default and excluded from the accessibility tree.
- Maximum one full-color instance per screen.
- Never used as a spinner, chatbot entry, destructive action, sensitivity indicator, or screenshot overlay.
- Reduce Motion renders a static asset.
- Increase Contrast uses `flat` or `mono`.

### EchoMotif

Purpose: 로고 전체를 반복하지 않고 `Returning Orbit`, `Memory Core`, `reflection trace`의 일부 형태만 탭 화면에 번역한다.

Variants:

- `returning`: Today hero 한 곳. 코발트 열린 궤도와 실제 연결을 뜻하는 signal point를 사용한다.
- `core`: Library archive summary 한 곳. 48pt 이하의 줄무늬 core이며 선택·새 항목·알림 상태를 뜻하지 않는다.
- `trace`: Search intro 한 곳. aqua/lilac의 낮은 불투명도 열린 궤도이며 검색 입력이나 loading spinner가 아니다.

Rules:

- full `EchoMotif`는 온보딩·완료·브랜드 소개 화면에만 렌더한다. 기능 탭은 wordmark-only다.
- 장식 root는 `pointerEvents="none"`, `accessible={false}`, `aria-hidden`, `no-hide-descendants`를 함께 사용한다.
- full-color raster, SVG runtime dependency, blur, shadow, animation을 추가하지 않는다.
- `brandAsset.*` 원색은 이 컴포넌트 내부에 캡슐화한다. 제품 표면은 파생된 `echoSurface.*`만 사용하며 CTA, intent, match evidence, 성공·오류·민감 상태에는 전달하지 않는다.
- Dynamic Type 160% 이상 또는 폭 340pt 미만에서는 장식을 숨겨 텍스트와 조작 영역을 우선한다.
- screenshot card, RecallPost, 필터, 검색 결과, tab icon에는 motif나 surface fragment를 반복하지 않는다.

### EchoSurfaceAccent (brand-only legacy primitive)

Purpose: 브랜드 목업에서 full Orb를 복제하지 않고 Echo의 반사 구조를 전달한다.

- `rail`: aqua → lilac → peach 순서의 3px reflection rail. 마케팅 목업에만 사용한다.
- `orbit`: 세 개의 정적 primitive로 만든 clipped orbit corner. 브랜드 소개용 목업에만 사용한다.
- 실제 screenshot, 민감 이미지, 상태 overlay에는 사용하지 않는다.
- Today, Library, Search, Review, Detail과 반복 목록에서는 사용하지 않는다.

### IntentIcon

Purpose: 다섯 intent의 의미를 익숙한 단순 기호로 구분한다.

- 승인된 `Social action` 매핑은 `reference=paperclip`, `want=shopping bag`, `share=send`, `read=file text`, `keep=star`다.
- reference, want, share, read, keep는 서로 다른 내부 기호를 유지한다.
- 공통 orbit stroke를 강제하지 않는다. icon은 보조이며 parent chip/card의 텍스트 label과 accessibility label이 의미를 전달한다.
- 선택 상태는 primary border와 check marker를 함께 사용해 색에만 의존하지 않는다.

### Echo product surfaces

- `AppScreen`: near-white canvas. Atmosphere는 브랜드 화면에만 명시적으로 켠다.
- `ScreenshotCard`: 흰 면, 1px 중립 테두리. 실제 이미지는 변경하지 않는다.
- `GroupTray`: 흰 면, 1px 중립 테두리, 보호 우선 텍스트.
- `PrimaryNavigation`: 보관함 2×2 grid / 캡처 stack-check / 검색 magnifier의 세 아이콘만
  사용한다. visible label은 숨기되 각 탭의 한국어 접근성 이름과 44pt 이상 터치 영역을
  유지한다. Today는 가운데에 배치하고 focused 상태에서만 cobalt 원형 표면을 사용한다.
  full-color Orb, gradient, 알림 점, intent 색상은 하단 내비게이션에 사용하지 않는다.
- tab icon: 관습적인 목적지 형태를 유지하고 focused state에서 cobalt만 사용한다.

### EchoMemoryAsset

Status: legacy brand-derived placeholder. 기능 화면에서는 `MockScreenshotScene`으로 대체되었으며 새 호출을 추가하지 않는다.

Purpose: 브랜드 목업에서 실제 이미지가 없는 capture의 content type을 알아보게 하는 정적 2D placeholder.

- `product`, `ui_reference`, `video_frame`, `place`, `social_post`, `article`, `document`, `event`, `conversation`, `other`의 10개 typed variant를 제공한다.
- intent, title, OCR, source, keywords를 props로 받지 않는다. Geometry는 content type만, intent chip은 남긴 이유만 표현한다.
- 모든 variant는 Returning Orbit, neutral content structure, aqua/lilac/peach reflection의 공통 문법을 공유한다.
- Today, Library, Search, Review, Detail의 반복 카드와 실제 screenshot·민감 항목에는 mount하지 않는다.
- compact 60pt, regular 78pt이며 asset당 descendant는 최대 12개다.
- 전체 taxonomy와 runtime 경계는 [`echo-library-assets.md`](./echo-library-assets.md)를 따른다.

### MemoryCard mapping

Do not build a parallel Echo `MemoryCard`. Map it to the existing system:

```text
RecallPost / ScreenshotCard
├─ ScreenshotPager
├─ IntentChip
├─ SummaryBlock
├─ WhyNowStrip
├─ EvidenceDisclosure
└─ explicit screen-owned action
```

`AIReasonChip` becomes `ConnectionReason` or `EvidenceDisclosure`. Topic categories do not replace the five canonical intents. Today never displays Keep/Delete actions.

### Brand imagery placement

- `onboarding-memory-return.png`: value onboarding only; do not repeat after onboarding.
- `store-hero.png`: store/marketing composition only.
- `splash-mark.png`: native launch candidate; no artificial display delay.
- `icon-master.png`: launcher/store candidate; never rendered as a tiny in-app icon.

### OutcomeEvidence

Purpose: explain the result of curation without turning the screen into a marketing feature list.

Structure:

- short cobalt result label such as `자동 정리 · 8장 → 3묶음`
- one plain-language outcome sentence
- optional second evidence item for rediscovery

Rules:

- Do not wrap each result in a card, pill, or outlined icon circle.
- Do not place decorative icons or divider rows beside benefit copy.
- Keep the relationship between real screenshots as the primary evidence.
- Prefer measured outcomes (`8장 → 3묶음`, `지난 장면 2개`) over generic feature claims.
- Use this pattern in first-result, completion, and retention education surfaces only; repeated feed cards keep their existing summary/evidence structure.
