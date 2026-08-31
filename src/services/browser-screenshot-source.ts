import type { DeviceScreenshotAsset, DeviceScreenshotSource } from "./expo-screenshot-source";

export const BROWSER_SELECTION_LIMIT = 6;
export const BROWSER_STORAGE_BUDGET = 2_400_000;
export const BROWSER_IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const fingerprint = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const isSupportedBrowserImage = (file: Pick<File, "type">): boolean =>
  SUPPORTED_IMAGE_TYPES.has(file.type);

export const limitBrowserSelection = <T>(files: T[]): T[] =>
  files.slice(0, BROWSER_SELECTION_LIMIT);

const readFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("선택한 이미지를 읽지 못했어요."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error("선택한 이미지의 크기를 확인하지 못했어요."));
    image.onload = () => resolve(image);
    image.src = source;
  });

const prepareAsset = async (file: File): Promise<DeviceScreenshotAsset> => {
  const original = await readFile(file);
  const image = await loadImage(original);
  const maxEdge = 1000;
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("브라우저에서 이미지를 준비하지 못했어요.");
  context.drawImage(image, 0, 0, width, height);
  const imageUri = canvas.toDataURL("image/webp", 0.7);

  return {
    deviceAssetId: `browser:${fingerprint(imageUri)}:${file.size}:${file.lastModified}`,
    imageUri,
    width,
    height,
    capturedAt: new Date(file.lastModified || Date.now()).toISOString(),
    filename: file.name,
  };
};

const openBrowserPicker = (): Promise<File[]> =>
  new Promise((resolve, reject) => {
    const input = document.createElement("input");
    let settled = false;
    let focusTimer: number | undefined;
    const cleanup = () => {
      if (focusTimer !== undefined) window.clearTimeout(focusTimer);
      window.removeEventListener("focus", handleWindowFocus);
      input.remove();
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(Array.from(input.files ?? []));
    };
    const handleWindowFocus = () => {
      if (focusTimer !== undefined) window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(finish, 800);
    };
    input.type = "file";
    input.accept = BROWSER_IMAGE_ACCEPT;
    input.multiple = true;
    input.onchange = finish;
    input.addEventListener("cancel", finish);
    input.setAttribute("aria-label", "사진 앱에서 스크린샷 고르기");
    input.style.position = "fixed";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    input.style.inset = "0 auto auto 0";
    document.body.appendChild(input);
    window.addEventListener("focus", handleWindowFocus);
    try {
      input.click();
    } catch (reason) {
      settled = true;
      cleanup();
      reject(reason);
    }
  });

export class BrowserScreenshotSource implements DeviceScreenshotSource {
  private assets: DeviceScreenshotAsset[] = [];

  async selectScreenshots(): Promise<number> {
    const files = limitBrowserSelection(
      (await openBrowserPicker()).filter(isSupportedBrowserImage),
    );
    if (files.length === 0) return 0;
    const assets = await Promise.all(files.map(prepareAsset));
    const encodedSize = assets.reduce((sum, asset) => sum + asset.imageUri.length, 0);
    if (encodedSize > BROWSER_STORAGE_BUDGET) {
      throw new Error(
        "선택한 이미지가 브라우저 보관 한도를 넘었어요. 더 적은 장수로 다시 골라 주세요.",
      );
    }
    this.assets = assets;
    return this.assets.length;
  }

  async requestAccess() {
    return "denied" as const;
  }

  async getAccess() {
    return this.assets.length > 0 ? ("limited" as const) : ("denied" as const);
  }

  async presentLimitedSelection(): Promise<void> {
    await this.selectScreenshots();
  }

  async listScreenshots(): Promise<DeviceScreenshotAsset[]> {
    return [...this.assets];
  }
}

export const browserScreenshotSource = new BrowserScreenshotSource();
