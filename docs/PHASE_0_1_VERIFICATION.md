# Phase 0·1 Verification

검증일: 2026-08-21

## 완료 범위

- Expo/React Native/TypeScript 앱 셸과 Today·Library·Search 탭
- 중앙 디자인 토큰과 한국어 카피
- 도메인 계약, repository, AsyncStorage/in-memory adapter
- 26개 한국어 mock과 5개 그룹 fixture
- mock analyzer, 배치 승인, 로컬 검색, 삭제 상태 분리
- 로딩·빈 결과·오류·분석 실패·민감 정보 표시

## 자동 검증

`npm run verify`가 아래 작업을 한 번에 실행한다.

1. Prettier format check
2. ESLint (`--max-warnings=0`)
3. TypeScript strict type check
4. Vitest unit/integration tests

테스트 fixture는 5개 의도, 동일 상품 3장, 중복 UI, 긴 캡처, 동일 주제, 민감 정보, 낮은 신뢰도, 알 수 없는 출처, 분석 실패를 포함한다.

## 수동 검증

- 390×844 viewport에서 3개 탭 렌더링
- Today 그룹 일괄 승인 후 대기 수와 그룹 수 감소
- Library의 2열 그리드와 의도 필터
- Search에서 `검정 러닝화` 검색 시 동일 상품 3장과 매치 근거 표시
- 브라우저 경고/오류 로그 확인
- 모든 review/new fixture가 그룹 승인으로 완료되는지 확인
- 비활성 탭 `aria-hidden`과 민감 항목 접근성 라벨 확인

## Phase 2 경계

Phase 0·1은 mock 및 로컬 데이터 기반이다. 사진 권한, 실제 가져오기, 네이티브 OCR/분석, 앱 잠금, 시스템 공유, 실기기 백그라운드 동작은 검증 완료로 간주하지 않는다.
