"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  clientId: z.string().min(1),
  title: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  archivePreviousActivePlan: z.literal("true").optional(),
  templateIds: z.array(z.string().min(1)).min(1),
});

export async function assignWorkoutTemplateToClient(
  formData: FormData
): Promise<void> {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = schema.safeParse({
    clientId: String(formData.get("clientId") ?? ""),
    title: normalize(formData.get("title")),
    notes: normalize(formData.get("notes")),
    archivePreviousActivePlan:
      formData.get("archivePreviousActivePlan") === "true" ? "true" : undefined,
    templateIds: formData
      .getAll("templateIds")
      .map((v) => String(v).trim())
      .filter(Boolean),
  });

  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const archivePrevious = parsed.data.archivePreviousActivePlan === "true";

  const client = await prisma.client.findFirst({
    where: {
      id: parsed.data.clientId,
      tenantId: tenant.id,
      OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
    },
    select: {
      id: true,
      slug: true,
      fullName: true,
    },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  const templates = await prisma.workoutTemplate.findMany({
    where: {
      id: { in: parsed.data.templateIds },
      tenantId: tenant.id,
      isArchived: false,
    },
    include: {
      items: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          globalExerciseId: true,
          tenantExerciseId: true,
          sets: true,
          reps: true,
          restSec: true,
          restSecBySet: true,
          tempo: true,
          rpe: true,
          loadsKg: true,
          itemNotes: true,
          nameSnapshot: true,
          tipsSnapshot: true,
          exercise: {
            select: {
              imageUrl: true,
              tags: true,
            },
          },
          globalExercise: {
            select: {
              name: true,
              description: true,
              imageUrl: true,
              tags: true,
            },
          },
          tenantExercise: {
            select: {
              name: true,
              coachTips: true,
              imageUrl: true,
              tags: true,
            },
          },
        },
      },
    },
  });

  if (templates.length === 0) {
    throw new Error("No valid templates found");
  }

  const templateOrderMap = new Map(
    parsed.data.templateIds.map((id, index) => [id, index])
  );

  const orderedTemplates = [...templates].sort((a, b) => {
    const ai = templateOrderMap.get(a.id) ?? 9999;
    const bi = templateOrderMap.get(b.id) ?? 9999;
    return ai - bi;
  });

  const title =
    parsed.data.title?.trim() ||
    `Scheda - ${client.fullName}`;

  const notes = parsed.data.notes?.trim() || null;

  await prisma.$transaction(async (tx) => {
    if (archivePrevious) {
      await tx.workoutPlan.updateMany({
        where: {
          tenantId: tenant.id,
          clientId: client.id,
          status: "active",
        },
        data: {
          status: "ended",
          endAt: new Date(),
        },
      });
    }

    const plan = await tx.workoutPlan.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        title,
        notes,
        status: "active",
        startAt: new Date(),
        currentVersion: 1,
        workoutTemplateId: orderedTemplates[0]?.id ?? undefined,
      },
      select: {
        id: true,
      },
    });

    const version = await tx.workoutPlanVersion.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        version: 1,
        title,
        notes,
      },
      select: {
        id: true,
      },
    });

    for (let templateIndex = 0; templateIndex < orderedTemplates.length; templateIndex++) {
      const template = orderedTemplates[templateIndex];
      const workoutOrder = templateIndex + 1;
      const workoutName = template.title;
      const workoutKey = template.id;

      for (const item of template.items) {
        const fallbackName =
          item.nameSnapshot ||
          item.tenantExercise?.name ||
          item.globalExercise?.name ||
          "Exercise";

        const fallbackTips =
          item.tipsSnapshot ||
          item.tenantExercise?.coachTips ||
          item.globalExercise?.description ||
          null;

        const fallbackImage =
          item.exercise?.imageUrl ||
          item.tenantExercise?.imageUrl ||
          item.globalExercise?.imageUrl ||
          null;

        const fallbackTags =
          item.exercise?.tags?.length
            ? item.exercise.tags
            : item.tenantExercise?.tags?.length
            ? item.tenantExercise.tags
            : item.globalExercise?.tags ?? [];

        await tx.workoutPlanVersionItem.create({
          data: {
            tenantId: tenant.id,
            planVersionId: version.id,

            workoutKey,
            workoutNameSnapshot: workoutName,
            workoutOrder,

            order: item.order,

            globalExerciseId: item.globalExerciseId ?? undefined,
            tenantExerciseId: item.tenantExerciseId ?? undefined,

            nameSnapshot: fallbackName,
            tipsSnapshot: fallbackTips,
            imageUrlSnapshot: fallbackImage,
            tagsSnapshot: fallbackTags,

            sets: item.sets ?? undefined,
            reps: item.reps ?? undefined,
            restSec: item.restSec ?? undefined,
            tempo: item.tempo ?? undefined,
            rpe: item.rpe ?? undefined,

            loadsKg: item.loadsKg ?? [],
            restSecBySet: item.restSecBySet ?? [],

            itemNotes: item.itemNotes ?? undefined,
          },
        });
      }
    }
  });

  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${client.slug}`);
  revalidatePath("/c/workouts");
}

function normalize(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}