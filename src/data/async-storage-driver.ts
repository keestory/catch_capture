import AsyncStorage from "@react-native-async-storage/async-storage";

import type { StorageDriver } from "./storage-driver";

export class AsyncStorageDriver implements StorageDriver {
  getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
}
