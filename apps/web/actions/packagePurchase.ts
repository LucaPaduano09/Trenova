"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PackageType } from "@prisma/client";

function endOfCurrentMonth(d = new Date()) {
  // ultimo millisecondo del mese corrente
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

const assignPackageSchema = z.object({
  clientId: z.string().min(1),
  clientSlug: z.string().min(1),
  packageId: z.string().min(1),
  expiresAt: z.string().optional().or(z.literal("")),
});

export async function assignPackageToClient(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = assignPackageSchema.safeParse({
    clientId: formData.get("clientId")?.toString(),
    clientSlug: formData.get("clientSlug")?.toString(),
    packageId: formData.get("packageId")?.toString(),
    expiresAt: formData.get("expiresAt")?.toString(),
  });

  if (!parsed.success) throw new Error("Validazione non valida");

  const { clientId, clientSlug, packageId, expiresAt } = parsed.data;

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!client) throw new Error("Cliente non trovato");

  const pkg = await prisma.package.findFirst({
    where: { id: packageId, tenantId: tenant.id },
    select: {
      id: true,
      name: true,
      type: true,
      sessionCount: true,
      monthlySessionCount: true,
    },
  });
  if (!pkg) throw new Error("Pacchetto non trovato");

  const exp =
    expiresAt && expiresAt.trim()
      ? new Date(expiresAt)
      : pkg.type === PackageType.MONTHLY
      ? endOfCurrentMonth()
      : null;

  await prisma.$transaction(async (tx) => {
    if (pkg.type === PackageType.SESSION_BUNDLE) {
      const sessions = pkg.sessionCount ?? 0;
      if (!sessions || sessions <= 0) throw new Error("Il bundle non ha sessioni valide");

      const purchase = await tx.packagePurchase.create({
        data: {
          tenantId: tenant.id,
          clientId: client.id,
          packageId: pkg.id,
          remainingSessions: sessions,
          active: true,
          expiresAt: exp,
        },
        select: { id: true },
      });

      await tx.sessionCreditLedger.create({
        data: {
          tenantId: tenant.id,
          packagePurchaseId: purchase.id,
          delta: sessions,
          reason: `PURCHASE_BUNDLE:${pkg.name}`,
        },
      });

      return;
    }

    if (pkg.type === PackageType.MONTHLY) {
      const credits = pkg.monthlySessionCount ?? 0;
      if (!credits || credits <= 0) throw new Error("Il mensile non ha crediti/mese validi");

      const purchase = await tx.packagePurchase.create({
        data: {
          tenantId: tenant.id,
          clientId: client.id,
          packageId: pkg.id,
          remainingSessions: credits,
          active: true,
          expiresAt: exp, // fine mese default
        },
        select: { id: true },
      });

      await tx.sessionCreditLedger.create({
        data: {
          tenantId: tenant.id,
          packagePurchaseId: purchase.id,
          delta: credits,
          reason: `PURCHASE_MONTHLY:${pkg.name}`,
        },
      });

      return;
    }

    throw new Error("Tipo pacchetto non supportato");
  });

  revalidatePath(`/app/clients/${clientSlug}`);
  revalidatePath(`/app/clients/${clientSlug}?tab=packages`);
  redirect(`/app/clients/${clientSlug}?tab=packages&flash=package_assigned`);
}

const deactivateSchema = z.object({
  purchaseId: z.string().min(1),
  clientSlug: z.string().min(1),
});

export async function deactivatePackagePurchase(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = deactivateSchema.safeParse({
    purchaseId: formData.get("purchaseId")?.toString(),
    clientSlug: formData.get("clientSlug")?.toString(),
  });

  if (!parsed.success) throw new Error("Validazione non valida");

  const { purchaseId, clientSlug } = parsed.data;

  const existing = await prisma.packagePurchase.findFirst({
    where: { id: purchaseId, tenantId: tenant.id },
    select: { id: true, active: true },
  });

  if (!existing) throw new Error("Pacchetto cliente non trovato");

  if (!existing.active) {
    redirect(`/app/clients/${clientSlug}?tab=packages&flash=package_already_inactive`);
  }

  await prisma.packagePurchase.update({
    where: { id: existing.id },
    data: { active: false },
  });

  revalidatePath(`/app/clients/${clientSlug}`);
  revalidatePath(`/app/clients/${clientSlug}?tab=packages`);
  redirect(`/app/clients/${clientSlug}?tab=packages&flash=package_detached`);
}
const reactivateSchema = z.object({
  purchaseId: z.string().min(1),
  clientSlug: z.string().min(1),
});

export async function reactivatePackagePurchase(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = reactivateSchema.safeParse({
    purchaseId: formData.get("purchaseId")?.toString(),
    clientSlug: formData.get("clientSlug")?.toString(),
  });

  if (!parsed.success) throw new Error("Validazione non valida");

  const { purchaseId, clientSlug } = parsed.data;

  const existing = await prisma.packagePurchase.findFirst({
    where: { id: purchaseId, tenantId: tenant.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Pacchetto cliente non trovato");

  await prisma.packagePurchase.update({
    where: { id: existing.id },
    data: { active: true },
  });

  revalidatePath(`/app/clients/${clientSlug}`);
  revalidatePath(`/app/clients/${clientSlug}?tab=packages`);
  redirect(`/app/clients/${clientSlug}?tab=packages&flash=package_reactivated`);
}