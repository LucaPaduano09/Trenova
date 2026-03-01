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

async function ensureUniqueTenantSlug(base: string) {
  const clean = slugify(base) || "tenant";

  // prova clean, poi clean-2, clean-3...
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? clean : `${clean}-${i + 1}`;
    const exists = await prisma.tenant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }

  // fallback super safe
  return `${clean}-${Math.random().toString(16).slice(2, 8)}`;
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

  const exists = await prisma.user.findUnique({
    where: { email: emailNorm },
    select: { id: true, emailVerified: true },
  });

  if (exists) {
    if (!exists.emailVerified) {
      await createAndSendEmailVerification({
        email: emailNorm,
        name: fullName ?? null,
      });
      return { ok: true as const, needsVerify: true as const };
    }
    return { ok: false as const, error: "Email già registrata." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // ✅ bootstrapping tenant solo per PT/OWNER
  const shouldCreateTenant = variant === "pt";

  const created = await prisma.$transaction(async (tx) => {
    let tenantId: string | null = null;

    if (shouldCreateTenant) {
      const base = fullName?.trim()
        ? `${fullName.trim().split(" ")[0]}-studio`
        : baseSlugFromEmail(emailNorm);

      const slug = await ensureUniqueTenantSlug(base);

      const tenant = await tx.tenant.create({
        data: {
          name: fullName?.trim()
            ? `${fullName.trim()} Studio`
            : "Trenova Workspace",
          slug,
          email: emailNorm,
        },
        select: { id: true },
      });

      tenantId = tenant.id;
    }

    const user = await tx.user.create({
      data: {
        email: emailNorm,
        passwordHash,
        fullName: fullName?.trim() || null,
        role: variant === "client" ? "CLIENT" : "OWNER",
        emailVerified: null,
        tenantId: tenantId, // ✅ collega se creato
      },
      select: { id: true, tenantId: true },
    });

    return user;
  });

  await createAndSendEmailVerification({
    email: emailNorm,
    name: fullName ?? null,
  });

  return {
    ok: true as const,
    needsVerify: true as const,
    tenantId: created.tenantId ?? null,
  };
}
