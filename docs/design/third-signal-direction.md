# Third Signal — Design Signal Packet

상태: `third-signal-v1` 구현 기준  
방법: Designly creative strategy + composition preflight

## Strategy state

- **Audience behavior:** 생각난 순간 캡처하지만 별도로 분류하거나 다시 찾는 행동은 적은 사용자
- **Communication objective:** 반복 캡처가 이미 다음 행동을 만들 만큼 충분한 신호라는 것을 3초 안에 이해시킨다.
- **Proof:** 서로 관련된 실제 캡처 세 장과 그로부터 준비된 결과 하나
- **Primary message:** `캡처가 세 장 모이면, 다음 행동이 생겨요.`
- **Desired action:** Today에서 내용별 초안 하나를 연다.
- **Tone:** 사적인 편집자, 담백함, 사실 중심, 판단을 재촉하지 않음

## Composition state

- **Reference canvas:** 390×844pt
- **Safe margin:** 좌우 24pt 이상
- **Grid:** Swiss modular, 1-column copy + 1 unified media frame
- **Reading order:** label → headline → reason → triptych → primary action → quiet dismiss
- **Single focal element:** 세 캡처를 하나의 경계 안에 묶은 triptych
- **Hierarchy:** 실제 스크린샷 > 구체적 제목 > 한 줄 이유 > CTA > dismiss
- **Negative space:** 카피와 triptych 사이를 분리하고, 화면 가장자리에 장식 요소를 두지 않는다.
- **Touch targets:** primary와 secondary 모두 최소 44pt

## Creative constraints

- 세 개의 떠 있는 카드나 세 개의 artifact 선택지를 동시에 보여주지 않는다.
- 원형 AI 코어, 궤도, 반짝임, 그라디언트, 다색 레일, 겹친 카드 스택을 사용하지 않는다.
- intent 색을 큰 배경으로 사용하지 않는다.
- 실제 캡처는 tint·overlay·crop 없이 `contain`으로 보여준다.
- `AI가 판단했어요`, personality/MBTI, 구매 의도 단정, score/confidence 숫자를 쓰지 않는다.
- 민감 항목은 media resolution 전에 fail closed한다.

## Copy pattern

```text
이어 볼까요?
검정 러닝화, 이제 한 번에 결정해 보세요.
상품·사이즈·착용 장면을 세 번 확인했어요.

[실제 캡처 3장 — 하나의 triptych]

[결정 카드 보기]
그대로 보관
```

## Rejected patterns

- 성격 유형을 활용한 추천
- `세 번이나 캡처했으니 사고 싶은 거예요` 같은 의도 단정
- 검색창을 hero로 두는 화면
- 모든 캡처 그룹에 반복되는 제안 카드
- infinite recommendation feed
- auto-share, auto-delete, auto-upload

## Visual QA gates

1. 390pt 화면에서 triptych가 유일한 시각 초점인가?
2. 3초 안에 `세 캡처 → 한 초안` 관계가 보이는가?
3. 세 이미지는 한 묶음으로 읽히고 개별 카드처럼 경쟁하지 않는가?
4. 실제 화면 정보가 장식에 가려지거나 잘리지 않는가?
5. primary action은 하나뿐인가?
6. dismiss가 명확하지만 primary와 경쟁하지 않는가?
