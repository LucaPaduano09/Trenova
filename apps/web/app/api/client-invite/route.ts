import { NextResponse } from "next/server";
import { addDays } from "date-fns";

import { prisma } from "@/lib/db";

import { generateInviteToken } from "@/lib/invites/generateInviteToken";
import { requireOwner } from "@/lib/auth/guards";

type CreateInviteBody = {
  email?: string;
  expiresInDays?: number;
};

export async function POST(req: Request) {
  try {
    const user = await requireOwner();
    const body = (await req.json().catch(() => ({}))) as CreateInviteBody;

    const email = body.email?.trim().toLowerCase() || null;
    const expiresInDays =
      typeof body.expiresInDays === "number" &&
      body.expiresInDays > 0 &&
      body.expiresInDays <= 30
        ? body.expiresInDays
        : 7;

    const token = generateInviteToken();

    const invite = await prisma.clientInvite.create({
      data: {
        tenantId: user.tenantId!,
        createdById: user.id,
        email,
        token,
        expiresAt: addDays(new Date(), expiresInDays),
      },
      select: {
        id: true,
        token: true,
        email: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const inviteUrl = `${appUrl}/invite/${invite.token}`;

    return NextResponse.json({
      ok: true,
      invite: {
        ...invite,
        inviteUrl,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: message }, { status: 401 });
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json({ ok: false, error: message }, { status: 403 });
    }

    return NextResponse.json(
      { ok: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}