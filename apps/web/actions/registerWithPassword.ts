// apps/web/actions/registerWithPassword.ts
"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAndSendEmailVerification } from "@/lib/verification";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
  variant: z.enum(["pt", "client"]).optional(), // <-- per set role
});

export async function registerWithPassword(input: {
  email: string;
  password: string;
  fullName?: string;
  variant?: "pt" | "client";
}) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Dati non validi." };
  }

  const { email, password, fullName, variant = "pt" } = parsed.data;

  const exists = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (exists) {
    // se già esiste ma non verificato => rinvia mail
    if (!exists.emailVerified) {
      await createAndSendEmailVerification({ email, name: fullName ?? null });
      return { ok: true as const, needsVerify: true as const };
    }
    return { ok: false as const, error: "Email già registrata." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: fullName?.trim() || null,
      role: variant === "client" ? "CLIENT" : "OWNER",
      emailVerified: null,
    },
    select: { id: true },
  });

  await createAndSendEmailVerification({ email, name: fullName ?? null });

  return { ok: true as const, needsVerify: true as const };
}
