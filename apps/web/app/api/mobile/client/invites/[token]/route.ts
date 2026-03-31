import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getValidClientInvite } from "@/lib/invites/getValidClientInvite";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const inviteResult = await getValidClientInvite(token);

    if (!inviteResult.ok) {
      return NextResponse.json({
        ok: false,
        error: inviteResult.error,
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: inviteResult.invite.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        users: {
          where: { role: "OWNER" },
          select: {
            id: true,
            fullName: true,
            email: true,
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ ok: false, error: "INVITE_NOT_FOUND" });
    }

    return NextResponse.json({
      ok: true,
      invite: {
        token: inviteResult.invite.token,
        email: inviteResult.invite.email,
        expiresAt: inviteResult.invite.expiresAt?.toISOString() ?? null,
        workspace: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          email: tenant.email,
        },
        trainer: tenant.users[0]
          ? {
              id: tenant.users[0].id,
              fullName: tenant.users[0].fullName,
              email: tenant.users[0].email,
            }
          : null,
      },
    });
  } catch (error) {
    console.error(`GET /api/mobile/client/invites/${token} failed`, error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
