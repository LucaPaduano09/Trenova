"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LocationType } from "@prisma/client";

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
function parseEuroToCents(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  // accetta "45", "45.5", "45,50"
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);

  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export async function createSession(_prevState: any, formData: FormData) {
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
