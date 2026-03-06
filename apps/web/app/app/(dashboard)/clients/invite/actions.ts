"use server";

import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth/guards";
import { generateInviteToken } from "@/lib/invites/generateInviteToken";

export type CreateClientInviteState = {
  ok: boolean;
  error?:
    | "INVALID_EMAIL"
    | "INVALID_EXPIRES_IN_DAYS"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "INTERNAL_SERVER_ERROR";
  inviteUrl?: string;
};

function normalizeOptionalEmail(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw || null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createClientInviteAction(
  prevState: CreateClientInviteState,
  formData: FormData
): Promise<CreateClientInviteState> {
  try {
    const user = await requireOwner();

    const email = normalizeOptionalEmail(formData.get("email"));
    const expiresRaw = String(formData.get("expiresInDays") ?? "7").trim();
    const expiresInDays = Number(expiresRaw);

    if (email && !isValidEmail(email)) {
      return { ok: false, error: "INVALID_EMAIL" };
    }

    if (
      !Number.isFinite(expiresInDays) ||
      expiresInDays < 1 ||
      expiresInDays > 30
    ) {
      return { ok: false, error: "INVALID_EXPIRES_IN_DAYS" };
    }

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
        token: true,
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const inviteUrl = `${appUrl}/invite/${invite.token}`;

    revalidatePath("/app/clients/invite");

    return {
      ok: true,
      inviteUrl,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    if (message === "UNAUTHORIZED") {
      return { ok: false, error: "UNAUTHORIZED" };
    }

    if (message === "FORBIDDEN") {
      return { ok: false, error: "FORBIDDEN" };
    }

    return { ok: false, error: "INTERNAL_SERVER_ERROR" };
  }
}