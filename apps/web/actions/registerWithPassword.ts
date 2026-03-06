"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createAndSendEmailVerification } from "@/lib/verification";
import { baseSlugFromEmail, slugify } from "@/lib/slug";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
  variant: z.enum(["pt", "client"]).optional(),
});

async function ensureUniqueTenantSlugTx(
  tx: typeof prisma,
  base: string
): Promise<string> {
  const clean = slugify(base) || "tenant";

  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? clean : `${clean}-${i + 1}`;
    const exists = await tx.tenant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!exists) return candidate;
  }

  return `${clean}-${Math.random().toString(16).slice(2, 8)}`;
}

function makeClientSlug(email: string) {
  const base = baseSlugFromEmail(email) || "client";
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function registerWithPassword(input: {
  email: string;
  password: string;
  fullName?: string;
  variant?: "pt" | "client";
}) {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    console.log(parsed.error.flatten());
    return { ok: false as const, error: "Dati non validi." };
  }

  const { email, password, fullName, variant = "pt" } = parsed.data;
  const emailNorm = email.trim().toLowerCase();
  const safeFullName = fullName?.trim() || null;

  const exists = await prisma.user.findUnique({
    where: { email: emailNorm },
    select: { id: true, emailVerified: true },
  });

  if (exists) {
    if (!exists.emailVerified) {
      await createAndSendEmailVerification({
        email: emailNorm,
        name: safeFullName,
      });

      return { ok: true as const, needsVerify: true as const };
    }

    return { ok: false as const, error: "Email già registrata." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const created = await prisma.$transaction(async (tx) => {
      // =========================
      // CLIENT REGISTER
      // =========================
      if (variant === "client") {
        const user = await tx.user.create({
          data: {
            email: emailNorm,
            passwordHash,
            fullName: safeFullName,
            role: "CLIENT",
            emailVerified: null,
            tenantId: null,
          },
          select: {
            id: true,
            tenantId: true,
            email: true,
            fullName: true,
            role: true,
          },
        });

        const client = await tx.client.create({
          data: {
            userId: user.id,
            tenantId: null,
            slug: makeClientSlug(emailNorm),
            fullName: safeFullName || emailNorm.split("@")[0] || "Cliente",
            email: emailNorm,
            status: "ACTIVE",
          },
          select: {
            id: true,
            tenantId: true,
          },
        });

        return {
          userId: user.id,
          tenantId: client.tenantId ?? null,
          role: user.role,
        };
      }

      // =========================
      // PT REGISTER
      // =========================
      const base = safeFullName
        ? `${safeFullName.split(" ")[0]}-studio`
        : baseSlugFromEmail(emailNorm);

      const slug = await ensureUniqueTenantSlugTx(tx as typeof prisma, base);

      const tenant = await tx.tenant.create({
        data: {
          name: safeFullName ? `${safeFullName} Studio` : "Trenova Workspace",
          slug,
          email: emailNorm,
        },
        select: { id: true },
      });

      const user = await tx.user.create({
        data: {
          email: emailNorm,
          passwordHash,
          fullName: safeFullName,
          role: "OWNER",
          emailVerified: null,
          tenantId: tenant.id,
        },
        select: {
          id: true,
          tenantId: true,
          role: true,
        },
      });

      return {
        userId: user.id,
        tenantId: user.tenantId ?? null,
        role: user.role,
      };
    });

    await createAndSendEmailVerification({
      email: emailNorm,
      name: safeFullName,
    });

    return {
      ok: true as const,
      needsVerify: true as const,
      tenantId: created.tenantId ?? null,
    };
  } catch (error) {
    console.error("registerWithPassword error:", error);
    return {
      ok: false as const,
      error: "Errore durante la registrazione.",
    };
  }
}