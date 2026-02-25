"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  appointmentId: z.string().min(1),
  workoutTemplateId: z.string().min(1),
  clientId: z.string().min(1),
});

export async function attachWorkoutToSession(formData: FormData) {
  console.log("ENTRO");
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = schema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    workoutTemplateId: String(formData.get("workoutTemplateId") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const { appointmentId, workoutTemplateId } = parsed.data;

  // 1) Appointment + client slug
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
  if (!appt) return { ok: false as const };

  // 2) Se già attaccata -> redirect (idempotenza)
  const existing = await prisma.appointmentWorkout.findFirst({
    where: { tenantId: tenant.id, appointmentId: appt.id },
    select: { workoutSessionId: true },
  });

  if (existing?.workoutSessionId) {
    console.log("GIA ATTACCATA");
    revalidatePath(`/app/clients/${appt.client.slug}?tab=sessions`);
    redirect(
      `/app/sessions/${appt.id}/workout?ws=${existing.workoutSessionId}`
    );
  }

  // 3) Template (con items)
  const tpl = await prisma.workoutTemplate.findFirst({
    where: { id: workoutTemplateId, tenantId: tenant.id, isArchived: false },
    select: {
      id: true,
      title: true,
      notes: true,
      items: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          globalExerciseId: true,
          tenantExerciseId: true,
          nameSnapshot: true,
          tipsSnapshot: true,
          // se non li hai in WorkoutItem, lascia null
          sets: true,
          reps: true,
          restSec: true,
          tempo: true,
          rpe: true,
          loadsKg: true,
          restSecBySet: true,
          itemNotes: true,
        },
      },
    },
  });
  if (!tpl) return { ok: false as const };

  // 4) Transaction “seria”
  const { wsId } = await prisma.$transaction(async (tx) => {
    // 4.1) Plan attivo: riusa se c’è, altrimenti crea
    let plan = await tx.workoutPlan.findFirst({
      where: {
        tenantId: tenant.id,
        clientId: appt.clientId,
        status: "active",
      },
      select: { id: true, clientId: true, currentVersion: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!plan) {
      plan = await tx.workoutPlan.create({
        data: {
          tenantId: tenant.id,
          clientId: appt.clientId,
          workoutTemplateId: tpl.id,
          title: tpl.title,
          notes: tpl.notes ?? null,
          status: "active",
          currentVersion: 1,
        },
        select: { id: true, clientId: true, currentVersion: true },
      });
      console.log("Piano: " + plan);
    }

    // 4.2) Nuova versione (incrementale) = snapshot del template
    const latest = await tx.workoutPlanVersion.findFirst({
      where: { tenantId: tenant.id, planId: plan.id },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (latest?.version ?? 0) + 1;

    const pv = await tx.workoutPlanVersion.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        version: nextVersion,
        title: tpl.title,
        notes: tpl.notes ?? null,
        items: {
          create: tpl.items.map((it) => ({
            tenantId: tenant.id,
            order: it.order,
            globalExerciseId: it.globalExerciseId ?? null,
            tenantExerciseId: it.tenantExerciseId ?? null,

            nameSnapshot: it.nameSnapshot ?? "Esercizio",
            tipsSnapshot: it.tipsSnapshot ?? null,
            imageUrlSnapshot: null,
            tagsSnapshot: [],

            sets: it.sets ?? null,
            reps: it.reps ?? null,
            restSec: it.restSec ?? null,
            tempo: it.tempo ?? null,
            rpe: it.rpe ?? null,

            loadsKg: it.loadsKg ?? [],
            restSecBySet: it.restSecBySet ?? [],
            itemNotes: it.itemNotes ?? null,
          })),
        },
      },
      select: { id: true, version: true },
    });

    // 4.3) aggiorna currentVersion sul plan
    await tx.workoutPlan.update({
      where: { id: plan.id },
      data: { currentVersion: pv.version, workoutTemplateId: tpl.id },
      select: { id: true },
    });

    // 4.4) crea WorkoutSession (legata all’appuntamento)
    const ws = await tx.workoutSession.create({
      data: {
        tenantId: tenant.id,
        clientId: plan.clientId,
        planId: plan.id,
        planVersionId: pv.id,
        appointmentId: appt.id,
        status: "planned",
      },
      select: { id: true },
    });

    // 4.5) copia items dalla planVersion dentro session items
    const pvItems = await tx.workoutPlanVersionItem.findMany({
      where: { tenantId: tenant.id, planVersionId: pv.id },
      orderBy: { order: "asc" },
      select: {
        order: true,
        globalExerciseId: true,
        tenantExerciseId: true,
        nameSnapshot: true,
        tipsSnapshot: true,
        imageUrlSnapshot: true,
        tagsSnapshot: true,
        sets: true,
        reps: true,
        restSec: true,
        tempo: true,
        rpe: true,
        loadsKg: true,
        restSecBySet: true,
        itemNotes: true,
      },
    });

    if (pvItems.length) {
      await tx.workoutSessionItem.createMany({
        data: pvItems.map((it) => ({
          tenantId: tenant.id,
          sessionId: ws.id,
          order: it.order,
          globalExerciseId: it.globalExerciseId ?? null,
          tenantExerciseId: it.tenantExerciseId ?? null,

          nameSnapshot: it.nameSnapshot,
          tipsSnapshot: it.tipsSnapshot ?? null,
          imageUrlSnapshot: it.imageUrlSnapshot ?? null,
          tagsSnapshot: it.tagsSnapshot ?? [],

          sets: it.sets ?? null,
          reps: it.reps ?? null,
          restSec: it.restSec ?? null,
          tempo: it.tempo ?? null,
          rpe: it.rpe ?? null,

          loadsKg: it.loadsKg ?? [],
          restSecBySet: it.restSecBySet ?? [],
          itemNotes: it.itemNotes ?? null,

          performedLoadsKg: [],
          performedRestSecBySet: [],
          performedRepsBySet: [],
        })),
      });
    }

    // 4.6) lega appointment ↔ workout (upsert anti doppio click)
    await tx.appointmentWorkout.upsert({
      where: { appointmentId: appt.id }, // richiede appointmentId @unique in AppointmentWorkout
      create: {
        tenantId: tenant.id,
        appointmentId: appt.id,
        planId: plan.id,
        planVersionId: pv.id,
        workoutSessionId: ws.id,
      },
      update: {
        planId: plan.id,
        planVersionId: pv.id,
        workoutSessionId: ws.id,
      },
      select: { id: true },
    });

    return { wsId: ws.id };
  });

  revalidatePath(`/app/clients/${appt.client.slug}?tab=sessions`);
  revalidatePath(`/app/sessions/${appt.id}/workout`);
  // redirect(`/app/sessions/${appt.id}/workout?ws=${wsId}&flash=attached`);
}

