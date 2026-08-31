import { Platform } from "react-native";

import { browserScreenshotSource } from "./browser-screenshot-source";
import { ExpoScreenshotSource } from "./expo-screenshot-source";
import type { DeviceScreenshotSource } from "./expo-screenshot-source";

export const getDeviceScreenshotSource = (): DeviceScreenshotSource =>
  Platform.OS === "web" ? browserScreenshotSource : new ExpoScreenshotSource();
