# Implementation Tasks

## Phase 0 — Repository audit and foundation

- [x] Read all handoff documents.
- [x] Inspect the existing repository and record assumptions in `DECISIONS.md`.
- [x] Choose the smallest mobile TypeScript architecture compatible with the repo.
- [x] Add formatting, linting, type checking, and test commands.
- [x] Install or map the design token layer.
- [x] Add app shell and three-tab navigation.
- [x] Create mock data covering all acceptance cases.

### Exit criteria

The app starts, shows Today/Library/Search tabs, and consumes centralized tokens.

## Phase 1 — Domain and local data

- [x] Implement entities from `src/contracts/domain.ts`.
- [x] Add repository interfaces for items, groups, collections, and sessions.
- [x] Add in-memory or local database adapter.
- [x] Add mock `ScreenshotAnalyzer`.
- [x] Seed at least 20 realistic Korean items.
- [x] Add grouping fixtures: duplicate, same product, scroll sequence, same topic.

### Exit criteria

The app can load, update, group, and persist mock screenshot records.

## Phase 2 — Onboarding and permission states

- [x] Build value, privacy, and review-time screens.
- [x] Implement permission granted/denied/limited states.
- [x] Provide manual import fallback.
- [x] Persist onboarding completion.
- [x] Show measured first-result evidence before completing onboarding.

### Exit criteria

A new user sees the first prepared result, then reaches review or Today through every permission branch.

## Phase 3 — Today screen

- [x] Build date header and hero summary.
- [x] Build intent count chips.
- [x] Build group previews.
- [x] Implement empty, loading, analysis failed, and review-in-progress states.
- [x] Start or resume review session.

### Exit criteria

Today accurately reflects the local data state and opens the correct review session.

## Phase 4 — Daily review

- [x] Build `GroupTray`.
- [x] Approve all items with suggested intent.
- [x] Change group intent.
- [x] Review items individually.
- [x] Merge/separate groups.
- [x] Remove with undo.
- [x] Show review progress and completion.
- [x] Persist user corrections.

### Exit criteria

A 12-item, 4-group session can be completed without opening every item.

## Phase 5 — Library and detail

- [ ] Build two-column grid.
- [ ] Add intent filters and advanced filter sheet.
- [ ] Add sensitive blur.
- [ ] Add long-capture presentation.
- [ ] Build item detail.
- [ ] Add collection assignment.
- [ ] Separate app removal from device deletion.

### Exit criteria

Saved items can be filtered, inspected, edited, and safely removed.

## Phase 6 — Search

- [ ] Build local index from title, OCR, summary, source, intent, type, date.
- [ ] Implement keyword ranking.
- [ ] Show match evidence.
- [ ] Add recent and suggested queries.
- [ ] Add no-result guidance.

### Exit criteria

The seeded searches in the screen spec return sensible results.

## Phase 7 — Privacy and accessibility QA

- [ ] Add app lock architecture or placeholder adapter.
- [ ] Block sensitive thumbnails in app switcher where platform supports it.
- [ ] Verify share defaults.
- [ ] Add accessible names and focus order.
- [ ] Check large text and reduced motion.
- [ ] Check 44×44 touch targets.

### Exit criteria

No sensitive item is shared without a warning and all core flows are keyboard/screen-reader navigable where supported.

## Phase 8 — Analytics and experiment hooks

- [ ] Add typed analytics event interface.
- [ ] Track activation and review funnel without image/OCR content.
- [ ] Add feature flags for share cards and weekly summary.
- [ ] Add review duration and correction-rate calculations.

### Exit criteria

The product team can measure activation, review completion, corrections, search success, and useful recall.

## Phase 9 — Optional share artifact

- [ ] Build `오늘의 발견 3` composer.
- [ ] Exclude sensitive items by default.
- [ ] Add blur review.
- [ ] Render shareable image.
- [ ] Invoke system share sheet.

### Exit criteria

A safe, branded, non-misleading share artifact can be created from three selected items.
