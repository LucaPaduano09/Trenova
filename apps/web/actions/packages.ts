"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PackageType } from "@prisma/client";

function parseNumber(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

const createPackageSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(PackageType),

  sessionCount: z.string().optional().or(z.literal("")),
  bundlePrice: z.string().optional().or(z.literal("")),

  monthlyPrice: z.string().optional().or(z.literal("")),
  monthlySessionCount: z.string().optional().or(z.literal("")),
});

export async function createPackage(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = createPackageSchema.safeParse({
    name: formData.get("name")?.toString(),
    type: formData.get("type")?.toString(),

    sessionCount: formData.get("sessionCount")?.toString(),
    bundlePrice: formData.get("bundlePrice")?.toString(),

    monthlyPrice: formData.get("monthlyPrice")?.toString(),
    monthlySessionCount: formData.get("monthlySessionCount")?.toString(),
  });

  if (!parsed.success) throw new Error("Validazione non valida");

  const name = parsed.data.name.trim();
  const type = parsed.data.type;

  const sessionCount = parseNumber(parsed.data.sessionCount);
  const bundlePrice = parseNumber(parsed.data.bundlePrice);

  const monthlyPrice = parseNumber(parsed.data.monthlyPrice);
  const monthlySessionCount = parseNumber(parsed.data.monthlySessionCount);

  if (type === "SESSION_BUNDLE") {
    if (sessionCount == null || sessionCount <= 0 || !Number.isInteger(sessionCount)) {
      throw new Error("Sessioni deve essere un intero > 0");
    }
    if (bundlePrice != null && bundlePrice <= 0) {
      throw new Error("Prezzo bundle deve essere > 0");
    }
  }

  if (type === "MONTHLY") {
    if (monthlyPrice == null || monthlyPrice <= 0) {
      throw new Error("Prezzo mensile deve essere > 0");
    }
    if (
      monthlySessionCount == null ||
      monthlySessionCount <= 0 ||
      !Number.isInteger(monthlySessionCount)
    ) {
      throw new Error("Crediti/mese deve essere un intero > 0");
    }
  }

  await prisma.package.create({
    data: {
      tenantId: tenant.id,
      name,
      type,

      sessionCount: type === "SESSION_BUNDLE" ? (sessionCount as number) : null,
      bundlePrice: type === "SESSION_BUNDLE" ? bundlePrice : null,

      monthlyPrice: type === "MONTHLY" ? (monthlyPrice as number) : null,
      monthlySessionCount:
        type === "MONTHLY" ? (monthlySessionCount as number) : null,
    },
  });

  revalidatePath("/app/packages");
  redirect("/app/packages?flash=created");
}

const updatePackageSchema = z.object({
  packageId: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(PackageType),

  sessionCount: z.string().optional().or(z.literal("")),
  bundlePrice: z.string().optional().or(z.literal("")),

  monthlyPrice: z.string().optional().or(z.literal("")),
  monthlySessionCount: z.string().optional().or(z.literal("")),
});

export async function updatePackage(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = updatePackageSchema.safeParse({
    packageId: formData.get("packageId")?.toString(),
    name: formData.get("name")?.toString(),
    type: formData.get("type")?.toString(),

    sessionCount: formData.get("sessionCount")?.toString(),
    bundlePrice: formData.get("bundlePrice")?.toString(),

    monthlyPrice: formData.get("monthlyPrice")?.toString(),
    monthlySessionCount: formData.get("monthlySessionCount")?.toString(),
  });

  if (!parsed.success) throw new Error("Validazione non valida");

  const existing = await prisma.package.findFirst({
    where: { id: parsed.data.packageId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Pacchetto non trovato");

  const name = parsed.data.name.trim();
  const type = parsed.data.type;

  const sessionCount = parseNumber(parsed.data.sessionCount);
  const bundlePrice = parseNumber(parsed.data.bundlePrice);

  const monthlyPrice = parseNumber(parsed.data.monthlyPrice);
  const monthlySessionCount = parseNumber(parsed.data.monthlySessionCount);

  if (type === "SESSION_BUNDLE") {
    if (sessionCount == null || sessionCount <= 0 || !Number.isInteger(sessionCount)) {
      throw new Error("Sessioni deve essere un intero > 0");
    }
    if (bundlePrice != null && bundlePrice <= 0) {
      throw new Error("Prezzo bundle deve essere > 0");
    }
  }

  if (type === "MONTHLY") {
    if (monthlyPrice == null || monthlyPrice <= 0) {
      throw new Error("Prezzo mensile deve essere > 0");
    }
    if (
      monthlySessionCount == null ||
      monthlySessionCount <= 0 ||
      !Number.isInteger(monthlySessionCount)
    ) {
      throw new Error("Crediti/mese deve essere un intero > 0");
    }
  }

  await prisma.package.update({
    where: { id: existing.id },
    data: {
      name,
      type,

      sessionCount: type === "SESSION_BUNDLE" ? (sessionCount as number) : null,
      bundlePrice: type === "SESSION_BUNDLE" ? bundlePrice : null,

      monthlyPrice: type === "MONTHLY" ? (monthlyPrice as number) : null,
      monthlySessionCount:
        type === "MONTHLY" ? (monthlySessionCount as number) : null,
    },
  });

  revalidatePath("/app/packages");
  redirect("/app/packages?flash=updated");
}
const archivePackageSchema = z.object({
  packageId: z.string().min(1),
});

export async function archivePackage(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = archivePackageSchema.safeParse({
    packageId: formData.get("packageId")?.toString(),
  });
  if (!parsed.success) throw new Error("Validazione non valida");

  const existing = await prisma.package.findFirst({
    where: { id: parsed.data.packageId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Pacchetto non trovato");

  const activePurchases = await prisma.packagePurchase.findMany({
    where: { tenantId: tenant.id, packageId: existing.id, active: true },
    select: { client: { select: { fullName: true } } },
  });

  if (activePurchases.length > 0) {
    const clients = activePurchases.map((p) => p.client.fullName).join(", ");
    redirect(
      `/app/packages?flash=archive_blocked&clients=${encodeURIComponent(clients)}`
    );
  }

  await prisma.package.update({
    where: { id: existing.id },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/app/packages");
  redirect("/app/packages?flash=archived");
}