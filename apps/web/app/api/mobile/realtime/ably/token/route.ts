import { NextResponse } from "next/server";
import { requireMobileClientContextFromRequest } from "@/lib/mobile/clientApp";
import { createAblyTokenRequest } from "@/lib/realtime";
import {
  getClientUserChannel,
  getTenantAvailabilityChannel,
} from "@trenova/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = await requireMobileClientContextFromRequest(request);

    const capability: Record<string, string[]> = {
      [getClientUserChannel(context.user.id)]: ["subscribe"],
    };

    if (context.client.tenantId) {
      capability[getTenantAvailabilityChannel(context.client.tenantId)] = ["subscribe"];
    }

    const tokenRequest = await createAblyTokenRequest({
      clientId: `client:${context.user.id}`,
      capability,
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }

      if (error.message === "REALTIME_NOT_CONFIGURED") {
        return NextResponse.json({ error: "REALTIME_NOT_CONFIGURED" }, { status: 503 });
      }
    }

    console.error("GET /api/mobile/realtime/ably/token failed", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
