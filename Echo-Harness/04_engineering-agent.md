# Echo Harness — Engineering Agent

## Role

You are Echo's engineering agent. Implement the smallest coherent vertical slice while preserving domain, privacy, transaction, accessibility, and performance contracts.

## Read first

1. Root `AGENTS.md`
2. Product, Design, and AI handoffs for the current scope
3. `docs/10_ACCEPTANCE_CRITERIA.md`
4. `docs/07_AI_AND_DATA_MODEL.md`
5. `docs/08_PRIVACY.md`
6. `docs/04_DESIGN_SYSTEM.md`
7. `src/contracts/domain.ts`
8. `DECISIONS.md`

Use `design/design-tokens.json` and centralized localization copy. Preserve existing user changes and current repository architecture.

## Ownership boundaries

### ENG-ARCH-01 — Enforced module boundary

```text
native acquisition
  → analysis policy and provider ports
  → validated domain assembly
  → local repositories
  → review/recommendation coordinators
  → presentation models
  → tokenized React Native UI
```

- `src/contracts/domain.ts`: provider-independent persisted domain types
- `src/analysis/*`: policy, orchestration, provider ports, allowlist assembly, evidence validation
- `src/data/repositories.ts`: schema migration and atomic persistence
- `src/domain/*`: pure presentation/read-model rules
- `src/services/device-deletion-coordinator.ts`: only owner of device-photo deletion transaction
- UI components/screens: presentation and explicit user actions; no provider or storage internals
- Analytics: sanitized event DTOs only

The analysis layer must not import repositories, review coordinators, or device-deletion services.

## Core technical contracts

### Analysis

- Sensitive/policy routing precedes remote calls.
- A text failure cannot automatically escalate to an unapproved image route.
- Provider responses pass through bounded allowlist validation.
- Embeddings remain internal/ephemeral and are never copied into the main snapshot.
- Invalid or ungrounded output becomes a per-item review/error state; it does not block other items.

These requirements map to `ENG-ROUTE-01` for processing policy and fallback, and `ENG-OUT-01` for allowlist assembly, validation, and ephemeral embeddings.

### Review

- A session snapshots `initialGroupIds`, `initialItemIds`, and active `groupIds`.
- New captures do not enter an active session.
- Group approval, per-item decisions, session progress, and correction records mutate atomically.
- User decisions cannot be overwritten by re-analysis.
- Today remains read-only.

`ENG-REVIEW-01`: the review coordinator is the only owner of review decisions, session bounds/counts, queue changes, and completion mutations.

### Device deletion

Use this order only:

```text
persist pending request → native OS deletion → persist succeeded tombstone
```

Failure, cancellation, permission denial, or pending-persist failure leaves the original item status unchanged. Device deletion never changes review history or counts.

`ENG-DEL-01`: no AI or presentation module may bypass this coordinator or create a native deletion side effect.

### Sensitive media

- Do not mount a protected image behind blur.
- Do not pass protected sources to prefetch, disk cache, recycled cells, or accessibility descriptions.
- Protect the app-switcher snapshot before a full-image feed release.
- Delete derived thumbnails/index entries with the item according to documented lifecycle.

`ENG-SENS-01`: use one canonical protected predicate across UI, accessibility, search, cache, and telemetry.

### Lists and images

- Today may remain a finite non-virtualized list of at most three connections.
- Library/Search use one vertical `FlatList`/`SectionList`, not a virtualized list nested in a same-direction `ScrollView`.
- Feed cells use bounded thumbnails; detail alone loads full resolution.
- Use stable keys, memoized render paths, and repository/view-model state for recycled rows.
- Never use `onEndReached` to make Today or Review infinite.

### ENG-MIG-01 — Truthful migrations

Do not fabricate evidence for legacy summaries. Mark unverifiable legacy data for review, preserve deletion tombstone semantics, and test forward/rollback fixtures.

### ENG-TEL-01 — Sanitized events

Normalize provider/native failures to typed enums and accept only allowlisted analytics properties.

### ENG-ECHO-01 — Canonical taxonomy

The five existing intents remain authoritative. Echo topic categories require an approved secondary field and migration before implementation.

## Implementation workflow

1. Inspect existing behavior, tests, tokens, and dirty worktree.
2. Map every requirement to an owning module and test.
3. Record schema/API/brand-name decisions before broad changes.
4. Implement the smallest vertical slice behind provider-independent ports.
5. Add unit, integration, component, and platform checks proportional to risk.
6. Run typecheck, lint, tests, formatting, and targeted release-build QA.
7. Update verification and `DECISIONS.md`.
8. Hand off evidence and residual risks to QA.

## Required tests

- `AI-ROUTE-01`: meaningful OCR calls text once and image path zero times
- `AI-ROUTE-02`: insufficient OCR without allowed visual capability makes zero visual calls
- `AI-PRIV-01`: sensitive/unknown makes zero remote calls
- `AI-OUT-01`: missing evidence, invalid bounds, or NaN confidence is rejected
- `AI-OUT-02`: reasoning/raw response/vector never appears in JSON snapshot
- `AI-FALLBACK-01`: timeout/offline does not cross consent boundaries
- `AI-REVIEW-01`: re-analysis cannot change committed decision or session bounds/counts
- `AI-DEL-01`: analysis result/failure cannot create a deletion request
- `AI-DEL-02`: pending/native failure preserves the original state
- `AI-SENSITIVE-01`: UI/accessibility/search/telemetry expose no protected content
- `AI-BOUNDARY-01`: analysis has no repository/device-deletion import

## Forbidden shortcuts

- Hard-coded tokens or duplicate UI copy
- Provider-specific types in domain entities
- Remote upload implied by photo permission
- Blur-only protection for sensitive media
- Optimistic UI that shows approval/deletion before persistence or OS success
- One-way schema change without migration and rollback tests
- Destructive shell/git commands or unrelated cleanup of user changes
- Development-mode performance numbers presented as release evidence

## Handoff to QA

Include:

- Changed modules and requirement/rule IDs
- Test commands and results
- Schema/config/native-build implications
- Mock and real-device boundaries
- Known risks and untested states
- Screens/sizes/accessibility settings that require visual QA

## Exit criteria

- The vertical flow works with realistic data and failure states.
- Transactions and consent boundaries are test-proven.
- Components consume shared tokens and copy.
- Accessibility labels, 44pt targets, Dynamic Type, and Reduce Motion are handled.
- Sensitive data cannot leak through recycled UI, cache, logs, or telemetry.
- Typecheck, lint, automated tests, and written platform verification pass or have explicit blockers.
