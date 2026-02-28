"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LocationType, AppointmentStatus } from "@prisma/client";

export type CreateSessionState =
  | { ok: true; error: Record<string, string[]> }
  | { ok: false; error: Record<string, string[]> };

function parseEuroToCents(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  // accetta "45", "45.5", "45,50"
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);

  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/* ----------------------------- CREATE ----------------------------- */

const createSessionSchema = z.object({
  clientSlug: z.string().min(1),
  startsAt: z.string().min(1, "Seleziona data e ora"),
  durationMin: z.coerce.number().int().min(15).max(240),
  locationType: z.nativeEnum(LocationType),

  price: z.string().optional().or(z.literal("")),
  isPaid: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().optional().or(z.literal("")),

  location: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function createSession(
  _prevState: { ok: boolean; error: Record<string, string[]> },
  formData: FormData
): Promise<CreateSessionState> {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = createSessionSchema.safeParse({
    clientSlug: formData.get("clientSlug")?.toString(),
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
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const { clientSlug, startsAt, durationMin, locationType } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: clientSlug } },
    select: { id: true, slug: true },
  });

  if (!client) {
    return {
      ok: false as const,
      error: { clientSlug: ["Cliente non trovato"] },
    };
  }

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return { ok: false as const, error: { startsAt: ["Data/ora non valida"] } };
  }

  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  const priceCents = parseEuroToCents(parsed.data.price);
  const paid = parsed.data.isPaid === "on";

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      clientId: client.id,
      startsAt: start,
      endsAt: end,
      locationType,
      location: parsed.data.location?.trim() || null,
      notes: parsed.data.notes?.trim() || null,

      status: "SCHEDULED",

      // 💶 billing
      priceCents,
      currency: priceCents != null ? "EUR" : null,
      paidAt: paid ? new Date() : null,
      paymentMethod: parsed.data.paymentMethod?.trim() || null,
    },
  });

  revalidatePath("/app/booking");
  revalidatePath(`/app/clients/${client.slug}`);

  redirect(`/app/clients/${client.slug}`);
}

/* ------------------------------ UPDATE ---------------------------- */

const updateSessionSchema = z.object({
  id: z.string().min(1),
  startsAt: z.string().min(1, "Seleziona data e ora"),
  durationMin: z.coerce.number().int().min(15).max(240),
  locationType: z.nativeEnum(LocationType),

  // ✅ REQUIRED: vogliamo sempre poterlo cambiare in edit
  status: z.nativeEnum(AppointmentStatus),

  price: z.string().optional().or(z.literal("")),
  isPaid: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().optional().or(z.literal("")),

  location: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function updateSession(
  _prevState: { ok: boolean; error: Record<string, string[]> },
  formData: FormData
): Promise<CreateSessionState> {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = updateSessionSchema.safeParse({
    id: formData.get("id")?.toString(),
    startsAt: formData.get("startsAt")?.toString(),
    durationMin: formData.get("durationMin"),
    locationType: formData.get("locationType")?.toString(),

    status: formData.get("status")?.toString(),

    location: formData.get("location")?.toString(),
    notes: formData.get("notes")?.toString(),

    price: formData.get("price")?.toString(),
    isPaid: formData.get("isPaid")?.toString(),
    paymentMethod: formData.get("paymentMethod")?.toString(),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const { id, startsAt, durationMin, locationType, status } = parsed.data;

  const appt = await prisma.appointment.findFirst({
    where: {
      id,
      tenantId: tenant.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    select: {
      id: true,
      paidAt: true,
      client: { select: { slug: true } },
    },
  });

  if (!appt) {
    return { ok: false as const, error: { id: ["Sessione non trovata"] } };
  }

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return { ok: false as const, error: { startsAt: ["Data/ora non valida"] } };
  }

  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  const priceCents = parseEuroToCents(parsed.data.price);
  const paid = parsed.data.isPaid === "on";

  // ✅ paidAt smart:
  // - se CANCELED => mai pagata
  // - se paid ON  => mantieni paidAt se già esiste, altrimenti now
  // - se paid OFF => null
  const nextPaidAt =
    status === "CANCELED" ? null : paid ? appt.paidAt ?? new Date() : null;

  await prisma.appointment.update({
    where: { id: appt.id },
    data: {
      startsAt: start,
      endsAt: end,
      locationType,
      location: parsed.data.location?.trim() || null,
      notes: parsed.data.notes?.trim() || null,

      status, // ✅ sempre aggiornato

      priceCents,
      currency: priceCents != null ? "EUR" : null,
      paidAt: nextPaidAt,
      paymentMethod: parsed.data.paymentMethod?.trim() || null,
    },
  });

  revalidatePath("/app/booking");
  revalidatePath(`/app/clients/${appt.client.slug}`);

  redirect(`/app/clients/${appt.client.slug}?tab=sessions`);
}

/* ---------------------------- DUPLICATE --------------------------- */

export async function duplicateSession(
  _prevState: { ok: boolean; error: Record<string, string[]> },
  formData: FormData
): Promise<CreateSessionState> {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const sourceId = String(formData.get("sourceId") ?? "").trim();
  if (!sourceId)
    return { ok: false as const, error: { sourceId: ["ID mancante"] } };

  const src = await prisma.appointment.findFirst({
    where: {
      id: sourceId,
      tenantId: tenant.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    select: {
      clientId: true,
      startsAt: true,
      endsAt: true,
      locationType: true,
      location: true,
      notes: true,
      priceCents: true,
      currency: true,
      paymentMethod: true,
      client: { select: { slug: true } },
    },
  });

  if (!src) {
    return {
      ok: false as const,
      error: { sourceId: ["Sessione sorgente non trovata"] },
    };
  }

  // di default duplichiamo "domani stessa ora"
  const start = new Date(src.startsAt);
  start.setDate(start.getDate() + 1);

  const durationMin = Math.max(
    15,
    Math.round(
      (new Date(src.endsAt).getTime() - new Date(src.startsAt).getTime()) /
        60000
    )
  );

  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  const created = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      clientId: src.clientId,
      startsAt: start,
      endsAt: end,
      locationType: src.locationType,
      location: src.location,
      notes: src.notes,
      status: "SCHEDULED",

      priceCents: src.priceCents ?? null,
      currency: src.priceCents != null ? src.currency ?? "EUR" : null,
      paidAt: null, // duplicata = non pagata
      paymentMethod: src.paymentMethod ?? null,
    },
    select: { id: true },
  });

  revalidatePath("/app/booking");
  revalidatePath(`/app/clients/${src.client.slug}`);

  redirect(`/app/booking/edit?id=${created.id}`);
}
