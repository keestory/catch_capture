# Catch 제품 브리프

## 한 문장

> 오늘 캡처한 것들을 회사 레퍼런스, 위시리스트, 공유함, 읽을거리로 매일 알아서 정리해주는 스크린샷 인박스.

## 왜 지금인가

2026년 한국 App Store 비즈니스 차트는 채용·행정·협업 도구 중심이고, 생산성 차트는 Gemini, Claude, ChatGPT, Google Workspace, Notion 같은 AI 정보 정리 도구가 상위권입니다. Catch는 비즈니스보다 **생산성** 카테고리가 자연스럽습니다.

- [한국 App Store 비즈니스 차트](https://apps.apple.com/kr/iphone/charts/6000)
- [한국 App Store 생산성 차트](https://apps.apple.com/kr/iphone/charts/6007)

직접 경쟁 앱 [Captr](https://apps.apple.com/kr/app/captr-screenshot-organizer/id6738889624)는 자동 리스트, Daily Feed, 검색과 후속 행동을 이미 제공합니다. Apple도 iOS 26 Visual Intelligence에서 화면 검색·요약·일정 추가를 강화했습니다. 따라서 OCR이나 자동 태그 자체는 차별점이 아닙니다.

Catch의 차별점은 **하루치 여러 장을 한 번에 검토하고, 왜 캡처했는지에 따라 행동 상태를 끝내는 짧은 루프**입니다.

## 초기 사용자

하루 10장 이상 캡처하고 업무 레퍼런스와 쇼핑·소셜 캡처가 한 사진함에 섞이는 한국의 20~39세 PM, 마케터, 디자이너, MD를 초기 타깃으로 둡니다.

JTBD:

> 캡처 방식을 바꾸지 않고도 오늘 저장한 화면이 왜 필요했는지 파악해 3분 안에 보관·공유·구매 후보·읽을거리로 정리하고 싶다.

## 제품 루프

1. 앱 실행 또는 iOS가 허용한 백그라운드 시간에 새 스크린샷을 찾습니다.
2. 기기 안에서 OCR하고 `회사/쇼핑/소셜/뉴스 + 의도`를 제안합니다.
3. 정해진 시각에 리뷰 알림을 보냅니다.
4. 사용자는 틀린 항목과 행동 후보만 고칩니다.
5. `18장 정리 · 공유 2 · 사고 싶음 4 · 참고 7` 같은 종료 결과를 보여줍니다.

## MVP 이후 우선순위

1. 연속 캡처 묶음과 일괄 분류
2. 낮은 신뢰도 항목만 묻는 검토 정책
3. 공유함과 민감정보 가림 제안
4. Share Extension으로 원본 URL과 함께 저장
5. Face ID 회사 보관함과 사용자 정의 규칙
6. 캘린더·리마인더·Notion 내보내기

가격 추적, 자동 구매, 자동 공유, 사진 원본 삭제는 정확성·보안·정책 부담이 커 초기 MVP에서 제외합니다.

## 사업 가설

- 무료: 하루 10장, 최근 30일 검색
- Pro: 월 4,900원 / 연 29,000원
- Pro 후보: 무제한 정리·검색, 사용자 정의함, Face ID, 내보내기
- 광고와 서버 업로드는 초기 신뢰 형성을 위해 배제

첫 출시 전 30명 TestFlight를 2주 운영합니다.

출시 게이트:

- 첫 인박스 완료율 60% 이상
- 리뷰 시간 중앙값 3분 이하
- 2주차에 주 3회 이상 정리하는 사용자 40% 이상
- 핵심 지표: 주간 활성 사용자당 행동 완료 스크린샷 수

## 반드시 지켜야 할 경계

- iOS 백그라운드 작업은 정확한 시각을 보장하지 않습니다. [Apple Background Tasks](https://developer.apple.com/documentation/BackgroundTasks)
- 스크린샷은 `photoScreenshot` subtype으로 식별할 수 있습니다. [Apple PhotoKit](https://developer.apple.com/documentation/photos/phassetmediasubtype/photoscreenshot)
- 사진 권한은 기능을 선택한 순간 맥락과 함께 요청합니다. [Apple Photos Privacy](https://developer.apple.com/documentation/PhotoKit/delivering-an-enhanced-privacy-experience-in-your-photos-app)
- 회사 캡처를 포함한 이미지와 OCR 전문을 서버·로그·알림 본문으로 보내지 않습니다.
- 원본 삭제, 공유, 구매 이동은 사용자가 항상 최종 확정합니다.
- 캡처 원본 앱과 URL은 신뢰할 수 있을 때만 표시합니다.

