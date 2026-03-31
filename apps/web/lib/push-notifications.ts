import { prisma } from "@/lib/db";

type PushData = Record<string, string>;

type SendPushArgs = {
  userId: string;
  title: string;
  body: string;
  data?: PushData;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  details?: {
    error?: string;
  };
};

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

export async function sendPushToUser(args: SendPushArgs) {
  const devices = await prisma.mobilePushDevice.findMany({
    where: {
      userId: args.userId,
      revokedAt: null,
    },
    select: {
      id: true,
      expoPushToken: true,
    },
  });

  if (devices.length === 0) {
    return;
  }

  const uniqueDevices = Array.from(
    new Map(devices.map((device) => [device.expoPushToken, device])).values()
  );

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      uniqueDevices.map((device) => ({
        to: device.expoPushToken,
        title: args.title,
        body: args.body,
        sound: "default",
        priority: "high",
        data: args.data ?? {},
      }))
    ),
  });

  if (!response.ok) {
    throw new Error(`EXPO_PUSH_FAILED_${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: ExpoPushTicket[];
  };

  const revokedDeviceIds = uniqueDevices
    .map((device, index) => {
      const ticket = payload.data?.[index];

      if (
        ticket?.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        return device.id;
      }

      return null;
    })
    .filter((value): value is string => Boolean(value));

  if (revokedDeviceIds.length > 0) {
    await prisma.mobilePushDevice.updateMany({
      where: {
        id: { in: revokedDeviceIds },
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
