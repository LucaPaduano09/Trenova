"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const attachNewSchema = z.object({
  appointmentId: z.string().min(1),
  workoutTemplateId: z.string().min(1),
});

export async function attachNewWorkoutToSession(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = attachNewSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    workoutTemplateId: String(formData.get("workoutTemplateId") ?? ""),
  });

  if (!parsed.success) {
    console.log(parsed.error.format());
    throw new Error("Validazione non valida");
  }

  const { appointmentId, workoutTemplateId } = parsed.data;

  const appt = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      tenantId: tenant.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    select: {
      id: true,
      clientId: true,
      client: { select: { slug: true } },
    },
  });

  if (!appt) throw new Error("Appuntamento non trovato");

  const template = await prisma.workoutTemplate.findFirst({
    where: { id: workoutTemplateId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!template) throw new Error("Template non trovato");

  const updated = await prisma.appointment.updateMany({
    where: {
      id: appt.id,
      tenantId: tenant.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    data: { workoutTemplateId },
  });

  if (updated.count === 0) throw new Error("Appuntamento non trovato");

  redirect(`/app/clients/${appt.client.slug}?tab=sessions`);
}
