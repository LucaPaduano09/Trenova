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

  const normalized = raw.replace(",", ".");
  const n = Number(normalized);

  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

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

const updateSessionSchema = z.object({
  id: z.string().min(1),
  startsAt: z.string().min(1, "Seleziona data e ora"),
  durationMin: z.coerce.number().int().min(15).max(240),
  locationType: z.nativeEnum(LocationType),

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

      status,

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
      paidAt: null,
      paymentMethod: src.paymentMethod ?? null,
    },
    select: { id: true },
  });

  revalidatePath("/app/booking");
  revalidatePath(`/app/clients/${src.client.slug}`);

  redirect(`/app/booking/edit?id=${created.id}`);
}
const createSessionFromDashboardSchema = z.object({
  clientId: z.string().min(1, "Seleziona un cliente"),
  date: z.string().min(1, "Data mancante"),
  time: z.string().min(1, "Ora mancante"),
  durationMin: z.coerce.number().int().min(15).max(240),
  locationType: z.nativeEnum(LocationType),

  price: z.string().optional().or(z.literal("")),
  isPaid: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().optional().or(z.literal("")),
  workoutTemplateId: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function createSessionFromDashboard(
  _prevState: { ok: boolean; error: Record<string, string[]> },
  formData: FormData
): Promise<CreateSessionState> {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = createSessionFromDashboardSchema.safeParse({
    clientId: formData.get("clientId")?.toString(),
    date: formData.get("date")?.toString(),
    time: formData.get("time")?.toString(),
    durationMin: formData.get("durationMin"),
    locationType: formData.get("locationType")?.toString(),

    location: formData.get("location")?.toString(),
    notes: formData.get("notes")?.toString(),
    workoutTemplateId: formData.get("workoutTemplateId")?.toString(),
    price: formData.get("price")?.toString(),
    isPaid: formData.get("isPaid")?.toString(),
    paymentMethod: formData.get("paymentMethod")?.toString(),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, tenantId: tenant.id },
    select: { id: true },
  });

  if (!client) {
    return { ok: false as const, error: { clientId: ["Cliente non trovato"] } };
  }

  const start = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  if (Number.isNaN(start.getTime())) {
    return { ok: false as const, error: { time: ["Data/ora non valida"] } };
  }

  const end = new Date(start.getTime() + parsed.data.durationMin * 60 * 1000);

  const priceCents = parseEuroToCents(parsed.data.price);
  const paid = parsed.data.isPaid === "on";
  const workoutTemplateId = parsed.data.workoutTemplateId?.trim() || null;

  if (workoutTemplateId) {
    const w = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, tenantId: tenant.id, isArchived: false },
      select: { id: true },
    });

    if (!w) {
      return {
        ok: false as const,
        error: { workoutTemplateId: ["Workout non trovato"] },
      };
    }
  }
  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      status: { not: "CANCELED" },

      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],

      startsAt: { lt: end },
      endsAt: { gt: start },
    },
    select: { id: true },
  });

  if (conflict) {
    return {
      ok: false as const,
      error: {
        time: ["Esiste già una sessione in questo intervallo orario"],
      },
    };
  }
  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      clientId: client.id,
      startsAt: start,
      endsAt: end,
      locationType: parsed.data.locationType,
      location: parsed.data.location?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      status: "SCHEDULED",
      workoutTemplateId: workoutTemplateId ?? null,
      priceCents,
      currency: priceCents != null ? "EUR" : null,
      paidAt: paid ? new Date() : null,
      paymentMethod: parsed.data.paymentMethod?.trim() || null,
    },
  });

  revalidatePath("/app/dashboard");
  revalidatePath("/app/booking");

  return { ok: true as const, error: {} };
}
