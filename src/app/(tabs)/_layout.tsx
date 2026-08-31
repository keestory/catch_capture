import { Redirect, Tabs } from "expo-router";
import { Platform, StyleSheet, useWindowDimensions } from "react-native";

import { AppScreen } from "@/components/app-screen";
import { StatePanel } from "@/components/state-panel";
import { TabIcon } from "@/components/tab-icon";
import { primaryNavigationItems } from "@/domain/primary-navigation-presentation";
import { useOnboarding } from "@/onboarding/onboarding-provider";
import { tokens } from "@/theme/tokens";

export default function TabsLayout() {
  const { state, loading } = useOnboarding();
  const { width } = useWindowDimensions();
  const desktopWeb = Platform.OS === "web" && width >= 760;

  if (loading) {
    return (
      <AppScreen>
        <StatePanel description="시작 상태를 확인하고 있어요." kind="loading" title="준비 중" />
      </AppScreen>
    );
  }

  if (!state.completedAt) {
    const href = !state.valueSeen
      ? "/onboarding/value"
      : !state.privacySeen
        ? "/onboarding/privacy"
        : "/onboarding/review-time";
    return <Redirect href={href} />;
  }

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.color.primary,
        tabBarInactiveTintColor: tokens.color.inkSecondary,
        tabBarShowLabel: desktopWeb,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: desktopWeb ? styles.desktopLabel : undefined,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: desktopWeb ? styles.desktopTabBar : styles.tabBar,
        sceneStyle: desktopWeb ? styles.desktopScene : undefined,
      }}
    >
      {primaryNavigationItems.map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            tabBarAccessibilityLabel: item.accessibilityLabel,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon color={color} focused={focused} name={item.icon} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    minHeight: 82,
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[4],
    borderTopColor: tokens.color.line,
    borderTopWidth: tokens.layout.hairline,
    backgroundColor: tokens.color.echoSurface.navigationSurface,
  },
  tabBarItem: {
    minWidth: tokens.size.touchTarget,
    minHeight: tokens.size.touchTarget,
  },
  desktopTabBar: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 72,
    paddingHorizontal: tokens.space[8],
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.line,
    backgroundColor: tokens.color.surface,
  },
  desktopScene: { paddingTop: 72 },
  desktopLabel: { fontSize: 12, fontWeight: "700" },
});
