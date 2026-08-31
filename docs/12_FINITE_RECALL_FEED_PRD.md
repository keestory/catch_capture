# 12. Finite Recall Feed Redesign PRD

상태: Today 세로 피드 구현 · Review 상세 전환 유지  
작성일: 2026-08-21  
대상: Expo / React Native / TypeScript 모바일 앱

## 1. 한 줄 결정

> Instagram처럼 익숙하게 넘기고, Whatnot처럼 한 가지 행동에 집중하지만, 세 묶음 뒤에는 반드시 끝나는 개인 피드를 만든다.

새 화면 콘셉트의 이름은 `Finite Recall Feed`다. 외형은 콘텐츠 중심 세로 피드에서 배우되 제품의 목적은 체류가 아니라 `60초 안에 오늘의 정리를 끝내고, 잊은 캡처를 다시 쓰게 하는 것`이다.

## 2. 왜 바꾸는가

현재 `Curator's Tray`는 묶음과 연결을 잘 설명하지만 첫 사용자가 다음 행동을 즉시 이해하기에는 에디토리얼 장치가 많다. 사용자는 이미 Instagram의 세로 피드와 미디어 아래 행동 문법에 익숙하며, Whatnot은 한 화면에서 한 대상과 한 CTA에 집중시키는 정보 위계가 강하다.

이번 개편은 다음 문제를 해결한다.

- 스크린샷이 UI보다 먼저 보이게 한다.
- `무엇인지 → 왜 함께 묶였는지 → 어디서 정리할지`를 한 화면에 담는다.
- Today 미리보기와 Review 결정을 명확히 분리한다.
- 요약·판단 근거·의도 변경을 상세 진입 없이 이해하게 한다.
- 끝이 보이는 구조로 정리 부담을 낮춘다.

## 3. 레퍼런스에서 배울 것과 버릴 것