export async function attachNewWorkoutToSession(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = schema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    workoutTemplateId: String(formData.get("workoutTemplateId") ?? ""),
    clientId: String(formData.get("clientId") ?? ""),
  });

  if (!parsed.success) {
    console.log(parsed.error.format());
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  console.log("DATA: " + JSON.stringify(parsed.data));
  const { appointmentId, workoutTemplateId, clientId } = parsed.data;

  // (opzionale ma consigliato) verifica che il template esista e appartenga al tenant
  const template = await prisma.workoutTemplate.findFirst({
    where: {
      id: workoutTemplateId,
      tenantId: tenant.id,
    },
    select: { id: true },
  });

  if (!template) {
    return {
      ok: false as const,
      error: { workoutTemplateId: ["Template non valido"] },
    };
  }

  // aggiorna appointment (questo è il punto chiave)
  const updated = await prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      tenantId: tenant.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    data: {
      workoutTemplateId: workoutTemplateId, // ✅ salva l’ObjectId (string) nel campo
      // workoutSnapshotJson: ... // se vuoi “fotografare” la scheda al momento dell’assegnazione
    },
  });

  if (updated.count === 0) {
    return {
      ok: false as const,
      error: { appointmentId: ["Appuntamento non trovato"] },
    };
  }

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
    },
    select: {
      slug: true,
    },
  });
  // return { ok: true as const };
  redirect(`/app/clients/${client?.slug}?tab=sessions`);
}
