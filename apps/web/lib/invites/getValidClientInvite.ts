import { prisma } from "@/lib/db";

export type ValidClientInvite =
  | {
      ok: true;
      invite: {
        id: string;
        token: string;
        tenantId: string;
        email: string | null;
        createdById: string;
        usedByUserId: string | null;
        usedAt: Date | null;
        expiresAt: Date | null;
        revokedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  | {
      ok: false;
      error:
        | "INVITE_NOT_FOUND"
        | "INVITE_REVOKED"
        | "INVITE_ALREADY_USED"
        | "INVITE_EXPIRED";
    };

export async function getValidClientInvite(
  token: string
): Promise<ValidClientInvite> {
  const invite = await prisma.clientInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    return { ok: false, error: "INVITE_NOT_FOUND" };
  }

  if (invite.revokedAt) {
    return { ok: false, error: "INVITE_REVOKED" };
  }

  if (invite.usedAt) {
    return { ok: false, error: "INVITE_ALREADY_USED" };
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { ok: false, error: "INVITE_EXPIRED" };
  }

  return { ok: true, invite };
}