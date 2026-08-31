import type { ContentType } from "@/contracts/domain";

export const echoMemoryAssetName: Record<ContentType, string> = {
  product: "Orbit Capsule",
  article: "Reading Leaves",
  ui_reference: "Frame Stack",
  social_post: "Reply Pair",
  conversation: "Thread Core",
  place: "Place Compass",
  event: "Date Gate",
  video_frame: "Play Pulse",
  document: "Note Grid",
  other: "Neutral Frame",
};

export const echoContentTypeLabel: Record<ContentType, string> = {
  product: "상품 · 가격 · 옵션",
  article: "기사 · 헤드라인 · 본문",
  ui_reference: "UI · 흐름 · 패턴",
  social_post: "소셜 · 게시물 · 반응",
  conversation: "대화 · 스레드 · 메시지",
  place: "장소 · 지도 · 저장",
  event: "일정 · 날짜 · 티켓",
  video_frame: "영상 · 장면 · 재생",
  document: "문서 · 표 · 메모",
  other: "장면 · 기억",
};
