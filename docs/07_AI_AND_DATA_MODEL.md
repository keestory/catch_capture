# 07. AI, Classification & Data Model

## AI 역할

AI는 다음을 제안한다.

- 스크린샷 여부 확인
- OCR 텍스트
- 콘텐츠 유형
- 저장 의도
- 제목과 짧은 요약
- 출처/도메인
- 유사/중복 그룹
- 민감 정보 후보
- 검색 키워드

### 요약의 역할 분리

- `ScreenshotAnalysis.summary`: 한 캡처에 실제로 무엇이 있는지 설명하는 사실 중심 1문장
- `ScreenshotGroup.summary`: 묶음 전체가 어떤 내용인지 설명하는 1문장
- `ScreenshotGroup.reason`: 왜 서로 묶였는지 설명하는 근거

과거 캡처를 왜 지금 다시 보여주는지는 일일 리뷰 그룹과 생명주기가 다르므로 별도 재발견 read model에서 다룬다. 현재 일일 리뷰 데이터만으로 과거 열람 여부를 추측하지 않는다.

구체적인 후보 자격, 의도별 시간 창, 강한 연결의 부활 조건, interaction history와 일별 고정 snapshot은 `docs/13_RECALL_POLICY.md`를 따른다.

AI는 최종 결정을 내리지 않는다. 사용자가 쉽게 수정할 수 있어야 한다.

### 내용 요약 라우팅

새 캡처의 개별 요약은 공급자 독립 `SummaryPipeline`에서 다음 순서로 만든다.

1. OCR을 정규화하고 글자·숫자 8자 이상, 토큰 2개 이상인지 확인한다.
2. 읽을 만한 텍스트가 있으면 텍스트 요약기만 호출한다.
3. 텍스트가 부족하거나 텍스트 요약이 실패하면 이미지를 벡터화하고 시각 요약기로 전환한다.
4. 표시 문장과 함께 사용자가 원본에서 확인할 수 있는 단서를 최대 3개 조립한다.

이미지 임베딩은 유사 장면 검색과 군집화를 위한 표현이다. 벡터 자체가 자연어 사실 근거는 아니므로, 화면을 관찰하는 시각 요약기가 별도로 문장과 단서를 만든다. 현재 mock vectorizer는 결정적인 12차원 벡터로 이 계약을 검증하며 실제 온디바이스 모델은 같은 port를 구현한다.

`SummaryEvidence`에는 다음만 저장한다.

- `basis`: `ocr_text` 또는 `visual_embedding`
- 화면에서 확인 가능한 짧은 `signals`
- 사용자용 한 문장 `explanation`
- `modelVersion`

모델의 숨은 사고 과정, prompt, raw provider 응답, token trace는 계약과 저장소에 넣지 않는다. 인메모리 파이프라인 결과의 원본 벡터도 `ScreenshotAnalysis`에 복사하지 않는다. 실제 유사도 인덱스를 도입할 때는 메인 AsyncStorage snapshot 밖의 별도 로컬 저장소에 vector를 넣고 item에는 ref·모델 버전·content hash만 연결한다.

민감 항목은 요약, 설명, 단서, 접근성 문구를 함께 가린다. 향후 원격 분석 adapter는 OCR 원문이나 원본 이미지를 보내기 전에 별도 사용자 동의를 요구해야 한다.

## 분류 우선순위

1. 명확한 사용자 수정 기록
2. 현재 스크린샷 내용
3. 같은 출처에서의 최근 사용자 습관
4. 콘텐츠 유형
5. 전역 기본값

## Intent examples

### reference

- 경쟁사 앱 UI
- 캠페인 크리에이티브
- 프레젠테이션 문장
- 업무 프로세스

### want

- 상품 상세와 가격
- 식당/카페
- 여행지
- 전시/티켓

### share

- 밈
- 공감 문장
- 친구에게 보낼 뉴스
- 영상 장면

### read

- 긴 기사
- 분석 글
- 정보성 카드뉴스
- 학습 자료

### keep

- 감정적으로 남기고 싶은 문장
- 예쁜 장면
- 추억
- 취향 레퍼런스지만 특정 행동 목적이 없는 것

## Ambiguity rules

- 상품 + 업무 레퍼런스일 수 있음: 사용자의 최근 습관을 반영하되 보조 태그 `product` 유지
- 뉴스 + 공유: 주 의도는 `share`, 콘텐츠 유형은 `article`
- UI + 사고 싶음: 주 의도는 사용자 선택, 콘텐츠 유형은 `ui_reference` 또는 `product`
- 확신이 낮으면 `keep`으로 보내지 말고 `needs_review=true`

## Grouping

그룹 키 후보:

- perceptual hash 유사도
- OCR 텍스트 중복
- 동일 도메인/앱
- 짧은 시간 간격
- 동일 상품명/기사 제목
- 연속 스크롤 캡처

### Group types

- `duplicate`
- `same_entity`
- `scroll_sequence`
- `same_topic`
- `manual`

## Confidence handling

내부적으로 `0..1` confidence를 저장할 수 있으나 사용자에게 숫자를 노출하지 않는다.

- high: 묶음 승인 화면
- medium: 추천 라벨 + 빠른 수정
- low: `확인이 필요한 항목` 묶음

## Local-first recommendation

MVP는 다음 순서로 구현한다.

1. 로컬 메타데이터와 mock classifier
2. OCR 및 규칙 기반 분류
3. 선택적 온디바이스 모델 또는 API adapter
4. 사용자 동의 기반 서버 처리

비즈니스 로직은 AI 공급자와 분리한다.

```ts
interface ScreenshotAnalyzer {
  analyze(input: AnalyzeScreenshotInput): Promise<ScreenshotAnalysis>;
}
```

## Core entities

정식 타입은 `src/contracts/domain.ts` 참고.

- `ScreenshotItem`
- `ScreenshotAnalysis`
- `ScreenshotGroup`
- `Collection`
- `DailyReviewSession`
- `UserCorrection`
- `ShareArtifact`
- `DeviceDeletionRequest`

## Device deletion transaction

기기 사진 삭제는 리뷰 판정과 별도 생명주기를 가진다.

1. `pending` 요청을 로컬에 먼저 저장한다.
2. Expo MediaLibrary의 class API로 OS 사진 삭제를 요청한다.
3. 성공 뒤에만 항목을 `deleted_from_device`로 확정한다.
4. 실패·취소·권한 거부는 요청을 `failed`로 기록하고 원래 상태를 유지한다.
5. 앱 중단으로 남은 `pending`은 다음 실행에서 원본 존재 여부를 확인해 reconcile한다.

`ReviewItemDecision`, 그룹 ID, 세션 초기 항목과 리뷰 카운트는 후속 사진 삭제로 변경하지 않는다.

## Search index fields

- OCR raw text
- normalized title
- summary
- extracted entities
- source app/domain
- intent
- content type
- collection names
- captured date
- dominant visual descriptors when available

## Feedback loop

사용자 수정은 다음에 활용한다.

- 출처별 기본 의도
- 특정 키워드의 분류
- 그룹 승인 패턴
- 민감 항목 판단

단, 개인화 기록은 설정에서 초기화 가능해야 한다.
