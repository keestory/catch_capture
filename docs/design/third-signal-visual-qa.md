# Third Signal — Designly Visual QA

검토일: 2026-08-22  
검토 대상: 실제 web export, 390×844pt onboarding + Today + draft route  
판정: **PASS**

## QA state

| 항목 | 점수 / 10 | floor | 판정 |
|---|---:|---:|---|
| Brief accuracy | 9.1 | 8.0 | Pass |
| Concept strength | 8.8 | 8.0 | Pass |
| Hierarchy & composition | 8.7 | 8.0 | Pass |
| Grouping, spacing & crop | 8.8 | 8.0 | Pass |
| Typography & exact copy | 8.6 | 8.0 | Pass |
| Color & contrast | 9.0 | 8.0 | Pass |
| Brand fidelity | 8.7 | 8.0 | Pass |
| Product fidelity | 8.4 | 8.0 | Pass |
| Mobile/platform fit | 8.7 | 8.0 | Pass |
| Overall craft | 8.6 | 8.0 | Pass |

가중 평균: **8.7 / 10**

## Perception checks

- **One-second hierarchy:** `이어 볼까요?` → 구체적 결정 제목 → 세 캡처 → CTA 순서가 즉시 읽힌다.
- **Thumbnail/squint:** 검정 텍스트와 하나의 triptych, 검정 CTA만 강한 value mass로 남는다.
- **Edge/crop:** onboarding 실제 캡처는 하나의 경계 안에서 `contain`을 유지한다. Today CTA는 390×844에서 fold 위에 들어온다.
- **Effect subtraction:** 장식 효과를 모두 제거해도 기능의 의미가 유지된다.
- **Copy pass:** MBTI, AI, confidence, 구매 의도 단정이 없다. primary action은 하나다.

## Hard gates

- 필수 카피 오류: 없음
- 브랜드 마크 변형: 없음
- 실제 캡처 왜곡·강제 crop: 없음
- 민감 콘텐츠 우회 노출: 없음. 정책과 presentation 모두 fail closed
- AI-slop veto: 통과

## Slop findings

- Critical: 0
- Major: 0
- Minor: 1 — 데모 러닝화 그룹은 코드 기반 source-like scene이다. 실제 사진 권한 모드에서는 device image가 같은 triptych에 표시되며, 출시 전 physical-device QA가 필요하다.
- Pressure: 1 (`6` 이상 veto)

## 수정 이력

첫 390pt 검사에서 onboarding 설명이 sticky footer와 맞닿고 Today CTA가 fold 아래에 있었다. onboarding triptych를 280pt, Today triptych를 184pt로 줄여 메시지·이미지·primary action을 한 화면 안에 유지했다.

RevisionRequest: 없음.
