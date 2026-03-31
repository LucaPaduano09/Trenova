import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTrainerTenantChannel } from "@trenova/contracts";
import { isRealtimeEnabled } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, tenantId: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: "No tenant" }, { status: 401 });
    }

    const where = { tenantId: user.tenantId, userId: user.id };

    const [unreadCount, items] = await Promise.all([
      prisma.notification.count({ where: { ...where, readAt: null } }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          body: true,
          href: true,
          readAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      unreadCount,
      items,
      realtimeChannel: isRealtimeEnabled()
        ? getTrainerTenantChannel(user.tenantId)
        : null,
    });
  } catch (e: any) {
    console.error("GET /api/notifications ERROR:", e);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
