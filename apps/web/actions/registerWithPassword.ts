"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/** Copiate da lib/auth.ts per coerenza */
function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function makeUniqueTenantSlug(base: string) {
  const cleanBase = slugify(base) || "coach";
  let slug = cleanBase;

  for (let i = 0; i < 50; i++) {
    const exists = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
    slug = `${cleanBase}-${i + 2}`;
  }

  return `${cleanBase}-${Date.now()}`;
}

export async function registerWithPassword(input: {
  email: string;
  password: string;
  fullName?: string;
}) {
  const email = (input.email || "").trim().toLowerCase();
  const password = (input.password || "").toString();

  if (!email || !password)
    return { ok: false, error: "Email e password richieste." };
  if (password.length < 8)
    return { ok: false, error: "Password troppo corta (min 8 caratteri)." };

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing)
    return { ok: false, error: "Esiste già un account con questa email." };

  const passwordHash = await bcrypt.hash(password, 10);

  const baseName = (email.split("@")[0] || "coach").slice(0, 40);
  const slug = await makeUniqueTenantSlug(baseName);

  // Transaction: crea tenant + user collegato
  const { user } = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: baseName, slug, email },
      select: { id: true },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        tenantId: tenant.id,
        role: "OWNER",
        fullName: input.fullName?.trim() || baseName,
      },
      select: { id: true, email: true, tenantId: true },
    });

    return { user };
  });

  return { ok: true, userId: user.id };
}
