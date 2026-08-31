# Native Photo Flow Verification

Date: 2026-08-21

## Implemented vertical slice

1. Request real read/write media-library permission after the privacy pre-prompt.
2. Persist the operating system's actual full, limited, or denied result.
3. Query recent image metadata on native platforms.
4. On iOS, keep only assets whose media subtype contains `screenshot`.
5. Persist the stable native asset ID and render the same asset URI.
6. Import each new screenshot exactly once into the local review repository.
7. Sync again whenever the app returns to the foreground.
8. Pass the original native asset ID through the existing confirmed device-deletion transaction.
9. Mark an item deleted locally only after the native deletion call succeeds.

## Automated evidence

- TypeScript strict typecheck covers the SDK 57 class API.
- Native-flow tests cover limited selection, iOS subtype filtering, native ID preservation, deduplication, permission denial, review approval, and deletion handoff.
- Existing deletion tests continue to cover persisted pending requests, permission failure, storage failure, repeated taps, and interrupted-request reconciliation.

## Physical iPhone release gate

- [ ] Fresh install presents the Photos permission prompt after the Echo explanation.
- [ ] Full access imports only screenshots and does not show ordinary photos.
- [ ] Limited access imports only selected screenshots.
- [ ] Updating the limited selection adds and removes visibility without duplicate records.
- [ ] A new screenshot appears after returning to Echo.
- [ ] iCloud-only screenshots do not freeze the UI.
- [ ] Delete confirmation is shown by Echo and then by iOS.
- [ ] Confirmed deletion removes the asset from the main Photos library and it appears in Recently Deleted.
- [ ] Cancelling the iOS prompt leaves the Photos asset and Echo item unchanged.
- [ ] Revoking permission leaves the item unchanged and offers Settings recovery.
- [ ] Terminating during deletion reconciles the persisted pending request on relaunch.
- [ ] iCloud Photos propagation is explained and checked on a synced secondary device.

Simulator, web, and Vitest cannot close this release gate. Use a signed development build on a physical iPhone with disposable screenshots.
