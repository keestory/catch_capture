# UX Contract

## Product context

- Audience: 스크린샷을 행동 가능한 개인 아카이브로 바꾸려는 한국어 사용자
- Primary jobs: 직접 선택 또는 기기 감지 → 유한한 Today → 묶음 Review → Library/Search 재발견
- Target market: 한국어 우선
- Active locales: `ko-KR`
- Language/content register: 부담을 줄이는 평서문, 구체적 동사, AI 기술명 비노출
- Timezone/calendar policy: 기기 현지시간과 Gregorian 달력; 브라우저 수동 가져오기는 `importedAt` 날짜로 리뷰
- Accessibility target: WCAG 2.2 AA

## Business-context sources

| Domain / scope   | Authoritative source                                          | Source type        | Reviewed date |
| ---------------- | ------------------------------------------------------------- | ------------------ | ------------- |
| 제품 흐름과 상태 | `docs/02_MVP_SCOPE.md`, `docs/03_INFORMATION_ARCHITECTURE.md` | Product spec       | 2026-08-30    |
| 데이터 생명주기  | `docs/07_AI_AND_DATA_MODEL.md`, `src/contracts/domain.ts`     | Domain spec        | 2026-08-30    |
| 개인정보·삭제    | `docs/08_PRIVACY.md`                                          | Privacy policy     | 2026-08-30    |
| 화면·접근성      | `docs/05_SCREEN_SPECS.md`, `docs/10_ACCEPTANCE_CRITERIA.md`   | UX acceptance      | 2026-08-30    |
| 웹 기능 경계     | `DECISIONS.md`, `docs/WEB_FIRST_VERIFICATION_2026-08-29.md`   | ADR / verification | 2026-08-30    |
| 과금·결제        | 해당 없음                                                     | —                  | 2026-08-30    |

## Visual contract

- Project `DESIGN.md`: `DESIGN.md`
- Token ownership model: existing runtime canonical
- Runtime design-system/token source: `design/design-tokens.json`
- Mapping/export/adapters: `src/theme/tokens.ts` → shared React Native components
- Token drift gate: `tests/design-system.test.ts`, formatter/typecheck, browser inspection
- Supported themes: light; dark tokens are not a shipped theme
- Design-context owner/review policy: durable changes update token source, typed adapter, tests, and `DESIGN.md` together

## Canonical UI Map

| Capability | Canonical owner                                 | Source of truth         | Allowed variants                          | Verification                 |
| ---------- | ----------------------------------------------- | ----------------------- | ----------------------------------------- | ---------------------------- |
| Scrollbar  | `AppScreen` and route `FlatList` owners         | `DESIGN.md`             | native visible / geometry-only exceptions | browser narrow + desktop     |
| Toast      | `UndoToast`                                     | `docs/06_COMPONENTS.md` | undo status                               | component + review flow      |
| CRUD       | local repositories and `DailyReviewCoordinator` | domain/privacy docs     | app removal / native device deletion      | repository tests + full flow |

Table selection, Select/Listbox, Date, and product Form are not part of this web slice.

## Component behavior

| Component      | Default                       | Hover               | Focus                   | Active                  | Disabled                 | Busy                 | Error                  |
| -------------- | ----------------------------- | ------------------- | ----------------------- | ----------------------- | ------------------------ | -------------------- | ---------------------- |
| `ActionButton` | intent + emphasis             | platform Pressable  | semantic button         | stable pressed feedback | non-interactive + dimmed | same geometry        | inline owner message   |
| Icon button    | 44px target + accessible name | platform Pressable  | semantic button         | pressed feedback        | non-interactive          | stable geometry      | owner message          |
| Search         | local input + clear           | platform text input | visible field border    | Enter submits           | n/a                      | reserved state panel | persistent retry panel |
| List           | finite, full local dataset    | item Pressable      | semantic child controls | open detail             | n/a                      | stable state panel   | retry state            |

## Dataset navigation

- Exploratory lists: bounded local render-all; Today and search explicitly show their end.
- URL state: committed search uses `q`; local intent filter is transient and non-sensitive.
- Empty/no-results/error/loading treatment: shared `StatePanel` with distinct Korean recovery copy.
- Back/scroll restoration: Expo Router history; changed review groups reset content context.
- Selection scope: group-level Review approval with per-item exceptions; no table bulk selection.

## Flow ledger

