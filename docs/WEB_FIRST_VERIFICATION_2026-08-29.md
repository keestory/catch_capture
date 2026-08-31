# Web-first vertical slice verification — 2026-08-29

## Scope

Validate the smallest web loop without implying native capabilities:

`direct selection or demo → first result → finite Today → grouped Review → Library/Search`

## Implemented

- Browser-only direct selection for up to 6 PNG/JPG/WebP screenshots.
- Local 1000px WebP preparation with a 2.4M-character encoded storage budget.
- Browser permission remains denied; the UI does not imitate photo-library access.
- Web uploads are marked `확인 필요` and use filename/source/date as limited search evidence.
- The onboarding copy states that OCR and sensitive-content detection are not connected.
- Web skips notification-time selection and stores `later`.
- Manual review dates use `importedAt`, so old files enter the current import review.
- Today provides a repeat browser-selection action after onboarding.
- Web detail hides device deletion and distinguishes the prepared preview from an original file.
- Desktop web uses a labeled top tab bar; Library expands to a tokenized 920px/3-column workspace.

## Automated and static evidence

- Evaluation asset policy check: passed for 9 local-only images.
- Prettier check: passed for all changed TypeScript, Markdown, and token files.
- TypeScript `transpileModule` diagnostics: passed for 14 changed TypeScript files.
- Direct behavior checks: browser MIME/6-item limit/fake-permission boundary and manual old-file
  review-date resolution passed.
- Added `tests/browser-web-flow.test.ts` for browser boundaries, manual review date, and bounded
  import grouping.

## Environment blocker

On this host, `tsc`, ESLint, Vitest workers, Expo web export, and the Expo dev server remained
without progress or failed to start workers. They were stopped rather than reported as passing.
Browser visual QA could not run because `127.0.0.1:4401` never became reachable.

## Release gate

Public export remains intentionally blocked while 9 user-evaluation screenshots are bundled.
They contain third-party brands/people/accounts and are not release-cleared.

Before public testing:

- [ ] Run `npm run verify` successfully in a healthy Node/worker environment.
- [ ] Run a production web export to a temporary directory.
- [ ] Replace or remove the 9 local evaluation screenshots, then pass `npm run release:check`.
- [ ] QA 390×844, 760px breakpoint, and ≥900px desktop.
- [ ] Exercise picker cancel, 1/6/7 files, old files, unsupported formats, and storage-budget failure.
- [ ] Complete upload → Review → Library → filename/source/date search.
- [ ] Verify keyboard-only use, 200% zoom, reduced motion, and screen-reader labels.
- [ ] Treat any sensitive-content exposure as a release blocker.

## Native-only boundaries

Web-first validation does not prove automatic screenshot discovery, Limited Photos behavior,
background scheduling, physical-device deletion, share-sheet behavior, or App Store readiness.
