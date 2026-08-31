# AGENTS.md — Screenshot Curator

## 0. Mission
Build a mobile-first screenshot curation app that turns accumulated screenshots into a calm daily review.

The product is **not** a generic photo organizer and **not** an AI chatbot. It is a background curator that:

1. Detects new screenshots.
2. Groups and classifies them by **why the user captured them**.
3. Lets the user confirm batches in under one minute.
4. Makes saved screenshots easy to rediscover and act on.

Primary language: Korean.
Primary platform: mobile. Adapt to the existing repository if one is present. If the repository is empty, create a clean TypeScript mobile application structure without pinning package versions.

---

## 1. Product principles

1. **Intent over source**  
   Instagram, Chrome, KakaoTalk, and news apps are sources. The main organization system is the user’s intent:
   - reference
   - want
   - share
   - read
   - keep

2. **Approve batches, fix exceptions**  
   Never force the user to classify every screenshot one by one. Default to grouped review and provide per-item correction only when needed.

3. **AI stays quiet**  
   Do not use magic-wand visuals, chat bubbles, purple AI gradients, or verbose AI explanations. AI suggestions should appear as subtle labels, grouped results, and editable metadata.

4. **The screenshot is the hero**  
   UI chrome must remain visually neutral because screenshots already contain strong colors and dense content.

5. **Relief, not guilt**  
   Copy must reduce burden. Never shame the user for accumulated screenshots.

6. **Privacy by default**  
   Screenshots may contain conversations, addresses, order numbers, financial information, and confidential work content. Sensitive content must be protected and excluded from sharing by default.

7. **Every saved item should remain useful**  
   The loop is capture → organize → rediscover → act.

---

## 2. Read-first files

Before implementation, read in this order:

1. `docs/01_PRODUCT_BRIEF.md`
2. `docs/02_MVP_SCOPE.md`
3. `docs/03_INFORMATION_ARCHITECTURE.md`
4. `docs/04_DESIGN_SYSTEM.md`
5. `docs/05_SCREEN_SPECS.md`
6. `docs/06_COMPONENTS.md`
7. `docs/07_AI_AND_DATA_MODEL.md`
8. `docs/08_PRIVACY.md`
9. `docs/09_ANALYTICS_AND_VIRAL.md`
10. `docs/10_ACCEPTANCE_CRITERIA.md`
11. `tasks/TASKS.md`

Treat these files as the source of truth. When two files conflict, prioritize:

`AGENTS.md` → acceptance criteria → MVP scope → screen specs → design system → everything else.

### Echo Product Harness

Cross-functional Echo work uses the role contracts in `Echo-Harness/`:

1. `00_strategy-agent.md` — evidence, positioning, bet, and metrics
2. `01_product-agent.md` — flow, states, requirements, and acceptance criteria
3. `02_design-agent.md` — hierarchy, components, tokens, accessibility, and motion
4. `03_ai-agent.md` — grounded AI behavior, consent, uncertainty, and prohibited actions
5. `04_engineering-agent.md` — architecture, transactions, implementation, and test evidence
6. `05_qa-agent.md` — traceability, release gate, and residual risk

Canonical Echo proposal inputs live in:

- `docs/product/echo-product-principles.md`
- `docs/design/echo-design-system.md`
- `docs/design/echo-ui-components.md`
- `docs/ai/echo-ai-behavior-rules.md`
- `assets/brand/echo/asset-manifest.md`

Harness files are operating contracts, not a higher product authority. Echo proposal documents cannot weaken the mission, grouped-review, finite-feed, privacy, accessibility, or deletion rules above. A single task should use only the roles required by its scope, while preserving the listed handoff order.

---

## 3. Implementation rules

- Preserve domain terminology from `src/contracts/domain.ts`.
- Consume design values from `design/design-tokens.json` or the typed mirror in `src/theme/tokens.ts`.
- Do not hard-code category colors or spacing inside screens.
- Keep UI copy in a centralized copy file or localization layer. Seed copy is in `design/copy-ko.json`.
- Build screens from reusable components defined in `docs/06_COMPONENTS.md`.
- Maintain 44×44 pt minimum interactive areas.
- Support light mode first, but keep token architecture dark-mode-ready.
- Provide loading, empty, permission-denied, offline, error, and destructive-confirmation states.
- Always distinguish:
  - remove from app
  - delete original from device photos
- Destructive actions need undo where technically possible.
- Use accessible labels for icon-only controls.
- Color must never be the only signal for an intent category.
- Respect reduced-motion settings.
- Do not introduce social feeds, followers, likes, or public profiles in the MVP.
- Do not add automatic outbound sharing in the MVP.
- Do not upload original screenshots to a server unless explicitly enabled by the user.

---

## 4. Definition of done

A task is complete only when:

- The user flow works end-to-end with realistic mock data.
- Empty/loading/error/permission states are implemented.
- Accessibility labels and touch targets are checked.
- Components use design tokens.
- Relevant acceptance criteria are covered by tests or a written verification checklist.
- No screen requires a user to understand AI terminology.
- The daily review can be completed as grouped approvals without opening every item.

---

## 5. Working style

For each implementation phase:

1. State the assumptions briefly in the PR or task notes.
2. Implement the smallest coherent vertical slice.
3. Add or update tests.
4. Record unresolved product decisions in `DECISIONS.md` rather than silently inventing behavior.
5. Keep commits scoped by feature or layer.

Do not rewrite the product concept without evidence from user testing or explicit instruction.
