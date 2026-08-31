# Decisions

## 2026-08-30 — Release-safe web-first vertical slice

- The web product starts with explicit PNG/JPG/WebP selection or a code-native Korean demo. It never imitates browser access to the system photo library.
- Selecting at least one valid screenshot while in demo mode replaces the demo repository and records manual mode. Canceling selection leaves the demo untouched.
- Browser imports use import date for the daily review and remain `확인 필요`; filenames and limited file metadata are evidence, not OCR or inferred intent.
- Search is a rediscovery surface for saved/completed items only. Unapproved captures remain inside Today/Review.
- User evaluation screenshots may remain as local inspection fixtures but have no runtime source reference and cannot enter a release bundle.
- `DESIGN.md` and `UX-CONTRACT.md` are the durable web UI and interaction contracts. They preserve the quiet functional surface, finite feed, explicit async states, 44pt targets, and privacy boundaries.
- Web export proves the browser slice only. Automatic discovery, native permissions, background work, device deletion, on-device OCR, and sensitive detection remain native-only release gates.

## 2026-08-21 — Phase 0/1 foundation

### Technical assumptions

- The existing SwiftUI prototype remains intact as a validated native exploration. The new handoff explicitly requires a mobile TypeScript foundation, so the root JavaScript entry point is now an Expo SDK 57 / React Native app.
- Expo SDK 57 was selected from the current official `create-expo-app` template because the local Node 24 and Xcode 26.6 runtimes satisfy its documented requirements. Package versions come from that template rather than an ad-hoc combination.
- `design/design-tokens.json` is the canonical design source. `src/theme/tokens.ts` only unwraps typed values from that JSON.
- Phase 1 uses a JSON snapshot repository behind a `StorageDriver`. The app uses AsyncStorage; tests use a deterministic in-memory driver.
- Mock screenshot visuals are rendered locally from metadata. No remote images or original screenshots are required for Phase 0/1.
- The TypeScript app is the primary path for the supplied Phase roadmap. The native SwiftUI prototype remains available until a later migration decision.

### Deferred product decisions

- Whether to replace, embed, or retire the SwiftUI prototype after the TypeScript vertical slice is validated.
- Photo permission and real device import implementation belong to Phase 2.
- Group merge/split interaction, undo UI, and full review completion belong to Phase 4.
- Device-photo deletion is represented by a separate repository method but intentionally has no Phase 0/1 UI.
- Search ranking is local keyword matching in this phase; embeddings remain deferred.
- App Store primary category remains a release decision, but the 2026-08-21 Korean chart review favors Productivity over Business: the Business chart is dominated by employment, tax, fax, and administrative utilities, while direct screenshot-organizer references are mostly listed under Productivity or Utilities.

### Risks

- Expo SDK 57 is newer than the Expo Go transition default; native development builds may be required on some physical devices.
- Source-app metadata cannot always be recovered from device photo assets and must remain optional.
- Mock classification quality cannot validate real OCR, sensitive-region detection, or user intent accuracy.
- Two mobile implementations coexist temporarily; CI and release ownership must be decided before store delivery.
- Competitors already claim automatic classification, local OCR, daily review, and privacy. Positioning should lead with the concrete behavior: approve intent-based groups once a day, rather than a generic AI-organizer claim.
- `npm audit --omit=dev` reports 15 transitive Expo/Metro issues (7 moderate, 8 high), including `image-size` and `uuid`. npm's complete fix would force a breaking downgrade to Expo 53, so Phase 0/1 keeps the official SDK 57 dependency set and records this as an upstream release gate instead of applying `--force`.

## 2026-08-21 — Phase 2 onboarding and first value loop

### Implemented decisions

- Onboarding state is stored separately under `catch.onboarding.v1`; resetting it cannot remove screenshot records.
- Photo access is requested only after the value and privacy explanation. The state model covers full, limited, denied, manual selection, and demo continuation.
- A denied permission is not a failed onboarding. Users can select screenshots manually or continue with local examples.
- The review-time choice is stored locally. Phase 2 does not request notification permission or claim that a reminder has been scheduled.
- The first grouped approval reveals a direct rediscovery action. It opens Search with terms derived from the approved representative item, proving organize → rediscover without requiring a separate tutorial.
- Onboarding completion is written only after value, privacy/access, and review-time steps have all been handled. Draft fields persist so the route guard can resume the next incomplete step.

