import type { ColorValue } from "react-native";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import type { Intent } from "@/contracts/domain";
import {
  INTENT_ICON_PATHS,
  INTENT_ICON_STROKE_WIDTH,
  INTENT_ICON_VIEW_BOX,
} from "@/domain/intent-icon-geometry";

interface IntentIconProps {
  color: ColorValue;
  intent: Intent;
  size?: number;
}

export function IntentIcon({ color, intent, size = 18 }: IntentIconProps) {
  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.frame, { width: Math.max(size, 18), height: size }]}
    >
      <Svg height={size} viewBox={INTENT_ICON_VIEW_BOX} width={size}>
        {INTENT_ICON_PATHS[intent].map((path) => (
          <Path
            d={path}
            fill="none"
            key={path}
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={INTENT_ICON_STROKE_WIDTH}
          />
        ))}
      </Svg>
    </View>
  );
}

export function SelectionCheckIcon({ color, size = 14 }: { color: ColorValue; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.checkFrame, { width: size, height: size }]}
    >
      <Svg height={size} viewBox={INTENT_ICON_VIEW_BOX} width={size}>
        <Path
          d="M4.5 10 8.2 13.5 15.5 6"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={INTENT_ICON_STROKE_WIDTH}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  checkFrame: { alignItems: "center", justifyContent: "center", pointerEvents: "none" },
});
