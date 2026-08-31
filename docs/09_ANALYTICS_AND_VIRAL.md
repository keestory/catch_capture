# 09. Analytics, Retention & Viral Loop

## North Star candidate

### Weekly Useful Recall

> 주간 활성 사용자 중, 과거 스크린샷을 다시 열고 의미 있는 행동을 한 사용자 비율

의미 있는 행동:

- 공유
- 컬렉션 추가
- 원본/출처 열기
- 구매/방문/읽기 완료
- 리마인더 설정

단순 저장 장수는 북극성 지표가 아니다.

## Activation

사용자가 첫 24시간 안에 다음을 완료하면 활성화로 본다.

- 5장 이상 가져오기
- 1개 이상의 묶음 승인
- 최소 1개 항목을 다시 열기 또는 검색

## Core events

- `onboarding_started`
- `photo_permission_result`
- `screenshots_imported`
- `analysis_completed`
- `daily_review_started`
- `group_approved`
- `item_intent_changed`
- `daily_review_completed`
- `library_filter_used`
- `search_submitted`
- `search_result_opened`
- `item_shared`
- `item_action_completed`
- `item_removed_from_app`
- `item_deleted_from_device`
- `share_artifact_created`

## Key properties

익명 집계만 사용:

- item_count bucket
- group_count
- suggested intent
- final intent
- source category, not account name
- content type
- review duration
- confidence bucket
- sensitive flag
- days since capture

OCR 텍스트, 이미지, 검색 문장 원문은 기본 분석 이벤트에서 제외한다.

## Retention loops

### Daily

새 캡처 → 저녁 묶음 정리 → 완료 감각

### Weekly

- 이번 주 참고 자료
- 아직 공유하지 않은 항목
- 사고 싶은 것 비교
- 읽지 않은 글

### Utility recall

사용자가 실제 필요 순간에 검색 성공.

## Viral assessment

### 기본 유틸리티 앱

바이럴 가능성: 낮음. 콘텐츠가 개인적이고 민감하다.

### 공유 결과물 추가 시

바이럴 가능성: 중간.

가장 자연스러운 공유 포맷:

1. `오늘의 발견 3`
2. `이번 주 취향 보드`
3. `함께 보는 컬렉션`

## Viral loop

`큐레이션 생성 → 외부 공유 → 상대방이 웹/이미지로 확인 → 항목 저장 또는 공동 컬렉션 참여 → 앱 유입`

## Guardrails

- 공유 생성률보다 민감정보 사고율이 중요하다.
- 자동 공유 금지.
- 회사/대화 항목은 공유 기본 제외.
- 공유 카드에 원본 맥락을 왜곡하는 생성형 문구 금지.

## Experiment ideas

### E1. Daily summary copy

- `오늘 12장을 주웠어요.`
- `오늘의 캡처가 4개 묶음으로 준비됐어요.`

측정: 리뷰 시작률, 완료율, 알림 해제율

### E2. Group-first vs item-first

측정: 완료 시간, 수정률, 다음날 재방문

### E3. Share artifact after completion

측정: 생성률, 외부 공유율, 설치 전환, 민감 경고 취소율