조사 기준은 2026-08-21 현재 공개 제품 설명과 공식 화면이다. Instagram은 피드·스토리·릴스·탐색을 통해 관계와 관심사 콘텐츠를 순환시키고, Whatnot은 라이브 영상·현재 상품·거래 CTA를 한 화면에 결합한다. [Instagram App Store](https://apps.apple.com/kr/app/instagram/id389801252), [Whatnot App Store](https://apps.apple.com/us/app/whatnot-shop-sell-connect/id1488269261), [Whatnot 공식 화면](https://blog.teamwhatnot.com/united-kingdom-blog/the-future-of-shopping)

| Reference | 차용할 패턴 | Catch식 번역 | 가져오지 않을 패턴 |
|---|---|---|---|
| Instagram Feed | 한 방향 세로 흐름, 큰 미디어, 미디어 아래 일정한 행동 위치, 캐러셀 위치 표시 | 큰 스크린샷, 묶음 내 좌우 넘김, 항상 같은 위치의 요약·행동 | 좋아요·댓글·팔로워·조회 수, 외부 추천, 무한 스크롤 |
| Instagram Favorites | 사용자가 중요한 대상을 다시 통제하는 피드 | `다시 볼 묶음`, `중요한 연결` | 공개 계정·프로필 중심 분류 |
| Whatnot Live | 한 화면 한 대상, 명확한 현재 상태, 고정 Action Dock, 상세는 시트로 분리 | 한 묶음 Focus Mode, `1 / 4`, 고정 승인 버튼, 근거 펼침 시트 | LIVE 배지, 채팅, 카운트다운, 경매 긴박감 |
| Whatnot Browse | 목적·카테고리별 빠른 전환 | 5개 intent filter, 콘텐츠 유형 보조 필터 | 판매량·인기·실시간 랭킹 |
| Whatnot Confirmation | 거래 CTA와 고위험 행동의 명확한 구분 | 일반 승인은 탭, 기기 사진 삭제만 별도 확인 | 스와이프 입찰, 충동을 유도하는 FOMO |

Instagram은 피드를 친구·관심사 발견과 공유에 사용한다고 설명하고, Whatnot은 라이브·경매·채팅·마켓플레이스를 결합한 쇼핑을 핵심 가치로 둔다. 이 리텐션 동기는 Catch에 이식하지 않는다. Catch의 리텐션은 `짧게 들어와 잊은 자료를 되찾고 안심하며 나가는 경험`이어야 한다.

## 4. 제품 원칙

### 4.1 Feed is finite

- Today의 추천 미리보기는 최대 3묶음이다.
- 마지막에는 항상 `여기까지 보면 오늘은 끝이에요`가 보인다.
- 새로고침으로 외부 추천이나 끝없는 과거 캡처를 추가하지 않는다.
- 리뷰 도중 생긴 새 캡처는 현재 큐에 끼워 넣지 않는다.

### 4.2 Screenshot is the hero

- 화면 높이의 45~58%를 대표 스크린샷에 사용한다.
- 제목·버튼·의도는 이미지 위에 겹치지 않는다.
- 긴 캡처는 상단 미리보기와 `전체 보기`로 분리한다.

### 4.3 One card, one decision

- Today 카드는 `리뷰 시작` 전까지 상태를 바꾸지 않는다.
- Review 카드의 Primary action은 한 개만 둔다.
- 의도 수정·하나씩 보기·관련 없음은 보조 행동으로 둔다.
- 공유와 기기 삭제는 리뷰 승인과 섞지 않는다.

### 4.4 Evidence, not AI theater

- `AI 추천` 대신 `연결 단서`, `화면의 글자에서 정리`를 사용한다.
- 숫자 confidence, 마법 아이콘, 긴 모델 설명을 표시하지 않는다.
- 요약 근거는 원본에서 확인 가능한 단서만 최대 3개다.

### 4.5 Private by default

- 민감 항목은 피드에서도 이미지·제목·요약·단서를 함께 가린다.
- 민감 항목은 원본이나 thumbnail을 뒤에 두고 blur하지 않는다. reveal 전에는 이미지 source 자체를 cell tree·prefetch·접근성 트리에 전달하지 않는다.
- 회사·대화 캡처는 외부 공유 기본 제외다.
- 조회 수, 인기, 타인의 행동 같은 사회적 증거를 만들지 않는다.

## 5. 핵심 사용자 루프

```text
새 스크린샷 감지
  ↓
Today: 오늘의 연결 3묶음 미리보기
  ↓ 리뷰 시작
Review: 한 묶음씩 확인하고 일괄 승인
  ↓
완료: 여기까지, 오늘 정리 끝
  ↓
Library / Search: 과거 장면 재발견
  ↓
공유·읽기·구매 후보 비교·업무 참고
```

피드는 `Today → Review` 진입 비용을 낮추는 표현 방식이다. 보관과 수정은 기존 repository transaction을 사용하며 피드 자체가 새로운 소셜 데이터 모델이 되지 않는다.

## 6. 정보 구조

하단 탭은 유지한다.

1. `오늘` — 최대 3개의 연결 미리보기와 일일 리뷰 진입
2. `보관함` — 의도별 개인 아카이브
3. `찾기` — 기억 단서 기반 검색과 유사 장면 후보

화면별 역할은 다음처럼 분리한다.

| 화면 | 사용자 질문 | 주요 행동 | 레퍼런스 역할 |
|---|---|---|---|
| Today | 오늘 무엇을 보면 되지? | 리뷰 시작 | Instagram의 익숙한 세로 탐색 |
| Review | 이 묶음을 어디에 둘까? | 묶음 승인 | Whatnot의 한 대상 Focus Mode |
| Library | 전에 저장한 장면은 어디 있지? | 필터·상세 진입 | Instagram grid의 빠른 시각 탐색 |
| Search | 정확히 기억나지 않는데 찾을 수 있나? | 결과 열기 | Explore의 시각 탐색을 private index로 변환 |
| Detail | 이 장면은 무엇이고 무엇을 할 수 있지? | 수정·원본 보기·정리 | Feed post detail + 안전한 action sheet |

## 7. 화면 기획

### S10. Today — finite preview feed

목표: 앱을 연 뒤 3초 안에 오늘 볼 양과 첫 장면을 이해한다.

```text
┌────────────────────────────┐
│ CATCH             8월 21일 │
│ 오늘 함께 볼 3묶음 · 42초  │
│ [오늘 정리 시작]           │
├────────────────────────────┤
│ 오늘의 연결 01       2장   │
│ KREAM · 4시간 전           │
│ ┌────────────────────────┐ │
│ │                        │ │
│ │   대표 스크린샷        │ │
│ │                        │ │
│ └────────────────────────┘ │
│ ● ○                        │
│ 같은 장바구니 UI예요       │
│ 화면 구성과 문장이 같아요   │
│ [참고 · 제안]  [자세히]    │
├────────────────────────────┤
│ 오늘의 연결 02 ...         │
├────────────────────────────┤
│ 여기까지 보면 오늘은 끝이에요│
└────────────────────────────┘
```

규칙:

- Today에서는 승인·삭제하지 않는다.
- 세 카드 모두 같은 정보 순서와 행동 위치를 유지한다. 화면 비율에 따라 미디어 높이는 달라도 요약과 `왜 지금`을 숨기지 않는다.
- 묶음 안 이미지는 좌우로 넘기되, 다음 묶음은 세로로 이동한다.
- 화면 상단과 마지막 End Card 양쪽에서 리뷰를 시작할 수 있다.
- 진행 중인 리뷰가 있으면 CTA를 `1 / 4부터 이어서 정리`로 바꾼다.
- `onEndReached`로 항목을 추가하지 않으며 마지막은 spinner가 아니라 End Card다.

### S20. Review — focus decision feed

목표: 각 묶음을 상세 화면 없이 5~10초 안에 승인한다.

```text
┌────────────────────────────┐
│ ×      1 / 4       약 35초 │
├────────────────────────────┤
│ 같은 검정 러닝화      3장  │
│ Instagram · 오늘 12:41     │
│ ┌────────────────────────┐ │
│ │ 대표 스크린샷          │ │
│ └────────────────────────┘ │
│ ● ○ ○          1 / 3      │
│                            │
│ 묶음 요약                  │
│ 검정 러닝화의 상품·사이즈· │
│ 착용 화면을 이어서 저장했어요│
│                            │
│ 연결 단서 2 〉             │
│ [참고][사고 싶음][공유]... │
├────────────────────────────┤
│ [모두 사고 싶음으로 보관] │
│ 하나씩 확인 · 다르게 분류  │
└────────────────────────────┘
```

규칙:

- Action Dock은 safe area 위에 고정한다.
- Primary CTA는 현재 선택 intent를 문장으로 읽는다.
- 좌우 스와이프는 묶음 안 항목 이동에만 사용한다.
- 묶음 승인에 위·아래 스와이프를 사용하지 않는다.
- `연결 단서`는 기본 접힘, 저신뢰 항목에서는 기본 펼침을 실험할 수 있다.
- 삭제 제스처는 숨은 단독 경로로 만들지 않고 버튼·확인을 함께 제공한다.

### S23. Complete — finite end

- `오늘의 정리가 끝났어요.`
- `12장을 4개의 묶음으로 보관했어요.`
- `방금 보관한 장면 다시 보기`
- Primary: `보관함 보기`
- Secondary: `닫기`
- 스트릭, 연속 방문 일수, 놓친 날을 표시하지 않는다.

### S30. Library — private visual grid

- 상단: `보관함`, 저장 항목 수, 검색 진입
- 첫 줄: `전체 · 참고 · 사고 싶음 · 공유 · 읽기 · 간직`
- 본문: 동일 높이의 2열 grid를 유지한다. Instagram profile grid보다 셀을 크게 두어 긴 캡처와 문서 가독성을 보존하며 masonry처럼 높이가 제각각인 배치는 사용하지 않는다.
- 빠른 탐색을 위해 날짜 sticky header를 허용한다.
- 카드에는 이미지·intent·짧은 제목·출처만 보이고 요약은 상세에서 펼친다.
- 선택 모드는 길게 누르기와 명시적 `선택` 버튼을 모두 제공한다.
- 긴 캡처는 `contain`과 고정 미디어 높이를 사용하고 전체 화면 상세에서만 원본 비율로 확장한다.

### S40. Search — private explore

- 첫 고관련 결과는 큰 카드, 나머지는 2열 grid다.
- `왜 맞는지`를 `상품명 · Instagram · 사고 싶음`처럼 표시한다.
- 이미지 유사도 결과는 `비슷한 장면`으로 명확히 구분한다.
- 외부 인기 콘텐츠나 광고를 섞지 않는다.
- 검색 결과는 유한하며 `N개 결과`와 끝을 보여준다.

### S50. Detail — post detail without social chrome

정보 순서:

1. 출처·캡처 시각·민감 상태
2. 원본 스크린샷
3. intent와 제목
4. 내용 요약
5. 요약 방식·확인 단서
6. 관련 캡처
7. 컬렉션·공유·완료
8. `Catch에서만 제거` / `기기 사진에서도 삭제`

삭제 영역은 일반 action dock과 시각적으로 분리한다. 기기 삭제에는 Whatnot의 거래 확정처럼 의도적 마찰을 주되, 긴박한 카피나 스와이프 입찰을 모방하지 않는다.

## 8. 핵심 컴포넌트

### 신규

- `FiniteFeedHeader`: 날짜, 묶음 수, 예상 시간, 시작/이어하기
- `RecallPost`: 출처 행 + screenshot pager + 요약 + intent metadata
- `ScreenshotPager`: 2~4장의 원본, 페이지 점, `1 / N`
- `ConnectionReasonStrip`: 왜 같은 묶음인지 한 문장
- `EvidenceDisclosure`: 확인한 단서 수와 펼침
- `FocusActionDock`: 현재 intent가 포함된 Primary CTA 하나
- `FiniteEndCard`: 피드 종료와 다음 행동
- `SensitiveRecallCover`: 이미지·요약·접근성 원문을 함께 가림

### 유지·수정

- `SummaryBlock`: 카드 안에서 더 짧게, 상세에서 근거까지 표시
- `IntentChip`: 선택 상태와 제안 상태를 분리
- `ScreenshotCard`: Library/Search 전용으로 축소
- `Curator's Tray`: 홈의 기본 카드가 아니라 묶음 생성·분리 설명에 제한
- `CobaltThread`: 같은 묶음의 페이지 점·근거 연결에만 제한

## 9. 시각 시스템

기존 `Quiet Signal Archive` token은 유지한다.

- Canvas: 따뜻한 중립색
- Media: edge-to-edge가 아니라 16pt 안전 여백 안에서 최대화
- Card: 반복되는 큰 radius와 그림자를 줄이고 구분선 중심
- Primary cobalt: 선택·포커스·주요 CTA
- Signal lime: 연결 이유, 완료, 유한한 끝에만 사용
- Intent color: chip·아이콘·얇은 line에만 사용
- 타이포그래피: 출처 12–13, 제목 17, 요약 15, 화면 제목 30

Instagram의 검정/흰색 social chrome이나 Whatnot의 노랑·검정 LIVE 톤은 복제하지 않는다. 사용자가 저장한 스크린샷이 가장 강한 색을 가져야 한다.

## 10. 인터랙션과 모션

- 묶음 내 이미지 전환: 180–220ms, page indicator 동기화
- 카드 승인: 저장 transaction 성공 뒤 180–220ms opacity·scale 전환으로 다음 묶음에 focus
- 근거 펼침: 180ms opacity + height, Reduce Motion에서는 즉시
- 완료: End Card로 자연스럽게 이동, confetti 금지
- 앱 재진입: Today/Review의 이전 scroll·item 위치 복원
- 길게 누르기만 가능한 핵심 기능은 두지 않는다.
- Reduce Motion에서는 위치·scale 이동을 제거하고 즉시 전환 또는 짧은 crossfade만 사용한다.
- 자동 재생, parallax, continuous pulse, 강제 full-screen snap을 사용하지 않는다.

## 11. 상태 설계

### Loading

- 이미지 비율을 예약한 skeleton
- 로딩 중 카드 높이 변화 최소화

### Empty

- `오늘은 새로 주운 장면이 없어요.`
- 보조 행동: `최근 보관함 둘러보기`

### Offline

- 로컬 캡처·OCR 결과는 계속 표시
- 원격 링크 후보만 `연결되면 확인할게요`로 분리

### Analysis failed

- 실패 항목 한 장만 재시도
- 나머지 리뷰는 계속 가능

### Sensitive

- 이미지·제목·요약·단서·VoiceOver 원문을 함께 보호
- 공유·원본 링크 열기 전 재확인

### Long capture

- 미디어 최대 높이 제한
- `긴 캡처 · 전체 보기` 제공

## 12. 접근성·성능 조건

- 모든 action은 최소 44×44pt다.
- 이미지 설명 → 출처/시간 → 요약 → intent → CTA 순서로 읽는다.
- 색만으로 intent·선택·민감 상태를 전달하지 않는다.
- Dynamic Type에서 Action Dock은 2줄까지 허용하고 가려지지 않는다.
- Reduce Motion에서 모든 승인·pager 흐름이 유지된다.
- Today는 최대 3카드라 단순 list로 충분하지만, Library/Search는 virtualization과 thumbnail cache가 필수다.
- Library/Search는 `AppScreen scroll={false}`와 하나의 `FlatList` 또는 `SectionList`만 세로 scroller로 사용한다. 같은 방향의 `ScrollView` 안에 가상 목록을 중첩하지 않는다.
- 원본 이미지를 한꺼번에 decode하지 않고 표시 폭 기준 2–3배 상한의 thumbnail을 우선 사용한다. 원본은 상세에서만 불러온다.
- 추천 session의 `groupIds`와 순서는 시작 시 고정하고 스크롤 중 재추천으로 카드를 삽입하지 않는다.
- 민감 항목은 disk cache·prefetch에서 제외하며, 삭제 시 파생 thumbnail의 보존 정책도 함께 적용한다.
- 피드 위치와 review transaction은 분리해 scroll 복원이 승인 상태를 되돌리지 않게 한다.

## 13. 카피 원칙

권장:

- `오늘의 연결`
- `내 캡처에서 찾은 장면`
- `오늘 함께 볼 3묶음`
- `상품명과 가격이 같아 함께 모았어요.`
- `이 묶음을 참고로 보관`
- `관련 없음`
- `여기까지 보면 오늘은 끝이에요.`

금지:

- `For You`
- `추천 피드`
- `실시간 인기`
- `지금 놓치면 끝`
- `계속 탐색`
- `친구들이 좋아해요`
- `AI가 정확히 판단했어요`

## 14. 측정 계획

### Primary

- 60초 내 daily review 완료율
- 묶음 일괄 승인률
- 첫 화면에서 review 시작률
- 7일 내 Useful Recall 행동률

### Diagnostic

- 첫 카드 도달률 / End Card 도달률
- 카드별 체류 시간이 아니라 `결정까지 걸린 시간`
- intent 수정률
- `연결 단서` 펼침률
- 하나씩 보기 진입률
- review 중단 위치와 재개 성공률

### Guardrail

- 민감 항목 reveal·공유 취소율
- 삭제 확인 취소·실패율
- 의도치 않은 승인 Undo율
- 알림 해제율
- 앱 세션 시간이 늘어나는 것을 성공 지표로 사용하지 않음

OCR 원문, 이미지, 검색 문장 원문은 analytics에 넣지 않는다.

## 15. 실험 계획

### E1. Curator's Tray vs Finite Recall Feed

- 동일한 3묶음과 동일한 카피를 사용한다.
- 측정: review 시작률, 완료 시간, 완료율, 첫 그룹 수정률
- 성공 조건: 완료율 상승 또는 동일하면서 중앙 완료 시간 감소

### E2. Summary density

- A: 요약 항상 표시 + 근거 접힘
- B: 요약 2줄 + 근거 1개 미리보기
- 측정: 상세 진입률, 잘못된 승인 Undo율, 완료 시간

### E3. Action Dock

- A: `이 묶음을 참고로 보관`
- B: `보관` + 선택 intent 별도 표시
- 측정: 첫 승인 시간, intent 변경률, 접근성 이해도

무한 피드·좋아요·스트릭·FOMO는 실험 대상이 아니다.

## 16. 구현 순서

### Stage 0 — 기획·프로토타입 승인

- 이 문서 승인
- Today·Review·Detail 저해상도 wireframe
- 실제 캡처 5종으로 콘텐츠 밀도 확인

### Stage 1 — component foundation

- `RecallPost`, `ScreenshotPager`, `FiniteEndCard`, `FocusActionDock`
- 기존 token과 copy 확장
- loading·sensitive·long capture 상태
- 민감 source 비마운트와 thumbnail/cache 정책을 먼저 고정

### Stage 2 — Today

- 최대 3카드 finite feed
- review start/resume
- End Card

### Stage 3 — Review

- 한 묶음 Focus Mode
- pager, summary, evidence, intent, approval transaction
- individual review 진입

### Stage 4 — Detail / Library / Search alignment

- Detail 정보 순서 통일
- Library의 `ScrollView + map`을 단일 가상화 2열 목록으로 교체
- Search 결과 카드와 thumbnail visual grammar 정리

### Stage 5 — QA and experiment hook

- 390×844, 작은 화면, 큰 글자, Reduce Motion
- 민감 항목·긴 캡처·분석 실패·offline
- 100/1,000/5,000개 metadata를 사용한 release build 메모리·빠른 스크롤·첫 이미지 측정
- VoiceOver·TalkBack, Dynamic Type 200%, recycled sensitive cell 회귀 확인
- E1 feature flag와 익명 이벤트

## 17. 기획 승인 기준

- [ ] Today 피드가 최대 3묶음에서 명확히 끝난다.
- [ ] Today에서 데이터 변경이 일어나지 않는다.
- [ ] Review는 한 화면 한 묶음·Primary CTA 하나를 유지한다.
- [ ] 묶음을 승인하기 위해 모든 항목을 열 필요가 없다.
- [ ] 요약과 연결 근거가 구분된다.
- [ ] 민감 항목은 이미지·요약·단서·접근성 원문을 함께 가린다.
- [ ] 공개 프로필·좋아요·팔로우·댓글·조회 수가 없다.
- [ ] 일반 승인과 기기 사진 삭제의 마찰 수준이 다르다.
- [ ] 44pt, Dynamic Type, Reduce Motion 요구가 포함된다.
- [ ] 민감 이미지는 blur 뒤에 mount되지 않고 cache·prefetch에서도 제외된다.
- [ ] Library/Search는 하나의 가상화 세로 scroller와 bounded cell 높이를 사용한다.
- [ ] 성공 지표가 체류 시간이 아니라 완료와 Useful Recall이다.

## 18. 열린 결정

1. Today 첫 카드의 미디어 높이: 화면 48% vs 56%
2. 묶음 pager의 기본 대표 이미지 선택 규칙
3. `연결 단서` 기본 접힘 여부와 저신뢰 예외
4. Review에서 intent chip 5개 상시 노출 vs bottom sheet
5. 큰 글자·작은 화면에서 Library 2열 유지 vs 접근성 설정 시 1열 전환
6. 실제 원본 링크가 있을 때 출처 행의 CTA 위치

이 결정은 고해상도 디자인 전에 390×844 클릭 가능한 프로토타입으로 비교한다.

## 19. 근거와 경계

- [Instagram App Store](https://apps.apple.com/kr/app/instagram/id389801252)
- [Meta — Instagram의 연결 기능 업데이트](https://about.fb.com/news/2025/08/new-instagram-features-help-you-connect/)
- [Whatnot App Store](https://apps.apple.com/us/app/whatnot-shop-sell-connect/id1488269261)
- [Whatnot — discoverability](https://help.whatnot.com/hc/en-us/articles/12190921464461-Understand-how-discoverability-works-on-Whatnot)
- [Whatnot — pinned product](https://help.whatnot.com/hc/en-us/articles/47956550101645-Pinning-a-product-during-a-live-show)
- [Whatnot — bidding](https://help.whatnot.com/hc/en-us/articles/14932924544141-Bid-on-an-item-during-a-show)
- [React Native — FlatList](https://reactnative.dev/docs/flatlist)
- [Expo — Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [React Native — AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)
- [Apple HIG — Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Apple HIG — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Catch 2026 App Store Review](./2026_APP_STORE_REVIEW.md)

공개 제품의 UI와 설명은 패턴 참고일 뿐 Catch의 PMF나 리텐션을 입증하지 않는다. 구현 후에도 코호트 기반 검증 전에는 `리텐션이 개선됐다`고 표현하지 않는다.
