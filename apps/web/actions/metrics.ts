"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import {
  createEntrySchema,
  type CreateMetricsEntryState,
} from "./metrics.schema";

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
  return Math.round(n * 100);
}
function intOrNull(v?: string | null) {
  if (!v) return null;
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

export async function createMetricsEntry(
  _prev: CreateMetricsEntryState,
  formData: FormData
): Promise<CreateMetricsEntryState> {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = createEntrySchema.safeParse({
    clientId: formData.get("clientId"),
    measuredAt: formData.get("measuredAt"),

    weightKg: formData.get("weightKg"),
    waistCm: formData.get("waistCm"),
    hipsCm: formData.get("hipsCm"),
    armRmm: formData.get("armRmm"),
    armLmm: formData.get("armLmm"),

    forearmRmm: formData.get("forearmRmm"),
    forearmLmm: formData.get("forearmLmm"),

    thighRmm: formData.get("thighRmm"),
    thighLmm: formData.get("thighLmm"),
    calfRmm: formData.get("calfRmm"),
    calfLmm: formData.get("calfLmm"),
    bodyFatPct: formData.get("bodyFatPct"),

    tbwPct: formData.get("tbwPct"),
    icwPct: formData.get("icwPct"),
    ecwPct: formData.get("ecwPct"),
    muscleKg: formData.get("muscleKg"),
    fatKg: formData.get("fatKg"),
    ffmKg: formData.get("ffmKg"),
    bmrKcal: formData.get("bmrKcal"),
    visceralFat: formData.get("visceralFat"),
    metabolicAge: formData.get("metabolicAge"),
    phaseAngle: formData.get("phaseAngle"),

    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().fieldErrors };
  }

  const measuredAt = parsed.data.measuredAt?.trim()
    ? new Date(parsed.data.measuredAt)
    : new Date();

  const entry = await prisma.bodyMetricsEntry.create({
    data: {
      tenantId: tenant.id,
      clientId: parsed.data.clientId,
      measuredAt,

      weightG: kgToG(parsed.data.weightKg),
      waistMm: cmToMm(parsed.data.waistCm),
      hipsMm: cmToMm(parsed.data.hipsCm),
      armRmm: cmToMm(parsed.data.armRmm),
      armLmm: cmToMm(parsed.data.armLmm),
      forearmRmm: cmToMm(parsed.data.forearmRmm),
      forearmLmm: cmToMm(parsed.data.forearmLmm),
      thighRmm: cmToMm(parsed.data.thighRmm),
      thighLmm: cmToMm(parsed.data.thighLmm),
      calfRmm: cmToMm(parsed.data.calfRmm),
      calfLmm: cmToMm(parsed.data.calfLmm),
      bodyFatBp: pctToBp(parsed.data.bodyFatPct),

      tbwBp: pctToBp(parsed.data.tbwPct),
      icwBp: pctToBp(parsed.data.icwPct),
      ecwBp: pctToBp(parsed.data.ecwPct),

      muscleMassG: kgToG(parsed.data.muscleKg),
      fatMassG: kgToG(parsed.data.fatKg),
      ffmG: kgToG(parsed.data.ffmKg),

      bmrKcal: intOrNull(parsed.data.bmrKcal),
      visceralFat: intOrNull(parsed.data.visceralFat),
      metabolicAge: intOrNull(parsed.data.metabolicAge),
      phaseAngleBp: pctToBp(parsed.data.phaseAngle),

      notes: parsed.data.notes?.trim() || null,
    },
    select: { id: true },
  });

  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${tenant.id}`);

  return { ok: true, entryId: entry.id };
}

export async function listMetricsEntries(clientId: string) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  return prisma.bodyMetricsEntry.findMany({
    where: { tenantId: tenant.id, clientId },
    orderBy: { measuredAt: "desc" },
    take: 25,
    select: {
      id: true,
      measuredAt: true,
      weightG: true,
      waistMm: true,
      hipsMm: true,
      armRmm: true,
      armLmm: true,
      forearmRmm: true,
      forearmLmm: true,
      thighRmm: true,
      thighLmm: true,
      calfRmm: true,
      calfLmm: true,
      bodyFatBp: true,
      tbwBp: true,
      icwBp: true,
      ecwBp: true,
      muscleMassG: true,
      fatMassG: true,
      ffmG: true,
      bmrKcal: true,
      visceralFat: true,
      metabolicAge: true,
      phaseAngleBp: true,
      notes: true,
    },
  });
}