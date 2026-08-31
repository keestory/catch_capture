# 04. Design System

## 디자인 콘셉트

### Warm Editorial Utility

개인 사진 보관함의 익숙함과 정돈된 에디토리얼 피드의 리듬을 결합한다. 저장한 스크린샷이 가장 강한 시각 요소이며, 기능 UI는 흰 면·회색 구분선·검정 텍스트를 기본으로 한다. 코발트는 핵심 행동과 포커스에만 사용한다.

### Echo brand layer

Echo의 풀컬러 `Memory Core + Returning Orbit`는 앱 아이콘·splash·온보딩·완료·마케팅에만 쓰는 브랜드 레이어다. 기능 UI는 계속 Quiet Signal Archive를 따른다.

- full-color Orb는 화면당 최대 하나이며 screenshot보다 강하게 반복하지 않는다.
- `color.brandAsset.*`은 브랜드 raster/vector에만 사용하고 CTA·intent·상태색으로 사용하지 않는다.
- 작은 UI에는 `echo-mark-flat.svg` 또는 `echo-mark-mono.svg`를 사용한다.
- 지속 orbit·pulse·particle과 AI avatar/assistant 표현은 사용하지 않는다.
- 세부 logo, asset, motion, contrast 규칙은 `docs/design/echo-design-system.md`의 Production Brand Layer와 `assets/brand/echo/asset-manifest.md`를 따른다.

### Signature — Content First + Quiet Evidence

- 관련된 캡처는 동일한 카드 안에서 대표 장면, 제목, 출처, 묶은 이유의 순서로 설명한다.
- 반복 카드에는 로고 파생 궤도, 삼색 레일, 장식 점, 파스텔 면을 사용하지 않는다.
- 연결 이유는 별도 색 면 대신 얇은 구분선 아래에 사람의 언어로 한 줄만 표시한다.
- `AI`, 마법 아이콘, 신뢰도 숫자 대신 선별 결과와 연결 근거로 지능을 표현한다.
- Today에서 보여주는 추천은 세 묶음으로 끝난다. 무한 피드로 확장하지 않는다.

## 디자인 원칙

- 콘텐츠가 가장 강한 색을 가진다.
- UI는 따뜻한 중립색을 사용한다.
- 그림자보다 선과 면의 차이로 계층을 만든다.
- 자동 제안은 평범한 라벨, 그룹화, 확인 가능한 근거로 표현한다.
- 감성은 타이틀과 완료 순간에만 사용한다.
- 숫자와 배지는 최소화한다.

## 피해야 할 표현

- 보라/파랑 AI 그라데이션
- 반짝이, 마법봉, 로봇 아이콘
- 홈 중앙의 챗봇 입력창
- 과도한 유리 질감
- 카드마다 강한 그림자
- 빨간 경고와 죄책감 카피
- 한 화면에 많은 통계

## 컬러

원본 값은 `design/design-tokens.json`을 사용한다.

### Neutral

| Token | Value | Usage |
|---|---:|---|
| `canvas` | `#F7F7F5` | 앱 기본 배경 |
| `canvasDeep` | `#EFEFEB` | 배경 계층, 비활성 영역 |
| `surface` | `#FFFFFF` | 카드, 시트 |
| `surfaceRaised` | `#FFFFFF` | 선택·플로팅 콘텐츠 면 |
| `surfaceMuted` | `#F2F2EF` | 선택 전 배경, 보조 영역 |
| `ink` | `#151510` | 주요 텍스트 |
| `inkSecondary` | `#5E594F` | 보조 텍스트 |
| `inkTertiary` | `#70695F` | 비활성 메타·placeholder |
| `line` | `#E2E1DC` | 테두리, 구분선 |
| `lineStrong` | `#C9C7BF` | 강조 구분선 |

### Brand

| Token | Value | Usage |
|---|---:|---|
| `primary` | `#2447E8` | CTA, 포커스, Cobalt Thread |
| `primaryPressed` | `#1834B4` | 눌림 상태 |
| `primarySoft` | `#E9EDFF` | 선택·설명 배경 |
| `signal` | `#CDEB59` | 연결점, 핵심 완료 액션 |
| `signalSoft` | `#F1F7D7` | 완료·성공 보조면. 추천 badge와 반복 카드에는 사용하지 않음 |
| `signalInk` | `#344000` | signal 위 텍스트 |
| `aiHighlight` | `#E8F08D` | 레거시 별칭. 새 코드에서는 `signal`을 사용 |

### Intent colors

의도 색은 작은 아이콘에만 사용할 수 있다. 반복 필터와 칩의 면·텍스트는 중립색을 기본으로 하고, 선택은 테두리·체크·텍스트를 함께 사용한다.

| Intent | Background | Text | Icon |
|---|---:|---:|---|
| reference | `#E8EDFF` | `#2443B8` | pin/bookmark |
| want | `#FBE9DF` | `#9A3F17` | tag/bag |
| share | `#F8E4EC` | `#94224E` | send |
| read | `#DFF2EC` | `#0D6A56` | document |
| keep | `#EEEAE2` | `#514D46` | ribbon/heart |

