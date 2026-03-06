"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { attachUserToClientInvite } from "@/lib/invites/attachUserToClientInvite";

type AcceptInviteResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "UNAUTHORIZED"
        | "USER_NOT_FOUND"
        | "INVITE_NOT_FOUND"
        | "INVITE_REVOKED"
        | "INVITE_ALREADY_USED"
        | "INVITE_EXPIRED"
        | "INVITE_EMAIL_MISMATCH"
        | "USER_ALREADY_IN_OTHER_TENANT"
        | "INTERNAL_SERVER_ERROR";
    };

export async function acceptClientInviteAction(
  token: string
): Promise<AcceptInviteResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: "UNAUTHORIZED" };
    }

    const result = await attachUserToClientInvite(session.user.id, token);

    if (!result.ok) {
      return result;
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "INTERNAL_SERVER_ERROR" };
  }
}

export async function acceptClientInviteAndRedirect(token: string) {
  const result = await acceptClientInviteAction(token);

  if (!result.ok) {
    redirect(`/invite/${token}?error=${result.error}`);
  }

  redirect("/c");
}