import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "trenova.mobile.access-token";

export async function getStoredAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setStoredAccessToken(accessToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
}

export async function clearStoredAccessToken() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
