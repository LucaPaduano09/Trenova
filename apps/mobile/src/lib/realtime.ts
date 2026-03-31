import * as Ably from "ably";
import { getApiBaseUrl } from "@/src/lib/api";

let ablyClient: Ably.Realtime | null = null;
let currentToken: string | null = null;

export function getMobileAblyClient(accessToken: string | null) {
  if (!accessToken) {
    return null;
  }

  if (ablyClient && currentToken === accessToken) {
    return ablyClient;
  }

  if (ablyClient) {
    void ablyClient.close();
    ablyClient = null;
  }

  currentToken = accessToken;
  ablyClient = new Ably.Realtime({
    authUrl: `${getApiBaseUrl()}/api/mobile/realtime/ably/token`,
    authHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
    autoConnect: true,
  });

  return ablyClient;
}

export function resetMobileAblyClient() {
  if (ablyClient) {
    void ablyClient.close();
  }

  ablyClient = null;
  currentToken = null;
}
