import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { attachUserToClientInvite } from "@/lib/invites/attachUserToClientInvite";
import { getValidClientInvite } from "@/lib/invites/getValidClientInvite";

export type RegisterClientWithInviteInput = {
  fullName: string;
  email: string;
  password: string;
  inviteToken: string;
};

export type RegisterClientWithInviteResult =
  | {
      ok: true;
      user: {
        id: string;
        email: string;
        fullName: string | null;
        tenantId: string | null;
        role: "CLIENT";
      };
    }
  | {
      ok: false;
      error:
        | "INVALID_NAME"
        | "INVALID_EMAIL"
        | "INVALID_PASSWORD"
        | "EMAIL_ALREADY_USED"
        | "USER_NOT_FOUND"
        | "INVITE_NOT_FOUND"
        | "INVITE_REVOKED"
        | "INVITE_ALREADY_USED"
        | "INVITE_EXPIRED"
        | "INVITE_EMAIL_MISMATCH"
        | "USER_ALREADY_IN_OTHER_TENANT"
        | "INTERNAL_SERVER_ERROR";
    };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function registerClientWithInvite(
  input: RegisterClientWithInviteInput
): Promise<RegisterClientWithInviteResult> {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;
  const inviteToken = input.inviteToken.trim();

  if (fullName.length < 2) {
    return { ok: false, error: "INVALID_NAME" };
  }

  if (!email || !email.includes("@")) {
    return { ok: false, error: "INVALID_EMAIL" };
  }

  if (password.length < 8) {
    return { ok: false, error: "INVALID_PASSWORD" };
  }

  const validInvite = await getValidClientInvite(inviteToken);

  if (!validInvite.ok) {
    return { ok: false, error: validInvite.error };
  }

  const normalizedInviteEmail =
    validInvite.invite.email?.trim().toLowerCase() ?? null;

  if (normalizedInviteEmail && normalizedInviteEmail !== email) {
    return { ok: false, error: "INVITE_EMAIL_MISMATCH" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { ok: false, error: "EMAIL_ALREADY_USED" };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        emailVerified: new Date(),
        role: "CLIENT",
        tenantId: validInvite.invite.tenantId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        tenantId: true,
        role: true,
      },
    });

    const attachResult = await attachUserToClientInvite(
      createdUser.id,
      inviteToken
    );

    if (!attachResult.ok) {
      return { ok: false, error: attachResult.error };
    }

    return {
      ok: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        tenantId: createdUser.tenantId ?? null,
        role: "CLIENT",
      },
    };
  } catch {
    return { ok: false, error: "INTERNAL_SERVER_ERROR" };
  }
}
