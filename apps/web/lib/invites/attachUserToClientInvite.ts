import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { makeUniqueClientSlug } from "@/lib/clients/makeUniqueClientSlug";

type AttachResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "USER_NOT_FOUND"
        | "INVITE_NOT_FOUND"
        | "INVITE_REVOKED"
        | "INVITE_ALREADY_USED"
        | "INVITE_EXPIRED"
        | "INVITE_EMAIL_MISMATCH"
        | "USER_ALREADY_IN_OTHER_TENANT";
    };

export async function attachUserToClientInvite(
  userId: string,
  inviteToken: string
): Promise<AttachResult> {
  const invite = await prisma.clientInvite.findUnique({
    where: { token: inviteToken },
  });

  if (!invite) return { ok: false, error: "INVITE_NOT_FOUND" };
  if (invite.revokedAt) return { ok: false, error: "INVITE_REVOKED" };
  if (invite.usedAt) return { ok: false, error: "INVITE_ALREADY_USED" };
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { ok: false, error: "INVITE_EXPIRED" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      tenantId: true,
      role: true,
    },
  });

  if (!user) return { ok: false, error: "USER_NOT_FOUND" };

  const normalizedUserEmail = user.email?.trim().toLowerCase() ?? null;
  const normalizedInviteEmail = invite.email?.trim().toLowerCase() ?? null;

  if (
    normalizedInviteEmail &&
    (!normalizedUserEmail || normalizedUserEmail !== normalizedInviteEmail)
  ) {
    return { ok: false, error: "INVITE_EMAIL_MISMATCH" };
  }

  if (user.tenantId && user.tenantId !== invite.tenantId) {
    return { ok: false, error: "USER_ALREADY_IN_OTHER_TENANT" };
  }

  await prisma.$transaction(async (tx) => {
    await attachInsideTransaction(tx, {
      invite,
      user: {
        id: user.id,
        email: normalizedUserEmail,
        fullName: user.fullName,
      },
    });
  });

  return { ok: true };
}

async function attachInsideTransaction(
  tx: Prisma.TransactionClient,
  args: {
    invite: {
      id: string;
      tenantId: string;
      token: string;
    };
    user: {
      id: string;
      email: string | null;
      fullName: string | null;
    };
  }
) {
  const { invite, user } = args;

  await tx.user.update({
    where: { id: user.id },
    data: {
      tenantId: invite.tenantId,
      role: "CLIENT",
    },
  });

  const existingClientByUser = await tx.client.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      tenantId: true,
    },
  });

  if (existingClientByUser) {
    if (
      existingClientByUser.tenantId &&
      existingClientByUser.tenantId !== invite.tenantId
    ) {
      throw new Error("USER_ALREADY_IN_OTHER_TENANT");
    }

    await tx.client.update({
      where: { id: existingClientByUser.id },
      data: {
        tenantId: invite.tenantId,
        email: user.email ?? undefined,
        fullName: user.fullName ?? user.email?.split("@")[0] ?? "Cliente Trenova",
        status: "ACTIVE",
        archivedAt: null,
      },
    });
  } else {
    const existingClientByEmail = user.email
      ? await tx.client.findFirst({
          where: {
            tenantId: invite.tenantId,
            email: user.email,
          },
          select: { id: true },
        })
      : null;

    if (existingClientByEmail) {
      await tx.client.update({
        where: { id: existingClientByEmail.id },
        data: {
          userId: user.id,
          email: user.email ?? undefined,
          fullName: user.fullName ?? user.email?.split("@")[0] ?? "Cliente Trenova",
          status: "ACTIVE",
          archivedAt: null,
        },
      });
    } else {
      const baseName =
        user.fullName?.trim() || user.email?.split("@")[0] || "Cliente Trenova";

      const slug = await makeUniqueClientSlug(tx, invite.tenantId, baseName);

      await tx.client.create({
        data: {
          tenantId: invite.tenantId,
          userId: user.id,
          slug,
          fullName: baseName,
          email: user.email ?? undefined,
          status: "ACTIVE",
        },
      });
    }
  }

  await tx.clientInvite.update({
    where: { id: invite.id },
    data: {
      usedAt: new Date(),
      usedByUserId: user.id,
    },
  });
}