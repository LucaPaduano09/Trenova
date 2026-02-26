// actions/progress.ts
"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { z } from "zod";
import { revalidatePath } from "next/cache";

/** ---------- helpers (qui!) ---------- */
function kgToG(v?: string | null) {
  if (!v) return null;
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1000);
}
function cmToMm(v?: string | null) {
  if (!v) return null;
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10);
}
function pctToBp(v?: string | null) {
  if (!v) return null;
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100); // 21.5 => 2150
}

/** ---------- schema ---------- */
const createCheckInSchema = z.object({
  clientId: z.string().min(1),
  measuredAt: z.string().optional().or(z.literal("")),
  weightKg: z.string().optional().or(z.literal("")),
  waistCm: z.string().optional().or(z.literal("")),
  hipsCm: z.string().optional().or(z.literal("")),
  // armRelaxedCm: z.string().optional().or(z.literal("")),
  thighCm: z.string().optional().or(z.literal("")),
  bodyFatPct: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

/** ---------- action ---------- */
export async function createCheckIn(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = createCheckInSchema.safeParse({
    clientId: formData.get("clientId"),
    measuredAt: formData.get("measuredAt"),
    weightKg: formData.get("weightKg"),
    waistCm: formData.get("waistCm"),
    hipsCm: formData.get("hipsCm"),
    // armRelaxedCm: formData.get("armRelaxedCm"),
    thighCm: formData.get("thighCm"),
    bodyFatPct: formData.get("bodyFatPct"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const measuredAt = parsed.data.measuredAt?.trim()
    ? new Date(parsed.data.measuredAt)
    : new Date();

  await prisma.bodyMetricsEntry.create({
    data: {
      tenantId: tenant.id,
      clientId: parsed.data.clientId,
      measuredAt,

      weightG: kgToG(parsed.data.weightKg),
      waistMm: cmToMm(parsed.data.waistCm),
      hipsMm: cmToMm(parsed.data.hipsCm),
      // armRelaxedMm: cmToMm(parsed.data.armRelaxedCm),
      thighLmm: cmToMm(parsed.data.thighCm),

      bodyFatBp: pctToBp(parsed.data.bodyFatPct),
      notes: parsed.data.notes?.trim() || null,
    },
    select: { id: true },
  });

  // revalidate path dove mostri i check-in (esempio)
  revalidatePath("/app/clients");
  return { ok: true as const };
}
