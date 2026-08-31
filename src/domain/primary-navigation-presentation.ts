export const primaryNavigationItems = [
  {
    name: "library",
    title: "보관함",
    accessibilityLabel: "보관함",
    icon: "library",
    emphasis: "destination",
  },
  {
    name: "index",
    title: "오늘",
    accessibilityLabel: "오늘의 스크린샷 정리",
    icon: "organize",
    emphasis: "primary",
  },
  {
    name: "search",
    title: "찾기",
    accessibilityLabel: "찾기",
    icon: "search",
    emphasis: "destination",
  },
] as const;

export type PrimaryNavigationItem = (typeof primaryNavigationItems)[number];
export type PrimaryNavigationRoute = PrimaryNavigationItem["name"];
export type PrimaryNavigationIcon = PrimaryNavigationItem["icon"];