### Native boundary

- `PhaseTwoPhotoAccessAdapter` is deterministic mock behavior. It does not call PhotoKit, MediaStore, a system photo picker, or import original images.
- System permission reconciliation after foreground return, limited-library management, actual selected assets, notification scheduling, and real device import remain native implementation work.
- Direct system settings opening uses React Native `Linking.openSettings`; unsupported environments remain on the permission screen and offer manual/demo continuation.

## 2026-08-21 — Phase 3 Today and daily review core

### Implemented decisions

- Today is an inbox and entry point. It previews at most three groups and never mutates a group directly; all approvals go through the persisted daily review session.
- A review session snapshots its actionable `groupIds` when it starts. Screenshots captured afterward are not appended to an in-progress session and belong to a later review.
- Today counts and sessions are scoped to the local calendar date from `capturedAt`. A completed session from another date cannot replace today's empty state.
- A group enters the session only when every item is `ready_for_review`, analyzed, and captured on the review date. Analysis failures stay visible as a separate Today state and do not block the other groups.
- `suggestedIntent` remains the immutable analyzer proposal. `reviewIntent` is the user's saved draft during review, and `approvedIntent` is the final group choice.
- Group approval updates items, group approval, session progress, and correction records in one `LocalDataStore.mutate` operation. Mutations are serialized; persistence failure leaves both memory and disk at the previous snapshot.
- Completion is persisted only after the last snapshotted group. Closing and reopening the app resumes the same session and current group.
- The completion screen proves the product loop with actual reviewed counts and a local search rediscovery action. The optional share artifact stays deferred.

### Deferred product decisions

- Whether newly captured groups after a completed same-day review create a second session or wait for the next day.
- Individual item review, merge/separate, remove/undo, and session repair for legacy externally approved groups remain Phase 4 work.
- Review-duration and correction-rate analytics events remain Phase 8; current persisted fields only make those calculations possible.

## 2026-08-21 — Phase 4 daily review exceptions and group repair

### Implemented decisions

- Group approval remains the primary and final action. Per-item changes are persisted as `ReviewItemDecision` drafts and committed atomically only when the current group is approved.
- A saved item may override the group intent; an untouched sibling inherits the final group intent. A mixed-intent group records `resolutionMode: individual` and does not invent one misleading `approvedIntent`.
- `앱에서만 제거` stages an item-level removal decision. Before group approval it can be undone and the screenshot stays `ready_for_review`; after approval it becomes `removed` in Catch while `deviceAssetId` remains unchanged. Device deletion is a separate, unused operation.
- Each session keeps immutable `initialGroupIds` and `initialItemIds` for truthful completion counts, plus a mutable `groupIds` queue for structural changes. `reviewedItemCount` includes saved and app-removed items; `removedItemCount` is reported separately; `correctedItemCount` counts only saved intent changes.
- Splitting supersedes the original group and inserts one-item children into the active queue in a single transaction. Regrouping is allowed only from the first untouched sibling before any individual decision or approval; it restores the original group and supersedes the children.
- Superseded groups never return from `pending()`. Split titles for sensitive screenshots remain generic and do not expose analyzer text.
- Schema version 2 migrates Phase 3 sessions by deriving their immutable initial group/item bounds and adds an empty decision journal.

### Verification boundary

- Local persistence, migration, atomic rollback, draft resume, split/regroup, mixed intent, remove/undo, and completion counts are covered by Vitest.
- Web mobile QA validates the interaction contract and accessibility labels. Photo-library deletion guarantees still require native adapter and physical-device tests before any device-delete UI is introduced.

## 2026-08-21 — Content summaries in daily review

- Individual summaries reuse the existing `ScreenshotAnalysis.summary`; no duplicate item field or storage migration was added.
- `ScreenshotGroup.summary` describes what the whole group contains. The existing `reason` now has the narrower UI meaning `묶은 근거` and explains only why the items belong together.
- Summary and grouping evidence remain separate sentences. Individual summaries appear only in wide/detail-style cards, not every thumbnail in a batch.
- If any item is sensitive, the group summary and grouping evidence are replaced by one generic protected message. Individual sensitive cards also continue to hide their analysis title, summary, and source.
- A future `why now` recommendation reason must use a separate rediscovery read model. Daily review groups are mutable approval queues and must not be reused for saved historical recommendations.

