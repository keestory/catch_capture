const mockPhotoSources: Record<string, number> = {};

const MOCK_PHOTO_PREFIX = "mock-photo://";

export const isMockPhotoUri = (uri: string): boolean => uri.startsWith(MOCK_PHOTO_PREFIX);

export const getMockPhotoSource = (uri: string): number | undefined => {
  if (!isMockPhotoUri(uri)) return undefined;
  const key = uri.slice(MOCK_PHOTO_PREFIX.length);
  return mockPhotoSources[key];
};
