import { Linking, Platform } from "react-native";

import { browserScreenshotSource } from "@/services/browser-screenshot-source";
import { getDeviceScreenshotSource } from "@/services/device-screenshot-source";
import type { DeviceScreenshotSource } from "@/services/expo-screenshot-source";

import type { PhotoAccessStatus } from "./onboarding-store";

export interface PhotoAccessAdapter {
  request(mode: "full" | "limited"): Promise<PhotoAccessStatus>;
  selectScreenshots(): Promise<number>;
  openSettings(): Promise<boolean>;
}

export class NativePhotoAccessAdapter implements PhotoAccessAdapter {
  constructor(private readonly source: DeviceScreenshotSource = getDeviceScreenshotSource()) {}

  async request(mode: "full" | "limited"): Promise<PhotoAccessStatus> {
    return this.source.requestAccess(mode);
  }

  async selectScreenshots(): Promise<number> {
    if (Platform.OS === "web") return browserScreenshotSource.selectScreenshots();
    let access = await this.source.getAccess();
    if (access === "not_determined") access = await this.source.requestAccess("limited");
    if (access === "denied") return 0;
    if (access === "limited") await this.source.presentLimitedSelection();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return (await this.source.listScreenshots({ since: sevenDaysAgo })).length;
  }

  async openSettings(): Promise<boolean> {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }
}
