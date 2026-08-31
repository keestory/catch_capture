import { useEffect } from "react";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppDataProvider } from "@/data/app-data-provider";
import { OnboardingProvider } from "@/onboarding/onboarding-provider";
import { tokens } from "@/theme/tokens";

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const pageTitle = pathname.startsWith("/library")
      ? "보관함"
      : pathname.startsWith("/search")
        ? "장면 찾기"
        : pathname.startsWith("/review")
          ? "오늘 정리"
          : pathname.startsWith("/item")
            ? "장면 상세"
            : pathname.startsWith("/onboarding")
              ? "시작하기"
              : "오늘";

    document.title = `${pageTitle} — Echo`;
    document.documentElement.lang = "ko";
  }, [pathname]);

  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <AppDataProvider>
          <View style={styles.root}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </AppDataProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.canvas },
});
