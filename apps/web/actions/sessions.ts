"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LocationType } from "@prisma/client";

function parseEuroToCents(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

const updateSessionSchema = z.object({
  sessionId: z.string().min(1),
  startsAt: z.string().min(1),
  durationMin: z.coerce.number().int().min(15).max(240),
  locationType: z.nativeEnum(LocationType),
  location: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  price: z.string().optional().or(z.literal("")),
  isPaid: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().optional().or(z.literal("")),
});

export async function updateSession(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = updateSessionSchema.safeParse({
    sessionId: formData.get("sessionId")?.toString(),
    startsAt: formData.get("startsAt")?.toString(),
    durationMin: formData.get("durationMin"),
    locationType: formData.get("locationType")?.toString(),
    location: formData.get("location")?.toString(),
    notes: formData.get("notes")?.toString(),
    price: formData.get("price")?.toString(),
    isPaid: formData.get("isPaid")?.toString(),
    paymentMethod: formData.get("paymentMethod")?.toString(),
  });

  if (!parsed.success) {
    throw new Error("Validazione non valida");
  }

  const { sessionId, startsAt, durationMin, locationType } = parsed.data;

  const existing = await prisma.appointment.findFirst({
    where: { id: sessionId, tenantId: tenant.id },
    select: { id: true, client: { select: { slug: true } } },
  });

  if (!existing) {
    throw new Error("Appuntamento non trovato");
  }

  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  const priceCents = parseEuroToCents(parsed.data.price);
  const paid = parsed.data.isPaid === "on";

  await prisma.appointment.update({
    where: { id: existing.id },
    data: {
      startsAt: start,
      endsAt: end,
      locationType,
      location: parsed.data.location?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      priceCents,
      currency: priceCents != null ? "EUR" : null,
      paidAt: paid ? new Date() : null,
      paymentMethod: parsed.data.paymentMethod?.trim() || null,
    },
  });

  revalidatePath(`/app/clients/${existing.client.slug}`);
  revalidatePath(`/app/clients/${existing.client.slug}?tab=sessions`);

  redirect(`/app/clients/${existing.client.slug}?tab=sessions`);
}

const deleteSessionSchema = z.object({
  sessionId: z.string().min(1),
});

export async function deleteSession(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = deleteSessionSchema.safeParse({
    sessionId: formData.get("sessionId")?.toString(),
  });

  if (!parsed.success) {
    throw new Error("Validazione non valida");
  }

  const existing = await prisma.appointment.findFirst({
    where: { id: parsed.data.sessionId, tenantId: tenant.id, deletedAt: null },
    select: { id: true, client: { select: { slug: true } } },
  });

  if (!existing) {
    throw new Error("Sessione non trovata");
  }

  await prisma.appointment.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/app/clients/${existing.client.slug}`);
  revalidatePath(`/app/clients/${existing.client.slug}?tab=sessions`);

  redirect(`/app/clients/${existing.client.slug}?tab=sessions`);
}
const sessionIdSchema = z.object({
  sessionId: z.string().min(1),
});

export async function markSessionPaid(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const sessionId = formData.get("sessionId")?.toString();
  if (!sessionId) throw new Error("Missing sessionId");

  const existing = await prisma.appointment.findFirst({
    where: {
      id: sessionId,
      tenantId: tenant.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    select: { id: true, client: { select: { slug: true } } },
  });

  if (!existing) throw new Error("Session not found (or deleted)");

  await prisma.appointment.update({
    where: { id: existing.id },
    data: { paidAt: new Date() },
  });

  revalidatePath(`/app/clients/${existing.client.slug}`);
  revalidatePath("/app/dashboard");
  // query non serve in revalidatePath: la pagina è force-dynamic, basta questa
  redirect(
    `/app/clients/${existing.client.slug}?tab=sessions&flash=paid&sid=${existing.id}`
  );
}

export async function markSessionUnpaid(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const sessionId = formData.get("sessionId")?.toString();
  if (!sessionId) throw new Error("Missing sessionId");

  const existing = await prisma.appointment.findFirst({
    where: {
      id: sessionId,
      tenantId: tenant.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    select: { id: true, client: { select: { slug: true } } },
  });

  if (!existing) throw new Error("Session not found (or deleted)");

  await prisma.appointment.update({
    where: { id: existing.id },
    data: { paidAt: null },
  });

  revalidatePath(`/app/clients/${existing.client.slug}`);
  redirect(
    `/app/clients/${existing.client.slug}?tab=sessions&flash=unpaid&sid=${existing.id}`
  );
}
