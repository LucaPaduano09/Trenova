"use server";

import { prisma } from "@/lib/db";
import { createAndSendPasswordReset } from "@/lib/passwordReset";

export async function requestPasswordReset(input: { email: string }) {
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { ok: true as const };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, fullName: true },
  });

  if (user) {
    await createAndSendPasswordReset({ email, name: user.fullName });
  }

  return { ok: true as const };
}
