import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { tokens } from "@/theme/tokens";

interface AppScreenProps extends PropsWithChildren {
  accessibilityHidden?: boolean;
  atmosphere?: boolean;
  scroll?: boolean;
  footer?: ReactNode;
  testID?: string;
  width?: "compact" | "workspace";
}

export function AppScreen({
  accessibilityHidden = false,
  atmosphere = false,
  children,
  scroll = true,
  footer,
  testID,
  width = "compact",
}: AppScreenProps) {
  const content = (
    <View
      style={[
        styles.content,
        width === "workspace" && styles.contentWorkspace,
        !scroll && styles.contentFixed,
      ]}
    >
      {children}
    </View>
  );
  return (
    <SafeAreaView
      accessibilityElementsHidden={accessibilityHidden}
      aria-hidden={accessibilityHidden}
      edges={["top"]}
      importantForAccessibility={accessibilityHidden ? "no-hide-descendants" : "auto"}
      style={styles.safeArea}
      testID={testID}
    >
      {atmosphere ? (
        <View accessibilityElementsHidden aria-hidden style={styles.atmosphere}>
          <View style={styles.atmospherePearl} />
          <View style={styles.atmosphereBlue} />
          <View style={styles.atmospherePeach} />
          <View style={styles.atmosphereOrbit} />
          <View style={styles.atmosphereOrbitInner} />
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, overflow: "hidden", backgroundColor: tokens.color.canvas },
  atmosphere: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
  atmospherePearl: {
    width: 300,
    height: 300,
    position: "absolute",
    top: -196,
    right: -132,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.echoSurface.ambientLilac,
    opacity: 0.72,
  },
  atmosphereBlue: {
    width: 220,
    height: 220,
    position: "absolute",
    top: 104,
    left: -184,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.echoSurface.ambientAqua,
    opacity: 0.8,
  },
  atmospherePeach: {
    width: 160,
    height: 160,
    position: "absolute",
    top: 316,
    right: -132,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.echoSurface.ambientPeach,
    opacity: 0.62,
  },
  atmosphereOrbit: {
    width: 230,
    height: 230,
    position: "absolute",
    top: -76,
    right: -84,
    borderWidth: 1.5,
    borderColor: tokens.color.echoSurface.reflectionAqua,
    borderRightColor: "transparent",
    borderRadius: tokens.radius.pill,
    opacity: 0.32,
    transform: [{ rotate: "-18deg" }],
  },
  atmosphereOrbitInner: {
    width: 168,
    height: 168,
    position: "absolute",
    top: -44,
    right: -52,
    borderWidth: 1,
    borderColor: tokens.color.echoSurface.reflectionViolet,
    borderBottomColor: "transparent",
    borderRadius: tokens.radius.pill,
    opacity: 0.26,
    transform: [{ rotate: "18deg" }],
  },
  scrollContent: { paddingBottom: tokens.space[12] },
  content: {
    width: "100%",
    maxWidth: tokens.layout.maxContentWidth,
    alignSelf: "center",
    flexGrow: 1,
    gap: tokens.layout.sectionGap,
    paddingHorizontal: tokens.layout.screenPadding,
    paddingTop: tokens.space[5],
  },
  contentWorkspace: { maxWidth: tokens.layout.maxWorkspaceWidth },
  contentFixed: { flex: 1, minHeight: 0 },
});
