# 06. Component Specifications

## 2026 design-system primitives

### `BrandMark`

- 열린 괄호와 signal 점으로 `잡아둔 장면을 다시 꺼냄`을 표현한다.
- 시작 화면과 화면 masthead에서만 사용한다.

### `SectionHeading`

- `01 / CURATED FOR TODAY` 같은 작은 인덱스, 제목, 한 줄 설명으로 구성한다.
- 숫자는 정보 구조를 위한 것이며 성과·스트릭처럼 강조하지 않는다.

### `CobaltThread`

- 완료·초점 같은 단일 순간에만 허용되는 제한적 브랜드 단서다.
- 반복 카드, 필터, 탭 아이콘, 날짜, 상태 라벨에는 사용하지 않는다.

### `Curator's Tray`

- 기존 `GroupTray`의 2026 시각 형태다.
- 대표 장면 1장과 관련 장면 2장을 포개고, 연결 이유와 intent를 이미지 아래에 둔다.
- Today의 기본 셀에서는 사용하지 않는다. 묶음 생성·분리 설명 또는 Review의 단일 집중 화면에 제한한다.
- `featured`, `standard`, `sensitive`, `loading`, `empty` 상태를 갖는다.

### `TodayFeedHeader`

- Echo wordmark, 중립 날짜, 유한한 묶음 수, 진행 문구, Review CTA, 중립 intent count 목록으로 구성한다.
- compact intent 항목은 탐색 상태와 장수만 표현하며 사용자·프로필·스토리를 뜻하지 않는다.
- 시작/이어하기 외에는 Today에서 데이터를 변경하지 않는다.

### `RecallPost`

- Today의 세 묶음에 동일한 시각 위계를 적용한다.
- 출처 행, 큰 `ScreenshotPager`, page dots, 제목, `함께 묶인 이유`, intent metadata 순서다.
- 묶음의 `reason`은 그룹화 단서만 설명하며 `summary`나 별도 재추천 근거를 대신하지 않는다.
- 카드 전체는 읽기 전용이다. 승인, 분류 변경, 삭제는 Review에서만 가능하다.
- 민감 묶음은 이미지 source, 출처, 제목, intent를 선택하기 전에 전체를 보호 문구로 치환한다.
- pager는 `adjustable` 접근성 요소로 현재 `1/N`을 읽고 이전·다음 action을 제공한다.

### `MockScreenshotScene`

- 데모 데이터에 실제 이미지가 없을 때만 상품·기사·소셜·UI 화면처럼 보이는 코드 기반 장면을 만든다.
- Echo 로고나 orbit 장식을 반복하지 않고, 저장된 원본 화면이 주인공인 상태를 모사한다.
- 실사진과 민감 항목에는 적용하지 않는다.

### `BundledEvaluationCapture`

- 사용자가 제공한 실제 스크린샷은 `mock-photo://` sentinel과 정적 asset map으로만 연결한다.
- 평가용 실제 화면을 보여주되 PhotoKit/MediaStore의 사용자 기기 asset처럼 취급하지 않는다.
- 실제 캡처는 화면 정보 손실을 막기 위해 Library grid를 포함해 항상 `contain`으로 표시한다.
- 민감 항목은 asset lookup과 이미지 mount 전에 보호 화면으로 short-circuit한다.
- 평가 캡처 위에 텍스트·배지·브랜드 필터를 덮지 않는다.
- 제3자 브랜드·인물·계정이 포함된 캡처는 로컬 평가 전용이며 release asset으로 승격하지 않는다.

## 1. `ScreenshotCard`

### Variants

- `grid`
- `review`
- `hero`
- `searchResult`
- `sensitive`
- `longCapture`
- `selected`

### Props

- `imageUri`
- `aspectRatio`
- `title`
- `source`
- `capturedAt`
- `intent`
- `contentType`
- `sensitive`
- `selected`
- `longCapture`
- `onPress`
- `onSelect`

### Rules

- 이미지 위에 텍스트를 덮지 않는다.
- 긴 캡처는 최대 높이 후 페이드 또는 `긴 캡처` 라벨.
- 민감 상태에서는 기본 블러.
- 선택 상태는 primary 테두리와 체크 아이콘.

## 2. `IntentChip`

### Props

- `intent`
- `selected`
- `count`
- `compact`
- `suggested`

### Rules

- 아이콘 + 텍스트
- 아이콘은 20×20 viewBox, 2px round stroke의 로컬 vector set을 14/16/18pt로 축소해 사용
- 흰 면과 회색 테두리를 기본으로 하며 intent 색은 작은 아이콘에만 허용
- `suggested`는 강조 배지 대신 작은 `제안` 메타데이터
- 선택된 칩은 `제안`을 숨기고 동일한 vector 문법의 check를 표시
- 카테고리 색만으로 선택 상태를 전달하지 않음

## 3. `GroupTray`

### Purpose

AI가 묶은 유사 스크린샷을 표시.

### Props

- `items`
- `groupTitle`
- `suggestedIntent`
- `sourceSummary`
- `summary`
- `reason`
- `onApproveAll`
- `onReviewIndividually`
- `onChangeIntent`

