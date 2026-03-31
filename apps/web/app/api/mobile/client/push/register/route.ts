import { prisma } from "@/lib/db";
import { requireMobileClientContextFromRequest } from "@/lib/mobile/clientApp";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerPushDeviceSchema = z.object({
  expoPushToken: z.string().min(1).max(255),
  platform: z.string().min(1).max(32),
  deviceName: z.string().trim().max(120).nullable().optional(),
  appOwnership: z.string().trim().max(32).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireMobileClientContextFromRequest(request);
    const json = await request.json();
    const parsed = registerPushDeviceSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_PAYLOAD",
        },
        { status: 400 }
      );
    }

    await prisma.mobilePushDevice.upsert({
      where: {
        expoPushToken: parsed.data.expoPushToken,
      },
      update: {
        userId: context.user.id,
        tenantId: context.client.tenantId ?? null,
        platform: parsed.data.platform,
        deviceName: parsed.data.deviceName ?? null,
        appOwnership: parsed.data.appOwnership ?? null,
        revokedAt: null,
        lastSeenAt: new Date(),
      },
      create: {
        userId: context.user.id,
        tenantId: context.client.tenantId ?? null,
        expoPushToken: parsed.data.expoPushToken,
        platform: parsed.data.platform,
        deviceName: parsed.data.deviceName ?? null,
        appOwnership: parsed.data.appOwnership ?? null,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    );
  }
}
