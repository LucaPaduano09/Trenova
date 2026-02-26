"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-") // lettere/numeri -> dash (unicode safe)
    .replace(/^-+|-+$/g, "");
}

async function uniqueTenantSlug(base: string) {
  const clean = slugify(base) || "tenant";
  let slug = clean;
  let i = 2;

  while (true) {
    const exists = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
    slug = `${clean}-${i++}`;
  }
}
const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "Minimo 8 caratteri"),
});

export async function registerWithPassword(formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase().trim();

  const exists = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (exists)
    return { ok: false as const, error: { email: ["Email già registrata"] } };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  // Qui decidi se creare anche il tenant automaticamente:
  // - opzione A: crei tenant + setti tenantId
  // - opzione B: tenant viene creato altrove (onboarding)
  const tenantSlug = await uniqueTenantSlug(parsed.data.fullName);
  const tenant = await prisma.tenant.create({
    data: {
      name: parsed.data.fullName,
      slug: tenantSlug,
      email,
    },
    select: { id: true },
  });

  const user = await prisma.user.create({
    data: {
      email,
      fullName: parsed.data.fullName,
      passwordHash,
      role: "OWNER",
      tenantId: tenant.id,
    },
    select: { id: true },
  });

  return { ok: true as const, userId: user.id };
}