## 2026-08-21 — Device photo deletion

- Actual photo deletion uses Expo MediaLibrary's SDK 57 class API (`Asset.delete()`), not the deprecated function API.
- The operation is ordered as persisted pending request → native delete → persisted tombstone. OS failure, cancellation, or permission denial never changes the screenshot status.
- `DeviceDeletionRequest` is separate from `ReviewItemDecision`. Deleting an already-reviewed original cannot rewrite grouped review history, group membership, session bounds, or review counts.
- Device deletion is available from the saved item detail, not from an unapproved group. This prevents the later group approval from reviving a deleted item as `saved`.
- Schema 3 stores deletion requests. Older schema-2 `deleted_from_device` flags are migrated to `legacy_unverified` and the local item becomes `removed`, because the old implementation did not prove an OS deletion.
- App-only removal remains reversible inside Catch. Device deletion has an app confirmation, the platform confirmation where applicable, and a Photos `Recently Deleted` recovery explanation instead of a fake in-app Undo.
- The config plugin changes require a new native binary; they cannot ship as an over-the-air JavaScript-only update.

## 2026-08-21 — Grounded content-summary routing

- Readable OCR routes to the text summarizer. Missing, too-short, or failed OCR routes to image embedding plus a separate visual summarizer.
- An image embedding supports similarity and clustering but does not generate a factual sentence on its own. The visual summarizer receives both the image reference and the in-memory embedding.
- `ScreenshotAnalysis.summary` remains the canonical display and search field. Optional `summaryEvidence` adds the route, at most three observable signals, a short user explanation, and model version without forcing a storage migration.
- Provider chain-of-thought, prompts, raw responses, and token traces are never part of the domain contract. User-facing reasoning means verifiable evidence only.
- Raw vectors are returned only inside the analysis pipeline and are not copied into `ScreenshotAnalysis` or the main serialized snapshot. A production similarity index must use separate local storage and persist only a reference in item metadata.
- Sensitive items hide summary evidence together with the summary. A remote text or image provider remains opt-in because both OCR and image pixels may contain private information.
- The FlagPick product-detail example stores only non-personal OCR facts and uses a neutral mock visual. The supplied raw capture is not added to app assets because its account area contains a personal name and possible work-confidential pricing data.
- Product economics are quoted as screen-displayed values, never recomputed or described as realized profit. In the example, the visible recent price and arrival cost do not arithmetically explain the displayed expected-profit value, so the summary deliberately says `표시돼요`.

## 2026-08-21 — Finite Recall Feed planning direction

- The redesign hypothesis is `Finite Recall Feed`: familiar Instagram-style media hierarchy plus Whatnot-style single-object action clarity, translated into a private workflow that ends after at most three Today groups.
- Today remains read-only and finite. Review remains the only place for group approval and keeps one group and one primary action in focus.
- Social and live-commerce mechanics are excluded: no infinite recommendation loading, public profiles, likes, comments, follower counts, autoplay, live badges, countdowns, chat, auctions, streaks, or FOMO copy.
- The existing `Quiet Signal Archive` tokens, five intents, summary/evidence separation, local-first privacy model, and distinct device-deletion confirmation remain canonical.
- Sensitive media must not be mounted behind a blur or prefetched. Library and Search require one virtualized vertical list, bounded cells, thumbnails in feeds, and full-resolution media only in detail.
- This is a planning decision, not an implemented redesign. UI code begins only after the PRD and low-fidelity Today/Review/Detail prototype are approved.

## 2026-08-21 — Echo brand asset system

- The user-provided logo establishes `Returning Orbit + Memory Core + Quiet Asymmetry` as Echo's brand mark. The Orb is a memory symbol, not an AI avatar, assistant, spinner, or product-state authority.
- Full-color aqua/lilac/violet glass is limited to app icon, splash, onboarding, completion, store, and marketing assets. Functional UI keeps Quiet Signal Archive's warm neutrals, cobalt primary, signal lime, and semantic intent/status colors.
- Approximate raster-derived colors live under `color.brandAsset.*`; they cannot be used as CTA, intent, success, danger, sensitive, or body-text colors.
- Selected generated candidates live in `assets/brand/echo/`: opaque icon master, opaque splash composition, onboarding hero, store hero, flat SVG, and monochrome SVG. Prompt provenance and usage limits are in the asset manifest.
- Two generated transparent-raster attempts failed alpha validation and were excluded. Android adaptive foreground and transparent raster usage remain blocked until an actual-alpha export and safe-zone QA pass.
- This asset pass does not rename `CATCH`, alter the slug/scheme/bundle/package identifiers, or change `app.json`. Native icon/splash wiring is a separate migration after cross-platform asset completion and preview-build validation.