## 타이포그래피

### 기본

- MVP는 한국어 fallback, Bold Text, Dynamic Type 안정성을 위해 플랫폼 시스템 산세리프를 사용한다.
- 개성을 위해 폰트를 추가하는 대신 숫자 크기, 영문 eyebrow, 규칙선과 여백으로 에디토리얼 리듬을 만든다.
- 사용자 콘텐츠와 일반 본문에 영문 대문자나 모노스페이스를 사용하지 않는다.

### Scale

| Style | Size / Line height | Weight | Usage |
|---|---:|---:|---|
| display | 36 / 42 | 700 | 온보딩·완료의 핵심 문장 |
| coverNumber | 56 / 58 | 650 | 오늘 볼 묶음 수 |
| screenTitle | 30 / 36 | 700 | 화면 제목 |
| sectionTitle | 20 / 28 | 650 | 섹션 제목 |
| cardTitle | 16 / 24 | 600 | 카드 제목 |
| body | 15 / 22 | 400 | 본문 |
| bodyStrong | 15 / 22 | 600 | 강조 본문 |
| metadata | 13 / 18 | 400 | 출처, 시각 |
| label | 12 / 16 | 600 | 칩, 배지 |
| micro | 11 / 14 | 500 | 보조 라벨 |

숫자 진행률은 가능하면 tabular numerals를 사용한다.

## 간격

4pt 기반.

- `space.1 = 4`
- `space.2 = 8`
- `space.3 = 12`
- `space.4 = 16`
- `space.5 = 20`
- `space.6 = 24`
- `space.7 = 28`
- `space.8 = 32`
- `space.10 = 40`
- `space.12 = 48`

기본 화면 좌우 여백은 16pt. 큰 타이틀 구간은 20pt까지 허용한다.

## Radius

- screenshot card: 12
- standard card: 20
- curator tray: 28
- bottom sheet: 28
- modal: 28
- chip: 999
- thumbnail: 10

## Border & shadow

- 카드 기본: 1px `line`
- 선택 카드: 1.5~2px `primary`
- 그림자: 플로팅 액션, 바텀 시트, 드래그 중인 카드에만 약하게 사용
- 스크롤 리스트 카드에 반복 그림자 금지

## 레이아웃

### Today / Review

- Today는 `오늘 함께 볼 세 묶음`을 신규 캡처 수보다 먼저 보여준다.
- Today의 세 묶음은 모두 같은 `RecallPost` 규칙으로 표현한다. 첫 카드만 크게 만드는 featured/compact 위계는 사용하지 않는다.
- 각 RecallPost는 출처 행, 큰 screenshot pager, 페이지 표시, 제목, `함께 묶인 이유`, intent 순서로 읽힌다.
- Instagram/TikTok의 콘텐츠 우선 리듬만 차용한다. 좋아요·댓글·팔로우·조회 수·자동재생·무한 피드는 만들지 않는다.
- 큰 브랜드 그래픽과 겹친 카드 장식은 Today 반복 셀에서 사용하지 않는다. 사용자가 저장한 화면이 가장 강한 시각 요소여야 한다.
- Review는 한 번에 하나의 핵심 묶음만 보여준다.
- 1열 카드
- 하단 고정 CTA 또는 Action Dock
- 캡처 이미지 위에 정보 오버레이 금지. 메타는 이미지 아래에 배치

### Library

- 2열 그리드
- 원본 비율 유지
- 극단적으로 긴 캡처는 최대 높이 제한 + `긴 캡처` 표시
- 날짜 헤더는 sticky 가능

### Search

- 첫 번째 고관련 결과는 큰 카드
- 나머지는 2열 그리드
- 검색 문장과 매칭 단서를 짧게 표시

## 아이콘

- 단순한 1.75~2px stroke
- intent는 로컬 20×20 vector set을 사용한다: 북마크, 가격표, 공유 트레이, 펼친 책, 하트
- 문자 glyph나 emoji를 intent icon으로 사용하지 않는다.
- 아이콘 단독 버튼에는 접근성 라벨 필수
- 의도 카테고리는 아이콘 + 텍스트 병행
- 삭제, 공유, 잠금은 플랫폼 관습을 따른다

## 모션

- 기본 전환: 180~220ms
- 카드 승인: 뒤 스택으로 들어감
- 그룹 병합: 카드가 포개짐
- 의도 변경: 중립 면과 테두리가 전환
- 완료: 카드 스택이 정돈되는 차분한 모션
- 컨페티 금지
- Reduce Motion 활성 시 페이드로 대체

## 접근성

- 최소 터치 영역 44×44
- 본문 대비 WCAG AA 수준을 목표
- 색만으로 상태 전달 금지
- 스크린리더 순서: 이미지 설명 → 출처/시간 → 제목 → 의도 → 액션
- 이미지 설명이 없으면 `Instagram에서 캡처한 러닝화 상품 화면` 같은 자동 설명 사용
- 텍스트 크기 확대에서 버튼 잘림 금지
