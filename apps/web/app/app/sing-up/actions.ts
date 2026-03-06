"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { getValidClientInvite } from "@/lib/invites/getValidClientInvite";
import { attachUserToClientInvite } from "@/lib/invites/attachUserToClientInvite";

export type SignUpWithInviteState = {
  ok: boolean;
  error?:
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

export async function signUpWithInviteAction(
  prevState: SignUpWithInviteState,
  formData: FormData
): Promise<SignUpWithInviteState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const inviteToken = String(formData.get("inviteToken") ?? "").trim();

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
        emailVerified: new Date(), // se vuoi evitare friction nel flow invito
        role: "CLIENT",
        tenantId: validInvite.invite.tenantId,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const attachResult = await attachUserToClientInvite(
      createdUser.id,
      inviteToken
    );

    if (!attachResult.ok) {
      return { ok: false, error: attachResult.error };
    }

    try {
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return { ok: false, error: "INTERNAL_SERVER_ERROR" };
      }
      throw error;
    }
  } catch {
    return { ok: false, error: "INTERNAL_SERVER_ERROR" };
  }

  redirect("/c");
}