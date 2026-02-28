"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function resetPassword(input: {
  token: string;
  email: string;
  newPassword: string;
}) {
  const token = String(input.token ?? "");
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();
  const newPassword = String(input.newPassword ?? "");

  if (!token || !email || newPassword.length < 8) {
    return { ok: false as const, error: "Dati non validi." };
  }

  const vt = await prisma.passwordResetToken.findFirst({
    where: { token, identifier: email },
    select: { token: true, expires: true, identifier: true },
  });

  if (!vt || vt.expires < new Date()) {
    return { ok: false as const, error: "Link scaduto o non valido." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { identifier: email },
    }),
  ]);

  return { ok: true as const };
}
