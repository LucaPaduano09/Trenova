"use client";

import * as Ably from "ably";

let ablyClient: Ably.Realtime | null = null;

export function getWebAblyClient() {
  if (typeof window === "undefined") {
    return null;
  }

  if (ablyClient) {
    return ablyClient;
  }

  ablyClient = new Ably.Realtime({
    authUrl: "/api/realtime/ably/token",
    autoConnect: true,
  });

  return ablyClient;
}