## 2026-08-21 — Echo product-surface redesign

- The Expo product surface now uses `ECHO` consistently in the wordmark, onboarding, detail cleanup copy, and completion. Repository names, storage keys, native package identifiers, and `app.json` remain Catch until the store-name/icon migration is ready as one release task.
- Full-color Echo art appears only in onboarding value and review completion. Review, Library, Search, detail cleanup, and deletion remain warm-neutral functional surfaces with cobalt actions and signal-lime connection cues.
- Today remains a finite three-group preview and explicitly ends. Review remains the only grouped approval surface; transaction ordering, busy gates, individual decisions, split/regroup, and undo semantics are unchanged.
- Library and Search now use one virtualized vertical list. Library falls back to one column on very narrow screens or large font scale, and every search result opens its item detail.
- Real screenshot previews use `contain` instead of cropping with `cover`. Group stacks render at most two previews plus a count so narrow devices do not clip the third card.
- Sensitive items are excluded from both text searches and empty-query search results using one canonical predicate. Their title, OCR, keywords, summary, source, and image never become search evidence.
- App-only removal and device-photo deletion remain separate. App-only removal now asks for confirmation; device deletion retains its own effect-and-recovery confirmation and native coordinator flow.

## 2026-08-21 — Echo motif language in the three main tabs

- Today, Library, and Search each receive exactly one static logo-derived motif instead of repeating the full Echo Orb or raster logo.
- Today uses the Returning Orbit geometry with the functional cobalt/signal palette. Library uses a compact decorative Memory Core. Search uses a low-opacity aqua/lilac trace reserved inside its intro surface.
- The common masthead is wordmark-only on these three tabs so the content motif and logo glyph do not compete. Other screens keep the normal Echo glyph by default.
- `EchoMotif` is decorative, non-interactive, hidden from accessibility, animation-free, and removed below 340pt or at 160% font scale. It never appears inside screenshot cards, search results, filters, or tab icons.
- Brand-asset colors remain encapsulated inside the motif component. Functional screen source continues to use cobalt, signal lime, warm neutrals, and semantic intent/status colors.

## 2026-08-21 — Echo chromatic product surface v1.2

- The previous one-motif pass was visually too isolated: the page, card, filter, and icon systems still read as the older cream archive. Echo now has a semantic `echoSurface.*` layer derived from aqua, lilac, violet, peach, and pearl rather than importing raw brand colors into screens.
- All main screens share a pearl-lilac canvas with static aqua/lilac/peach atmosphere. Full-color glass, blur, gradients, and continuous motion remain excluded from product surfaces.
- ScreenshotCard and GroupTray use derived recall borders plus a lightweight aqua → lilac → peach reflection rail. Generated mock previews may use a clipped three-primitive orbit; real screenshots and sensitive media are never tinted or overlaid.
- Five intent icons were redrawn as distinct code-native symbols inside one returning-orbit stroke language. Intent labels and semantic colors remain, and selection adds both a primary border and check marker.
- Focused tab icons keep Today/Library/Search destination shapes and gain a derived Echo frame. Cobalt remains CTA/focus/connection, signal lime remains recommendation/completion, and danger/success/sensitive states do not inherit brand colors.
- Full `EchoMotif` remains limited to one per screen. Repeated list cells may use only the lightweight surface accent primitives, with no animation and no accessibility or pointer presence.

## 2026-08-21 — Echo Memory Asset family for Library

- Library mock previews no longer reuse one generic orbit, English keyword string, duplicated title, and intent-colored hero. Content type and save intent are now separate visual systems.
- `EchoMemoryAsset` provides ten code-native content-type variants from the same Returning Orbit, neutral structure, and aqua/lilac/peach reflection grammar. It receives only content type and density, never title, OCR, source, keywords, or intent.
- Compact mock cards show one Korean content-type label and leave the title to card metadata, removing the duplicate title inside the preview. Wide mock previews may show the title once inside the larger stage.
- Sensitive items short-circuit before the asset branch. Real images remain unchanged and never receive an orbit, tint, content illustration, or content-specific fallback.
- The asset family is static, memoized, dependency-free, hidden from accessibility and pointer input, and capped at twelve descendant Views per instance.

