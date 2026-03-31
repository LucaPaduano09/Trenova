"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth";
import { registerClientWithInvite } from "@/lib/invites/registerClientWithInvite";

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

export async function signUpWithInviteAction(
  prevState: SignUpWithInviteState,
  formData: FormData
): Promise<SignUpWithInviteState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const inviteToken = String(formData.get("inviteToken") ?? "").trim();

  const result = await registerClientWithInvite({
    fullName,
    email,
    password,
    inviteToken,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
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

  redirect("/c");
}