### Visual

최대 3개 썸네일을 6~10pt씩 겹쳐 표현. 실제 장수가 더 많으면 `+N`.

- 카드 외곽은 1px 중립 테두리와 흰 면을 사용한다.
- 삼색 세로선, reflection rail, orbit corner, signal 점은 사용하지 않는다.
- 민감 항목이 하나라도 있으면 제목·출처·요약을 보호 문구로 먼저 치환한다.

## 3-1. `SummaryBlock`

- `내용 요약`은 개별 확인의 원본 이미지와 제목 아래에만 표시한다.
- `묶음 요약`은 묶음의 내용을 1문장으로 설명한다.
- `묶은 근거`는 내용 요약과 반복하지 않고 그룹화 신호를 설명한다.
- 요약 라벨과 근거 구분선은 중립색을 사용하며 AI 전용 컬러 블록처럼 보이지 않게 한다.
- 민감 항목이 하나라도 포함되면 OCR·제목·요약·근거 대신 보호 문구만 표시한다.
- 요약이 없거나 분석에 실패해도 리뷰 흐름을 막지 않고 블록만 생략한다.
- 개별 요약에는 `화면의 글자에서 정리` 또는 `화면의 모습에서 정리`를 작은 메타데이터로 표시한다.
- `확인한 단서`는 원본에서 관찰 가능한 문구나 화면 요소만 최대 3개 표시한다.
- OCR, 임베딩, 모델 점수, 숨은 reasoning 같은 기술·내부 정보는 사용자 화면에 표시하지 않는다.

## 4. `DailyReviewProgress`

- `current`
- `total`
- `estimatedSecondsRemaining`
- 시각적으로 강한 게이지보다 텍스트와 얇은 진행선 사용

## 4-1. `FullscreenScreenshotModal`

- 카드용 thumbnail이 아니라 `imageUri` 원본을 사용한다.
- 전체 화면에서도 `contain`을 유지하고 1–4배 확대·축소·화면 맞춤을 제공한다.
- iOS는 두 손가락 확대와 이동을 지원하고, Web/Android는 확대 버튼과 양방향 스크롤을 제공한다.
- 닫기·확대·축소·화면 맞춤은 모두 44pt 이상이며 제스처 없이도 조작할 수 있다.
- 민감 판정이 asset resolver보다 먼저 실행되며 민감 항목은 원본을 mount하지 않는다.
- Reduce Motion에서는 modal 전환 애니메이션을 사용하지 않는다.

## 4-2. `CaptureHistorySection`

- `capturedAt`과 현재 로컬 item/group 데이터에서 확실히 계산할 수 있는 기록만 표시한다.
- 기본 행은 `캡처한 때`, `보관함 전체`, `이 분류`, `이 출처`다.
- `함께 묶인 장면`은 `supersededAt`이 없는 활성 그룹만 계산한다.
- `함께 묶인 장면`은 실제 group membership이 있을 때만 표시한다.
- 조회 횟수, 마지막 열람, 유사 빈도처럼 아직 저장하지 않는 값은 추측해서 만들지 않는다.
- 민감 항목은 제목·출처·날짜·집계를 모두 보호 문구로 치환한다.

## 5. `ActionDock`

### Actions

- move/change intent
- remind later
- share
- remove

### Rules

- 화면 하단 safe area 반영
- 4개 액션이 모두 필요한 경우 아이콘 + 짧은 라벨
- 위험 액션은 다른 액션과 간격 분리

## 6. `SourceBadge`

- 앱 아이콘 또는 도메인 파비콘
- 출처명
- 작고 중립적인 스타일
- 출처 색상을 UI 메인 컬러로 사용하지 않음

## 7. `SensitiveOverlay`

### States

- fullyBlurred
- partiallyBlurred
- revealed

### Controls

- 길게 누르거나 명시적 버튼으로 보기
- 공유 미리보기에서는 다시 블러가 기본

## 8. `EmptyState`

### Props

- `illustration`
- `title`
- `description`
- `primaryAction?`
- `secondaryAction?`

일러스트는 단순한 카드/스택 기반. AI 캐릭터 금지.

## 9. `UndoToast`

- 제거, 분류 변경, 그룹 병합 후 사용
- 4~6초 노출
- 한 번에 하나의 가장 최근 작업 취소

## 10. `FilterBar`

- 가로 스크롤
- 전체 + 5개 의도
- 선택된 필터는 텍스트, 아이콘, 중립 배경 또는 강한 테두리로 표시
- intent별 파스텔 면과 로고 파생 장식을 반복하지 않음

## 11. `SearchField`

- 일반 검색창 형태
- 챗 UI처럼 보이지 않게 함
- 최근 검색, 추천 검색, 음성 입력은 이후 옵션

## 12. `ShareCard`

### Variants

- `singleDiscovery`
- `dailyThree`
- `weeklyTasteBoard`

### Rules

- 앱 로고는 작게
- 사용자 원본에 없는 설명을 사실처럼 생성하지 않음
- 민감 항목 제외
- 출처 표기는 가능한 경우 유지
