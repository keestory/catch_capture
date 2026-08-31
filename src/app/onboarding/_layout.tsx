import { Redirect, Stack } from "expo-router";

import { AppScreen } from "@/components/app-screen";
import { StatePanel } from "@/components/state-panel";
import { useOnboarding } from "@/onboarding/onboarding-provider";

export default function OnboardingLayout() {
  const { state, loading } = useOnboarding();

  if (loading) {
    return (
      <AppScreen>
        <StatePanel
          description="기기에 저장된 시작 상태를 확인하고 있어요."
          kind="loading"
          title="시작 화면 준비 중"
        />
      </AppScreen>
    );
  }

  if (state.completedAt) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
