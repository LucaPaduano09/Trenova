import { NextResponse } from "next/server";
import { attachUserToClientInvite } from "@/lib/invites/attachUserToClientInvite";
import {
  createMobileClientAuthSessionForUserId,
  resolveMobileClientSessionUserFromRequest,
} from "@/lib/mobile/auth";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const sessionUser = await resolveMobileClientSessionUserFromRequest(request);

    if (!sessionUser) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const result = await attachUserToClientInvite(sessionUser.id, token);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error });
    }

    const session = await createMobileClientAuthSessionForUserId(sessionUser.id);

    return NextResponse.json({
      ok: true,
      session,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    console.error(
      `POST /api/mobile/client/invites/${token}/accept failed`,
      error
    );
    return NextResponse.json(
      { ok: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
