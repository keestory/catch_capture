# 2026 Design Reference Audit

조사일: 2026-08-21  
대상: Expo/React Native/TypeScript 주력 앱  
결론: `Quiet Editorial Archive`를 `Quiet Signal Archive`로 구체화한다.

## Reference map

| Reference | 가져올 패턴 | 가져오지 않을 패턴 |
|---|---|---|
| [Apple Journal](https://apps.apple.com/us/app/journal/id6447391597) | 과거 순간을 먼저 제안하는 구조, 날짜 중심 카드, 사적인 공간의 톤 | 스트릭, 글쓰기 부담 |
| [Apple Photos](https://support.apple.com/guide/iphone/browse-your-photo-collections-iph4f36c4148/26/ios/26) | 이미지 우선 타일, 익숙한 Library·Collections·Search 계층 | 범용 사진첩 복제 |
| [Apple Invites](https://apps.apple.com/us/app/apple-invites/id6472498645) | 이미지 아래 정돈된 정보, 동심원형 반경 | 이미지 위 텍스트 오버레이 |
| [Apple Freeform](https://apps.apple.com/us/app/freeform/id6443742539) | 2~3장의 시각적 스택과 무드보드 구성 | 무한 캔버스 |
| [mymind](https://apps.apple.com/us/app/mymind-extend-your-mind/id1520332347) | private garden 톤, 분류 부담 없는 저장, Serendipity | 마법적 AI 카피와 추상적 가치 제안 |
| [Are.na](https://apps.apple.com/us/app/are-na/id1299153149) | 얇은 UI, 광고 없는 레퍼런스 보관, 장식 없는 카운트 | 공개 프로필·댓글·협업 |
| [Cosmos](https://apps.apple.com/kr/app/cosmos-%EA%B2%80%EC%83%89%EA%B3%BC-%EB%B0%9C%EA%B2%AC/id1577975475) | 이미지가 점유하는 탐색 리듬, 유사 이미지 이동 | 공개 무한 피드와 외부 이미지 추천 |
| [Pinterest](https://apps.apple.com/kr/app/pinterest-lifestyle-ideas/id429047995) | 대표 이미지와 겹친 항목 수, 시각적 비교 | 광고·좋아요·팔로우·무한 스크롤 |
| [Pixel Screenshots](https://support.google.com/pixelphone/answer/15312581?hl=en) | 관련 제안 다음의 짧은 action chip, 자동 제목 | 검색창 중심 홈, 긴 AI 설명 |
| [Captr](https://apps.apple.com/kr/app/captr-screenshot-organizer/id6738889624) | Daily Feed와 관련 추천을 경쟁 기준으로 사용 | 범용 AI 피드, 숨겨진 일괄 승인 |
| [ShotBox](https://apps.apple.com/kr/app/%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7-%EC%A0%95%EB%A6%AC-shotbox/id6778151814) | 로컬 처리 상태, 주간 리뷰, 권한 전 신뢰 설명 | 대시보드형 스마트 카테고리 나열 |
| [Readwise](https://apps.apple.com/us/app/readwise/id1476885528) | 유한한 Daily Review, 진행 위치, 예상 시간, themed connections | 스트릭과 놓친 날짜 강조 |
| [Instagram](https://apps.apple.com/kr/app/instagram/id389801252) | 큰 미디어, 익숙한 세로 리듬, 캐러셀 위치, 미디어 아래 일정한 행동 위치 | 무한 피드, 좋아요·댓글·조회 수, 공개 프로필·팔로우, 자동 재생 |
| [Whatnot](https://apps.apple.com/us/app/whatnot-shop-sell-connect/id1488269261) | 한 화면 한 대상, 현재 상태, 고정 Action Dock, 상세의 단계적 공개 | LIVE·채팅·카운트다운·경매 긴박감·FOMO |

## Platform guidance applied

- [Apple HIG — Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars): 탭은 `오늘·보관함·찾기` 세 개의 최상위 탐색만 담당한다.
- [Apple HIG — Materials](https://developer.apple.com/design/human-interface-guidelines/materials): 콘텐츠 카드에는 Liquid Glass를 쓰지 않는다. 내비게이션과 임시 컨트롤 계층에만 제한한다.
- [Apple HIG — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility): 44pt 터치 영역, 큰 글자, 색 이외의 상태 단서를 유지한다.
- [Apple HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout): 핵심 정보와 캡처 이미지를 장식보다 먼저 배치한다.

## Decisions

### Keep

- 따뜻한 종이색 canvas와 검은 ink
- 5개 intent와 아이콘+텍스트 병행
- Today·Library·Search 3탭
- 일괄 승인, 예외만 수정
- 로컬 처리·민감 가림·삭제 구분

### Change

- 홈의 주인공을 `오늘 들어온 캡처 수`에서 `오늘 다시 볼 세 묶음`으로 변경
- 모든 카드에 반복되던 둥근 테두리를 줄이고 Curator's Tray에만 강한 외곽 형태 사용
- 일반적인 파란 CTA는 signal lime을 쓰는 핵심 리뷰 진입과 cobalt 포커스로 역할 분리
- 자동 제안의 이름을 `AI 추천`에서 `연결 단서`로 변경
- Unicode 탭 기호를 코드로 그린 일관된 선형 glyph로 교체
- 실제 URI가 들어오면 mock visual 대신 원본 thumbnail을 우선 렌더링

### Never

- 무한 추천 피드
- 공개 프로필, 좋아요, 팔로우
- 보라색 AI 그라데이션, 마법봉, 챗봇 입력창
- 캡처 위 제목·의도·버튼 오버레이
- 스트릭, 죄책감 카피, 정리하지 못한 수를 강조하는 빨간 배지
- 민감 캡처 자동 노출·자동 공유

### Finite Recall Feed translation

- Today는 Instagram의 이미지 중심 문법을 사용하지만 최대 세 묶음 뒤 `오늘 추천 끝`을 보여준다.
- Review는 Whatnot의 pinned-item 명료성을 사용하지만 거래·경쟁·시간 압박 없이 한 묶음의 승인에만 집중한다.
- Library는 개인 보관함이며 Explore나 marketplace 추천을 섞지 않는다.
- 세부 IA, wireframe, 접근성·성능 안전선은 [Finite Recall Feed PRD](./12_FINITE_RECALL_FEED_PRD.md)를 따른다.

## Signature components

- `BrandMark`: 열린 괄호와 signal 점으로 ‘잡아두고 다시 꺼냄’을 표현
- `CobaltThread`: 관련 장면 사이의 2px 연결선
- `Curator's Tray`: 대표 캡처와 관련 캡처 2장을 포갠 유한한 묶음
- `ConnectionReason`: 관련 근거를 signal surface에 한 줄로 표시
- `IntentChip`: 색상과 아이콘과 텍스트를 함께 사용
- `SectionHeading`: 숫자 인덱스, 제목, 짧은 설명으로 에디토리얼 리듬 형성
- `ActionDock`: 주요 행동 하나와 보조 행동만 제공

## Validation boundary

이 문서는 공개 제품의 UI 패턴과 공식 설명을 비교한 디자인 판단이다. 경쟁 제품의 다운로드·매출·리텐션이나 Catch-Capture의 PMF를 입증하지 않는다. 실제 효용은 `잊었지만 유용한 과거 캡처`가 후속 행동으로 이어지는지 별도 코호트에서 검증한다.
