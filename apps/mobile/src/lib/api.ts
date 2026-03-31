import { createTrenovaApiClient } from "@trenova/api-client";

let currentAccessToken: string | null = null;

export function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
}

export function setApiAccessToken(accessToken: string | null) {
  currentAccessToken = accessToken;
}

export const apiClient = createTrenovaApiClient({
  baseUrl: getApiBaseUrl(),
  getAccessToken: () => currentAccessToken,
});
