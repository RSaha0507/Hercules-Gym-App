const DEFAULT_CLOUD_RUN_BACKEND_URL = "https://hercules-gym-api-847366288287.asia-southeast1.run.app";

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function resolveBackendUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return normalizeUrl(configuredUrl);
  }

  return DEFAULT_CLOUD_RUN_BACKEND_URL;
}

export const BACKEND_URL = resolveBackendUrl();
export const API_BASE_URL = `${BACKEND_URL}/api`;
