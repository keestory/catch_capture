# Codex Start Prompt

아래 내용을 Codex 첫 작업 지시로 사용한다.

```text
이 저장소의 루트에 있는 AGENTS.md와 docs/01부터 docs/10까지를 순서대로 읽어라. design, src/contracts, tasks 파일도 확인하라.

목표는 스마트폰 스크린샷을 하루 한 번 의도별로 정리하는 모바일 앱 MVP를 만드는 것이다. 출처가 아니라 reference / want / share / read / keep 의도를 중심으로 설계한다. AI는 백그라운드 큐레이터이며 챗봇 UI를 만들지 않는다.

먼저 다음을 수행하라.

1. 현재 저장소 구조, 실행 방법, 기술 스택을 점검한다.
2. 기존 구조가 있으면 존중하고, 비어 있으면 TypeScript 기반 모바일 앱의 최소 구조를 만든다. 특정 패키지 버전을 임의로 고정하지 말고 현재 저장소 및 런타임과 호환되는 안정적인 구성을 선택한다.
3. DECISIONS.md를 만들고 기술적 가정, 보류된 제품 결정, 위험을 기록한다.
4. tasks/TASKS.md의 Phase 0과 Phase 1을 완료한다.
5. design/design-tokens.json 또는 src/theme/tokens.ts를 단일 토큰 소스로 연결한다.
6. 20개 이상의 현실적인 한국어 mock 데이터를 만든다. reference, want, share, read, keep가 모두 포함되어야 하며 중복, 긴 캡처, 민감 항목, 분석 실패 케이스도 포함한다.
7. Today / Library / Search 탭이 실행되는 첫 수직 슬라이스를 구현한다.
8. 구현 후 실행 명령, 변경 파일, 테스트 결과, 다음 Phase의 위험을 요약한다.

중요 제약:
- 한 장씩 확인하는 흐름을 기본으로 만들지 않는다.
- 앱에서 제거와 기기 원본 삭제를 합치지 않는다.
- 원본 이미지 또는 OCR 원문을 분석 이벤트에 넣지 않는다.
- 색상만으로 의도를 구분하지 않는다.
- 44×44 터치 영역과 reduced motion을 고려한다.
- AI 반짝이, 보라 그라데이션, 챗봇 입력창을 사용하지 않는다.
- 명세와 충돌하는 새 기능은 추가하지 않는다.

Phase 0~1을 실제로 구현하고, 계획만 제시하고 멈추지 마라.
```

## Phase 2 이후 이어서 사용할 프롬프트

```text
AGENTS.md와 tasks/TASKS.md를 다시 확인하고 다음 미완료 Phase 하나를 끝까지 구현하라. 해당 Phase의 exit criteria와 docs/10_ACCEPTANCE_CRITERIA.md를 검증하고, 실패한 항목은 수정한 뒤 결과를 보고하라. 계획만 작성하지 말고 코드, 테스트, 상태 처리를 완성하라.
```
