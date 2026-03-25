"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function cmToMm(v?: string | null) {
  if (!v) return null;
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10);
}

const upsertProfileSchema = z.object({
  clientId: z.string().min(1),
  heightCm: z.string().optional().or(z.literal("")),
  sex: z.enum(["MALE", "FEMALE", "OTHER"]).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
});

export async function upsertClientProfile(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = upsertProfileSchema.safeParse({
    clientId: formData.get("clientId"),
    heightCm: formData.get("heightCm"),
    sex: formData.get("sex"),
    birthDate: formData.get("birthDate"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const heightMm = cmToMm(parsed.data.heightCm);
  const sex = parsed.data.sex === "" ? null : parsed.data.sex;
  const birthDate = parsed.data.birthDate?.trim()
    ? new Date(parsed.data.birthDate)
    : null;

  await prisma.clientProfile.upsert({
    where: { clientId: parsed.data.clientId },
    create: {
      tenantId: tenant.id,
      clientId: parsed.data.clientId,
      heightMm,
      sex,
      birthDate,
    },
    update: {
      heightMm,
      sex,
      birthDate,
    },
    select: { id: true },
  });

  revalidatePath("/app/clients");
  return { ok: true as const };
}

export async function getClientProfile(clientId: string) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  return prisma.clientProfile.findFirst({
    where: { tenantId: tenant.id, clientId },
    select: {
      id: true,
      heightMm: true,
      sex: true,
      birthDate: true,
      updatedAt: true,
    },
  });
}