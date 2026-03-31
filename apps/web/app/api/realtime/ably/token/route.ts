import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAblyTokenRequest } from "@/lib/realtime";
import {
  getTenantAvailabilityChannel,
  getTrainerTenantChannel,
} from "@trenova/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      tenantId: true,
      role: true,
    },
  });

  if (!user?.tenantId || user.role !== "OWNER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const tokenRequest = await createAblyTokenRequest({
      clientId: `trainer:${user.id}`,
      capability: {
        [getTrainerTenantChannel(user.tenantId)]: ["subscribe"],
        [getTenantAvailabilityChannel(user.tenantId)]: ["subscribe"],
      },
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    if (error instanceof Error && error.message === "REALTIME_NOT_CONFIGURED") {
      return NextResponse.json({ error: "REALTIME_NOT_CONFIGURED" }, { status: 503 });
    }

    console.error("GET /api/realtime/ably/token failed", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