## 2026-08-21 — Native photo import and deletion vertical slice

- The Expo/TypeScript app is the authoritative product path. The preserved Swift prototype is no longer the only real PhotoKit importer.
- Onboarding stores the operating system's actual `all`, `limited`, or denied result. A UI preference cannot manufacture limited access; iOS remains authoritative.
- Native photo mode starts from an empty repository. Demo mode alone seeds mock screenshots.
- On app boot and foreground return, the importer queries image metadata from the previous seven days and then checks `MediaSubtype.SCREENSHOT` per iOS asset. The query is not pre-limited before subtype filtering because ordinary photos could otherwise hide screenshots.
- Android uses a conservative screenshot filename heuristic until a localized Screenshots-album or MediaStore-relative-path adapter is validated on physical devices.
- `Asset.id` is the durable media identifier and is stored unchanged in both `imageUri` and `deviceAssetId`. Temporary resolved file paths are not persisted.
- New real screenshots enter the existing local repository as singleton review groups. The current mock analyzer provides a low-confidence `확인 필요` analysis until on-device OCR and visual models replace it.
- Device deletion reuses the existing pending-request transaction and sends the same stored asset ID to `Asset.delete()`. Local tombstoning still happens only after native success.
- App boot, foreground sync, permission denial, limited selection, deduplication, and the import-to-delete identifier chain are covered by unit/integration tests. Physical iPhone system prompts and Photos behavior remain a signed-build release gate.

## 2026-08-21 — Today Hybrid/Peek connection index

- Today is an index into the daily review, not a second review surface. It shows one 220pt featured connection followed by two approximately 100pt compact rows; the existing Review screen retains full content summaries, grouping evidence, structural corrections, and approval actions.
- A horizontal carousel was rejected for this bounded three-group set because it hides the end state and makes comparison, keyboard order, and large-text reading less predictable. The vertical Hybrid/Peek stack keeps all three positions and the finite-end message visible together at 390pt.
- The featured connection keeps one representative image, title, one short connection reason, source/count, and intent. Compact connections keep only representative image, position, title, source/count, and intent. Recommendation badges, full content summaries, duplicated English decoration, and overlapping screenshot stacks stay out of Today.
- At 140% text scale and above every connection becomes an auto-height compact row. Each connection exposes one combined accessibility label instead of reading decorative rails and nested metadata separately.
- If any item is sensitive, presentation short-circuits before representative image, source, or intent selection. The whole group uses generic protected copy and a protected thumbnail, so no real image or inferred metadata is mounted behind an overlay.

## 2026-08-21 — Today content-first finite social feed v2

- The approved Today direction supersedes the Hybrid/Peek featured-plus-compact hierarchy. All visible groups use one identical `RecallPost` rhythm so the screenshot, not the Echo illustration or card chrome, becomes the dominant surface.
- Instagram and TikTok contribute only the familiar content grammar: a compact source row, one large media viewport, horizontal paging within a post, stable metadata below, and a predictable vertical reading order.
- Social-network mechanics remain out of scope: no infinite loading, vertical snap, autoplay, likes, comments, follows, public profiles, view counts, or engagement ranking. Today still ends after at most three groups and explicitly shows an end card.
- Today is read-only. Its top and end CTAs open Review; approval, intent changes, splitting, removal, and device deletion remain Review/detail actions.
- `group.reason` is displayed as `함께 묶인 이유`. It must not be presented as a rediscovery or `why now` model unless that separate signal exists in the domain.
- Demo items without image assets use source-like code-native mock screenshot scenes. Sensitive groups short-circuit before source or media selection.
- Today를 포함한 실제 캡처는 내용 손실과 오해를 막기 위해 `contain`을 유지한다. 데모용 코드 장면만 320pt 피드 프레임을 채우며, 전체 원본 확인은 Review/Detail이 담당한다.

## 2026-08-21 — Warm Editorial Utility functional UI

