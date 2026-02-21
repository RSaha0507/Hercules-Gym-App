const LOCAL_BACKEND_URL = "http://127.0.0.1:8001";
const DEFAULT_RELEASE_BACKEND_URL = "https://hercules-gym-api-rsaha0507.onrender.com";
const IS_DEV_MODE = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function resolveBackendUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return normalizeUrl(configuredUrl);
  }

  if (IS_DEV_MODE) {
    return LOCAL_BACKEND_URL;
  }

  return DEFAULT_RELEASE_BACKEND_URL;
}

export const BACKEND_URL = resolveBackendUrl();
export const API_BASE_URL = `${BACKEND_URL}/api`;
