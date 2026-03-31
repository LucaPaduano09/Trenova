import * as Ably from "ably";
import {
  getClientUserChannel,
  getTenantAvailabilityChannel,
  getTrainerTenantChannel,
  type RealtimeEventName,
} from "@trenova/contracts";

let ablyRestClient: Ably.Rest | null = null;

function getAblyApiKey() {
  return process.env.ABLY_API_KEY ?? null;
}

export function isRealtimeEnabled() {
  return !!getAblyApiKey();
}

export function getAblyRestClient() {
  const apiKey = getAblyApiKey();

  if (!apiKey) {
    return null;
  }

  if (!ablyRestClient) {
    ablyRestClient = new Ably.Rest({ key: apiKey });
  }

  return ablyRestClient;
}

export async function createAblyTokenRequest(args: {
  clientId: string;
  capability: Record<string, string[]>;
}) {
  const client = getAblyRestClient();

  if (!client) {
    throw new Error("REALTIME_NOT_CONFIGURED");
  }

  return client.auth.createTokenRequest({
    clientId: args.clientId,
    capability: JSON.stringify(args.capability),
  });
}

export async function publishRealtimeEvent(args: {
  channel: string;
  name: RealtimeEventName;
  data: Record<string, unknown>;
}) {
  const client = getAblyRestClient();

  if (!client) {
    return;
  }

  const channel = client.channels.get(args.channel);
  await channel.publish(args.name, args.data);
}

export async function publishTrainerTenantEvent(args: {
  tenantId: string;
  name: RealtimeEventName;
  data: Record<string, unknown>;
}) {
  await publishRealtimeEvent({
    channel: getTrainerTenantChannel(args.tenantId),
    name: args.name,
    data: args.data,
  });
}

export async function publishTenantAvailabilityEvent(args: {
  tenantId: string;
  data: Record<string, unknown>;
}) {
  await publishRealtimeEvent({
    channel: getTenantAvailabilityChannel(args.tenantId),
    name: "availability.updated",
    data: args.data,
  });
}

export async function publishClientUserEvent(args: {
  userId: string;
  name: RealtimeEventName;
  data: Record<string, unknown>;
}) {
  await publishRealtimeEvent({
    channel: getClientUserChannel(args.userId),
    name: args.name,
    data: args.data,
  });
}
