---
version: alpha
name: "Echo"
description: "스크린샷을 조용한 일일 리뷰로 바꾸는 한국어 로컬 우선 웹·모바일 제품"
colors:
  canvas: "#F7F7F5"
  surface: "#FFFFFF"
  surface-muted: "#F2F2EF"
  ink: "#151510"
  ink-secondary: "#5E594F"
  line: "#E2E1DC"
  primary: "#2447E8"
  primary-pressed: "#1834B4"
  signal: "#CDEB59"
  danger: "#B42318"
  success: "#167A5B"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "36px"
    lineHeight: "42px"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "15px"
    lineHeight: "22px"
  metadata:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "13px"
    lineHeight: "18px"
rounded:
  DEFAULT: "12px"
  card: "20px"
  tray: "28px"
  pill: "999px"
spacing:
  unit: "4px"
  screen-padding: "20px"
  section-gap: "36px"
  card-gap: "12px"
components:
  action-button: {}
  screenshot-card: {}
  intent-chip: {}
  group-tray: {}
  state-panel: {}
---

# Echo Design System

## Overview

### Creative North Star

Echo는 개인 아카이브의 인덱스 카드와 차분한 에디토리얼 피드를 결합한다. 사용자가 저장한 화면이 가장 강한 색과 정보를 갖고, 제품 UI는 얇은 선·따뜻한 중립 면·명확한 한국어 동사로 뒤로 물러난다.

### Product context and register

- **Audience and primary job:** 업무 레퍼런스, 쇼핑 후보, 읽을거리와 공유할 장면을 캡처하는 한국어 사용자. 하루치 캡처를 묶음으로 빠르게 확인하고 나중에 기억나는 단서로 다시 찾는다.
- **Target market and evidence:** 한국어 우선 제품. 근거는 `docs/01_PRODUCT_BRIEF.md`, `docs/04_DESIGN_SYSTEM.md`, `docs/05_SCREEN_SPECS.md`다.
- **Locale and language policy:** UI 기본은 `ko-KR`; 시스템 날짜/숫자와 접근성 이름도 한국어를 쓴다. 내부 기술명과 AI 점수는 노출하지 않는다.
- **Usage scene:** 모바일 우선, 웹에서는 파일을 직접 선택해 브라우저 로컬에서 검증한다. Today와 Review는 집중형 좁은 열, Library/Search는 데스크톱 작업 공간까지 확장한다.
- **Register:** 제품 UI가 중심인 hybrid. 온보딩과 완료 순간만 제한된 브랜드 표현을 허용한다.
- **Memorable signature:** screenshot-first 묶음과 한 줄짜리 `함께 묶인 이유`.
- **Restraint:** 반복 카드, 필터, 상태에는 장식 궤도·다색 레일·AI 그라데이션을 쓰지 않는다.
- **Anti-references:** 사진 SNS, 무한 피드, 챗봇, 죄책감을 주는 정리 앱, 공개 프로필 UI.
- **Token ownership/runtime mapping:** Model B. `design/design-tokens.json`이 런타임 값의 원본이고 `src/theme/tokens.ts`가 React Native/웹 어댑터다. 이 파일은 승인된 값과 의도를 미러링한다.

## Colors

`canvas`와 `surface`가 기본 계층을 만들고 `line`이 카드 경계를 맡는다. `primary`는 핵심 CTA와 포커스에만 쓴다. `signal`은 완료처럼 드문 순간에만 허용한다. intent 색은 작은 아이콘 보조값이며 텍스트·체크·테두리 없이 단독으로 상태를 전달하지 않는다. 현재 제품 테마는 light이며 dark 토큰은 준비 상태다.

## Typography

한국어 fallback, Bold Text, 확대 안정성을 위해 시스템 산세리프를 사용한다. 개성은 큰 숫자, 영문 eyebrow, 규칙선과 여백에서 만든다. 본문을 영문 대문자나 모노스페이스로 장식하지 않는다. 숫자 진행률은 tabular numerals를 쓴다.

## Layout

4px 간격 체계를 사용한다. 화면 좌우 기본 여백은 20px, 집중형 콘텐츠 최대 너비는 480px, 데스크톱 Library/Search 작업 공간은 920px다. 760px 이상 웹에서는 상단 탭, 그보다 좁으면 모바일 하단 탭을 사용한다. Today 피드는 유한하며 Review는 한 묶음에 집중한다. 이미지 비율과 로딩 면적을 예약해 상태 전환 때 레이아웃이 움직이지 않게 한다.

## Elevation & Depth

정적 카드의 계층은 면과 1px 선으로 만든다. 그림자는 모달·시트·드래그 중 상태처럼 떠 있어야 하는 요소에만 약하게 사용한다. 스크롤 리스트의 반복 그림자는 금지한다.

## Shapes

이미지와 작은 컨트롤은 10–12px, 일반 카드는 20px, 집중 tray·modal은 28px 반경을 사용한다. pill은 상태 배지가 아니라 짧은 필터나 완전한 원형 제어에 제한한다. 기본 아이콘은 1.75–2px stroke 문법을 따른다.

## Components

### Foundational visual states

모든 동작은 기본·pressed·disabled·busy·error 상태를 갖고 최소 44×44px를 유지한다. 웹 키보드 포커스와 네이티브 스크롤바를 숨기지 않는다. 로딩은 안정된 공간의 앱 소유 spinner를 기본으로 한다.

### Buttons and actions

Primary는 화면당 하나의 안전한 주 행동에 쓴다. Secondary는 중립 테두리, quiet는 저강도 탐색, danger는 실제 파괴 동작에만 쓴다. busy에서도 버튼 크기와 동사를 유지한다.

### Navigation and data display

Today·Library·Search의 이름과 아이콘을 전 화면에서 유지한다. Today 카드는 읽기 전용이고 상태 변경은 Review에서만 한다. Library는 모바일 1–2열, 넓은 웹 3열까지 확장한다. Search 결과와 모든 피드는 끝을 명시한다.

### Forms and overlays

웹 파일 입력은 PNG/JPG/WebP 최대 6장, 브라우저 로컬 처리, 명시적 재선택 경로를 제공한다. 검색은 앱 소유 지우기 버튼과 한국어 접근성 이름을 갖는다. 기기 삭제는 웹에서 노출하지 않고, 네이티브에서도 앱 제거와 분리한다.

### Iconography

Phosphor와 로컬 intent vector를 사용한다. icon-only 제어에는 한국어 접근성 이름을 제공하고 intent에는 항상 텍스트를 병행한다.

### Motion

기본 180–220ms로 상태 변화만 설명한다. 컨페티, 지속 orbit/pulse, 자동재생은 금지한다. Reduce Motion에서는 이동·scale을 제거하고 짧은 fade 또는 즉시 전환한다.

### Content and data visualization

카피는 부담을 줄이는 평서문과 구체적인 동사를 쓴다. `AI`, 신뢰도 숫자, 숨은 reasoning 대신 `확인 필요`, `제안`, `함께 묶인 이유`를 사용한다. 실제로 저장하거나 계산하지 않은 통계는 만들지 않는다.

## Do's and Don'ts

- **Do:** 스크린샷과 사용자가 확인할 수 있는 근거를 먼저 보여준다.
- **Do:** 묶음 승인과 예외 수정으로 60초 안의 유한한 리뷰를 유지한다.
- **Don't:** 서버 업로드, OCR, 민감정보 탐지, 자동 감지를 웹 기능처럼 과장한다.
- **Don't:** 파스텔 intent 면, 다색 레일, 마법 아이콘, 공개형 소셜 피드를 반복 UI에 추가한다.
