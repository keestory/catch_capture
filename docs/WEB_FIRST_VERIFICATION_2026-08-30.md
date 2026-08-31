# Web-first vertical slice verification — 2026-08-30

## Scope

The verified browser loop is:

`direct selection or release-safe demo → first result → finite Today → grouped Review → Library/Search`

This is a web-first product slice, not proof of native photo-library automation or App Store readiness.

## Product behavior

- Users can choose up to six PNG/JPG/WebP screenshots directly in the browser.
- Selection stays local to the browser and replaces demo content only after at least one valid file is prepared.
- Old files enter the current review by import date instead of disappearing into their original capture date.
- Browser imports use an honest `확인 필요` analysis and do not claim OCR, sensitive-content detection, or intent classification.
- Search returns only saved/completed items; unapproved captures cannot appear as rediscovered results.
- Release demo scenes are code-native. User evaluation screenshots remain local-only and have no runtime source references.

## Verification evidence

- `npm run verify`: passed.
- Prettier, ESLint, and TypeScript strict: passed.
- Vitest: 21 files and 121 tests passed.
- Evaluation asset check: 9 local files scanned, 0 unavailable; no app-source references.
- Browser: onboarding, demo first result, finite Today, grouped approval, Library, and Search rendered without an error overlay.
- Review: approving the first group advanced progress and announced the saved count.
- Responsive layout: checked at desktop width and 390×844 mobile width.
- Production export: `npm run export -- --platform web` creates `dist/`.

## Native-only boundaries

Web verification does not prove automatic screenshot discovery, Limited Photos behavior, background scheduling, device-photo deletion, share-sheet behavior, on-device OCR, or sensitive-region detection. These capabilities require a signed native build and physical-device QA.

## Residual manual checks

- The operating-system file picker itself is not automated with a personal fixture; file limits, MIME validation, cancellation, import-date handling, and storage limits are covered by tests.
- Screen-reader testing with VoiceOver/TalkBack and physical-device deletion remain release gates for their respective platforms.