| Operation            | Trigger                              | Pending                                | Success destination    | Success feedback                   | Failure recovery         | Focus outcome                | Source ref                            |
| -------------------- | ------------------------------------ | -------------------------------------- | ---------------------- | ---------------------------------- | ------------------------ | ---------------------------- | ------------------------------------- |
| Browser import       | `사진 앱에서 스크린샷 고르기`        | stable busy label                      | first result or Today  | selection result in Today          | inline error + retry     | result heading               | `docs/02_MVP_SCOPE.md`                |
| Demo → manual        | `내 스크린샷 선택`                   | demo remains until a selection is made | Today                  | selected local batch replaces demo | cancel preserves demo    | Today import region          | `docs/08_PRIVACY.md`                  |
| Review approve       | `모두 {의도}으로 보관`               | button disabled/busy                   | next group or complete | progress + complete screen         | current group retained   | next group heading           | `docs/05_SCREEN_SPECS.md`             |
| Search               | search keyboard action or suggestion | stable loading panel                   | same route             | result count                       | retry panel              | search/results context       | `docs/03_INFORMATION_ARCHITECTURE.md` |
| Soft-delete          | `Echo에서만 제거`                    | confirmation/action pending            | valid parent context   | shared Undo                        | item retained on failure | next valid context           | `docs/08_PRIVACY.md`                  |
| Native device delete | `기기 사진에서도 삭제`               | pessimistic OS transaction             | detail/valid parent    | exact result state                 | original item retained   | confirmation trigger/context | `docs/08_PRIVACY.md`                  |
| Cancel/back          | Back/close                           | none                                   | originating route      | none                               | n/a                      | originating context          | `docs/03_INFORMATION_ARCHITECTURE.md` |

## Navigation and responsive behavior

- Route document title policy: localized `{Page} — Echo`, owned by `src/app/_layout.tsx`.
- Route errors: app-owned `StatePanel`; no auth/403 surface exists in the local-only MVP.
- Tab policy: Today, Library, Search are route-backed; desktop web uses top labels, mobile uses bottom icon tabs.
- Responsive transformation: focused Today/Review remains ≤480px; Library uses 1/2/3 columns up to 920px.
- Truncation/full-value access: cards open detail/fullscreen; important instructions and errors wrap.
- Focus and sticky policy: 44px targets, no control may be obscured by navigation or safe areas.

## Overlays and feedback

- Dialog primitive: app-owned React Native modal/panel; browser `alert/confirm/prompt` forbidden.
- Destructive confirmation: app removal is recoverable with Undo; device deletion is native-only and pessimistic.
- Toast: one latest `UndoToast`, 4–6 seconds, polite live region.
- Alert/banner: state scoped and persistent until condition changes.
- Layer order: modal > contextual sheet > toast > page content.

## Async and resilience

- Mutation default: pessimistic for review persistence and deletion; browser preprocessing completes before import commit.
- Duplicate-submit policy: busy/disabled guards on import and review actions.
- Offline behavior: all MVP data is local; no server retry or sync claim.
- Stale requests: search is local; route state prevents old remote responses because none exist.
- Failure preservation: selected/demo data is not cleared on picker cancel; device deletion failure retains the item.

## Validation

- Browser file validation: PNG/JPG/WebP, first six accepted images, 1000px WebP preview, 2.4M encoded-character budget.
- Sensitive-value handling: web explicitly states that OCR and sensitive detection are absent; non-sensitive test captures only.
- Duplicate submission: file selection and Review actions use busy guards.

## Permission and clipboard

- Browser: no fake photo-library permission or settings recovery; the onboarding and first Today viewport explain that a user gesture opens the system picker and only selected images are available.
- Browser empty-state actions open the picker directly; they never call passive sync as though the browser could discover new photos.
- Native: denied/limited/full states and settings recovery follow platform adapters.
- Clipboard: no web clipboard feature in this slice.

## Verification

- Required static commands: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, premium strict audit.
- Browser matrix: desktop and narrow mobile width, keyboard navigation, picker cancel/success/error, reduced motion.
- Canonical sibling flow: manual onboarding import compared with Today re-import.
- CRUD evidence: `tests/repositories.test.ts`, `tests/browser-web-flow.test.ts`, `tests/device-deletion.test.ts`.
- Failure evidence: StatePanel branches, permission tests, storage-budget and release-asset checks.