- The chromatic product-surface experiment is superseded on Today, Library, Search, Review, Detail, filters, cards, and tab icons. Those surfaces use near-white canvas, white cards, warm-grey separators, black text, and cobalt only for primary actions, focus, and links.
- Logo-derived orbit fragments, aqua/lilac/peach reflection rails, multicolor side bars, decorative signal dots, and pastel intent fills are brand assets rather than functional chrome. They remain available only for onboarding, completion, splash, store, marketing, and explicitly branded mockups.
- Intent categories use ordinary distinct symbols plus text. Intent color may appear on the small icon, while selection uses a neutral surface, stronger border, and check marker. Suggested intent uses quiet `제안` metadata instead of a lime recommendation badge.
- `ON DEVICE` becomes plain Korean `기기 내 처리`; dates and counts use secondary ink instead of primary blue. Functional AI value is expressed through the grouped result, factual summary, and observable evidence, not a decorative visual language.
- Any group containing a sensitive item short-circuits title, source, summary, reason, intent, and media presentation before child values are selected. The visual cleanup must not weaken the existing privacy boundary.

## 2026-08-22 — User-supplied evaluation screenshots

- The generated photography placeholders were discarded after the user clarified that real captures include the complete app chrome, text, comments, product context, and status bars. Nine supplied captures now serve as local evaluation fixtures for video, onboarding, shopping, social, document, ad, and live-commerce surfaces.
- Mock data references these captures through `mock-photo://` sentinels. Static `require` mapping stays in the presentation layer, while repository fixtures remain plain serializable data and keep their `mock-asset-*` device identifiers.
- Sensitive presentation short-circuits before bundled asset lookup or image mount. No sensitive fixture receives a bundled sample photo.
- The transit capture exposing a precise home-to-station address is deliberately excluded from the application bundle. It remains only a sensitivity test case concept.
- User-supplied evaluation captures use `contain` so the product does not hide or misrepresent the source screen. They contain third-party brands, people, and public account content, so they are not rights-cleared release assets and must not ship to App Store builds without replacement or permission.
- A fail-closed `release:check` and EAS pre-install hook block release builds while evaluation images remain. The ordinary verification path also rejects evaluation JPEGs that still contain EXIF metadata.

## 2026-08-22 — Detail as an original viewer and personal capture record

- Detail keeps the factual content summary, then adds a quiet `이 장면의 기록` table rather than model confidence, streaks, charts, or engagement metrics.
- The first release computes only facts already stored locally: exact capture time, active capture total and start date, same-intent count, same-source count, and exact group membership count.
- View counts, last-opened time, topic frequency, and inferred similarity history stay hidden until a dedicated local event or similarity record exists.

## 2026-08-22 — Useful recall policy v1

- Recall is a separate read model, not a flag on `ScreenshotGroup` and not an inference from daily review progress.
- Only explicit local `RecallInteraction` events can establish shown, opened, snoozed, dismissed, completed, expired, or restored state.
- `aged_out` means outside an intent's default recommendation window, not deleted or expired. It can return only through an exact entity plus a second observable matching signal and never beyond the intent hard limit.
- Explicit completion, expiry, dismissal, active snooze, sensitive state, and non-saved lifecycle cannot be bypassed by similarity.
- One `DailyRecallSnapshot` fixes at most three candidates for a local day. Invalidated candidates disappear without silently refilling the feed.
- User-facing reasons are assembled from reason codes and safe observable evidence. Internal score, OCR raw text, vectors, and hidden model reasoning are never shown.
- `원본 크게 보기` opens a neutral full-screen viewer using the original `imageUri`. It preserves `contain`, supports 1–4× controls on every platform, iOS pinch zoom, and scrolling after enlargement.
- Sensitive presentation short-circuits before media resolution and capture-history calculation. Sensitive detail never mounts the original asset or exposes title, source, timestamp, or aggregate counts.

## 2026-08-22 — Third Signal action draft v1

- Product behavior is modeled from repeated captures, not MBTI or inferred personality. Three approved related captures are a minimum signal, not a sufficient condition by themselves.
- `third-signal-v1` requires one approved non-superseded group, three unique saved non-sensitive items, one final intent, distinct evidence, confidence at least 0.72, and an intent-specific useful time span.
- The user-facing moment is `이어 볼까요?`: one factual headline, one reason, one unified real-screenshot triptych, one intent-specific primary action, and `그대로 보관`.
- Intent maps to exactly one draft type: want → product decision, reference → reference board, read → article brief, share → share pack. Keep remains ordinary storage/recall.
- The first qualifying three captures form a stable fingerprint. A fourth capture does not create a second suggestion for the same approved group.
- Accept/dismiss is recorded locally in schema v5. The event stores the suggestion ID and timestamp, not OCR, image data, embeddings, entity contents, hidden reasoning, or analytics payloads.
- Designly creative strategy and composition preflight establish one focal triptych and neutral editorial hierarchy. AI motifs, gradients, floating card stacks, three simultaneous artifact options, infinite feed, and automatic external effects are excluded.

