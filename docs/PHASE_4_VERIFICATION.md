# Phase 4 Verification

Date: 2026-08-21

## Delivered flow

- Keep the suggested intent for a whole group with one primary action.
- Open `하나씩 확인` and save only exceptional screenshots under a different intent.
- Stage `앱에서만 제거`, show that the device photo is unchanged, and allow immediate undo.
- Approve all item drafts and untouched siblings in one atomic group mutation.
- Split a multi-item group into persistent singletons and merge untouched siblings back.
- Resume the same session with item drafts and the changed group queue intact.
- Complete with saved and app-removed counts shown separately.

## Data invariants

- The immutable session boundary is `initialGroupIds` plus `initialItemIds`.
- The active queue is `groupIds`; split/merge changes only this queue and group membership.
- A draft decision never changes item status. Approval commits every group item exactly once.
- App removal preserves `deviceAssetId` and never calls device deletion.
- Superseded groups are excluded from pending review.
- A failed persistent write leaves groups, membership, decisions, and session progress unchanged.

## Automated evidence

- `npm run typecheck`: passed.
- `npm run lint`: passed with zero warnings.
- `npm test -- --run`: 4 files, 36 tests passed.
- Coverage scenarios: mixed per-item intent, staged removal and undo, committed app removal, split persistence, regroup, structural-change guard, storage rollback, completion counts, and Phase 3 session migration.

## Manual mobile-web checklist

- [x] 390×844 default grouped review keeps one dominant approval action.
- [x] Individual review shows item progress, five intent choices, and exact `앱에서만 제거` copy.
- [x] Undo notice says the device photo remains unchanged.
- [x] Split changes the queue total and merge restores it before approval.
- [x] Completion separates saved and app-removed counts.
- [x] Closing and reopening resumes persisted progress.
- [x] The full automated browser flow completed without a runtime error screen or failed app action.

Observed result: the first 2-item group changed from 10 total groups to 11 when split and returned to 10 when merged. One item was saved as `간직`, one was staged for app removal, undone, removed again, and then committed. After closing, Today showed `1 / 10` groups complete and resumed at `2 / 10`. The final screen reported 16 saved and 1 app-removed item; rediscovery returned only the remaining `간직` screenshot. The completion screen was visually inspected at 390×844.

## Native boundary

This Phase 4 browser receipt predates the native photo vertical slice and remains evidence only for the review transaction. The current Expo app now requests MediaLibrary permission, queries screenshot assets, persists native asset identifiers, and routes those identifiers to device deletion. Browser QA still cannot exercise PhotoKit or MediaStore. System prompts, limited-library changes, deletion confirmation, Recently Deleted behavior, iCloud-backed assets, and lifecycle recovery remain physical-device release gates.
