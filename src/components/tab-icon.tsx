import {
  CardsThreeIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
} from "phosphor-react-native";
import { StyleSheet, View, type ColorValue } from "react-native";

import type { PrimaryNavigationIcon } from "@/domain/primary-navigation-presentation";
import { tokens } from "@/theme/tokens";

export function TabIcon({
  name,
  color,
  focused = false,
}: {
  name: PrimaryNavigationIcon;
  color: ColorValue;
  focused?: boolean;
}) {
  const iconColor = String(focused ? tokens.color.primary : color);

  if (name === "library") {
    return (
      <View accessibilityElementsHidden aria-hidden style={styles.destinationFrame}>
        <SquaresFourIcon
          color={iconColor}
          size={tokens.size.iconLarge}
          weight={focused ? "fill" : "regular"}
        />
        {focused ? <View style={styles.activeMarker} /> : null}
      </View>
    );
  }

  if (name === "search") {
    return (
      <View accessibilityElementsHidden aria-hidden style={styles.destinationFrame}>
        <MagnifyingGlassIcon
          color={iconColor}
          size={tokens.size.iconLarge}
          weight={focused ? "bold" : "regular"}
        />
        {focused ? <View style={styles.activeMarker} /> : null}
      </View>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      aria-hidden
      style={[
        styles.organizeButton,
        focused ? styles.organizeButtonFocused : styles.organizeButtonIdle,
      ]}
    >
      <CardsThreeIcon
        color={focused ? tokens.color.surface : tokens.color.primary}
        size={28}
        weight={focused ? "bold" : "regular"}
      />
      <View style={[styles.checkBadge, focused ? styles.checkBadgeFocused : styles.checkBadgeIdle]}>
        <CheckCircleIcon
          color={focused ? tokens.color.surface : tokens.color.primary}
          size={15}
          weight="fill"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  destinationFrame: {
    pointerEvents: "none",
    width: tokens.size.touchTarget,
    height: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  activeMarker: {
    width: 4,
    height: 4,
    marginTop: 3,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
  },
  organizeButton: {
    pointerEvents: "none",
    width: 58,
    height: 58,
    borderRadius: tokens.radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -7 }],
  },
  organizeButtonFocused: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary,
  },
  organizeButtonIdle: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.surface,
  },
  checkBadge: {
    position: "absolute",
    right: 9,
    bottom: 8,
    width: 15,
    height: 15,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadgeFocused: {
    backgroundColor: tokens.color.primary,
  },
  checkBadgeIdle: {
    backgroundColor: tokens.color.surface,
  },
});