# 2026-08-22 — Icon-only primary navigation

- 하단 순서는 `Library / Today / Search`로 바꾸되 앱의 초기 route는 Today로 유지한다.
- 가운데 stack-check는 독립 실행 버튼이 아니라 Today 목적지다. 실제 리뷰 시작·재개는
  Today의 상태 설명과 disabled/error recovery를 가진 기존 CTA가 담당한다.
- visible tab label은 숨기고 `보관함`, `오늘의 스크린샷 정리`, `찾기` 접근성 이름을
  유지한다.
- 아이콘은 Phosphor React Native를 canonical family로 사용하고, Echo full-color Orb와
  custom View drawing은 하단 내비게이션에서 제거한다.

## 2026-08-29 — Web-first validation slice

- 제품 전체를 웹으로 대체하지 않고 `직접 선택 → 묶음 리뷰 → 보관 → 다시 찾기`의 핵심
  가치 검증을 웹의 첫 vertical slice로 정한다.
- 웹은 사용자의 사진 보관함을 자동 탐색할 수 없으므로 전체/제한 사진 권한을 흉내 내지
  않는다. 온보딩은 최대 6장의 PNG/JPG/WebP 직접 선택과 로컬 데모를 먼저 제공한다.
- 직접 선택한 이미지는 최대 1000px WebP로 브라우저 안에서 축소하고 기존 로컬 저장 계층에
  넣는다. 이 경로에서 원본 서버 업로드나 자동 외부 공유는 없다.
- 첫 웹 업로드는 실제 OCR·민감정보 탐지·콘텐츠 분류가 아니다. 직접 고른 같은 배치 안에서
  `확인 필요` 묶음으로만 준비하며, 비민감 테스트 캡처만 선택하라는 경계를 온보딩에 노출한다.
- 웹에서는 알림 시간을 약속하지 않는다. 직접 선택 또는 데모 진입 때 `나중에 설정`을 저장하고
  알림 시간 화면을 건너뛴다.
- 웹 상세에서는 `기기 사진에서도 삭제`를 숨긴다. Echo에서 제거해도 사용자의 원본 파일은
  그대로 남는다고 명시한다.
- 760px 이상 웹 화면은 상단 탭 내비게이션과 라벨을 사용한다. 보관함은 최대 920px, 3열까지
  확장하지만 Today와 Review는 60초 묶음 검토의 집중도를 위해 480px 읽기 폭을 유지한다.
- 웹으로 자동 감지, iOS 제한 권한, 백그라운드 실행, 기기 원본 삭제, App Store 카테고리
  적합성을 검증했다고 주장하지 않는다. 이 항목들은 네이티브 단계의 별도 release gate다.

## 2026-09-01 — Mobile web photo selection contract

- 모바일 웹은 사진 전체 접근 권한이나 설정 복구 경로를 제공하는 것처럼 표현하지 않는다.
  온보딩과 Today 첫 화면에서 시스템 사진 선택기를 열고 사용자가 고른 항목만 받는다고 설명한다.
- Today의 웹 빈 상태와 상단 선택 카드는 모두 같은 사진 선택 동작을 호출한다. 기존 선택 결과만
  다시 동기화하는 버튼을 새 사진 발견 동작처럼 노출하지 않는다.
- 모바일 Safari의 사용자 활성화 제한을 지키기 위해 파일 선택기는 버튼 이벤트 안에서 비동기
  저장소 읽기보다 먼저 연다. 임시 file input은 DOM에 연결하고 change/cancel을 우선 처리한 뒤
  focus 복귀를 보수적 fallback으로 사용하며 항상 제거한다.
- 웹에서 새 스크린샷 자동 감지가 필요하면 네이티브 앱 범위로 다룬다. 웹은 최대 6장의 명시적
  선택, 브라우저 로컬 처리, 선택 결과 안내까지만 약속한다.
