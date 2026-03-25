"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

function parseRef(refRaw?: unknown): { kind: "c" | "g"; id: string } | null {
  const ref = String(refRaw ?? "");
  if (!ref) return null;
  const [kind, id] = ref.split(":");
  if ((kind === "c" || kind === "g") && id) return { kind, id };
  return null;
}
function parseLoadsKg(raw?: string | null): number[] {
  const s = (raw ?? "").trim();
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim().replace(",", "."))
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .slice(0, 100);
}

function normalizeLoadsKg(loads: number[], sets: number | null): number[] {
  if (!sets || !Number.isFinite(sets) || sets <= 0) return loads;

  if (loads.length === 0) return [];
  if (loads.length === sets) return loads;

  if (loads.length > sets) return loads.slice(0, sets);

  const out = loads.slice();
  const last = out[out.length - 1] ?? 0;
  while (out.length < sets) out.push(last);
  return out;
}
function parseCsvNumbers(raw?: string | null) {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x.replace(",", ".")))
    .filter((n) => Number.isFinite(n));
}

function normalizeBySets<T extends number>(arr: T[], sets: number | null): T[] {
  if (!sets || sets <= 0) return arr;
  if (arr.length === 0) return [];
  if (arr.length === sets) return arr;
  if (arr.length === 1) return Array.from({ length: sets }, () => arr[0]);
  if (arr.length < sets) {
    const last = arr[arr.length - 1];
    return [...arr, ...Array.from({ length: sets - arr.length }, () => last)];
  }
  return arr.slice(0, sets);
}
async function resolveExerciseForItem(args: { tenantId: string; ref: string }) {
  const parsed = parseRef(args.ref);
  if (!parsed) throw new Error("Ref esercizio non valida");

  if (parsed.kind === "c") {

    const ex = await prisma.tenantExercise.findFirst({
      where: { id: parsed.id, tenantId: args.tenantId },
      select: { id: true, name: true, coachTips: true },
    });
    if (!ex) throw new Error("Esercizio custom non trovato");
    return {
      kind: "custom" as const,
      tenantExerciseId: ex.id,
      globalExerciseId: null,
      nameSnapshot: ex.name,
      tipsSnapshot: ex.coachTips ?? null,
    };
  }

  const g = await prisma.globalExercise.findFirst({
    where: { id: parsed.id },
    select: { id: true, name: true },
  });
  if (!g) throw new Error("Esercizio globale non trovato");

  const o = await prisma.tenantExerciseOverride.findUnique({
    where: {
      tenantId_globalExerciseId: {
        tenantId: args.tenantId,
        globalExerciseId: g.id,
      },
    },
    select: { nameOverride: true, coachTips: true, isHidden: true },
  });

  if (o?.isHidden) throw new Error("Questo esercizio è nascosto per il tenant");

  const name = o?.nameOverride ?? g.name;
  const tips = o?.coachTips ?? null;

  return {
    kind: "global" as const,
    tenantExerciseId: null,
    globalExerciseId: g.id,
    nameSnapshot: name,
    tipsSnapshot: tips,
  };
}

const createWorkoutSchema = z.object({
  title: z.string().min(2, "Titolo troppo corto"),
  notes: z.string().optional().or(z.literal("")),
  restSecBySet: z.string().optional().or(z.literal("")),
});

const updateWorkoutSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2, "Titolo troppo corto"),
  notes: z.string().optional().or(z.literal("")),
  isArchived: z.string().optional().or(z.literal("")),
});

const addItemSchema = z.object({
  workoutId: z.string().min(1),
  ref: z.string().min(3),
  sets: z.string().optional().or(z.literal("")),
  reps: z.string().optional().or(z.literal("")),
  restSec: z.string().optional().or(z.literal("")),
  restSecBySet: z.string().optional().or(z.literal("")),
  tempo: z.string().optional().or(z.literal("")),
  rpe: z.string().optional().or(z.literal("")),
  itemNotes: z.string().optional().or(z.literal("")),
  loadsKg: z.string().optional().or(z.literal("")),
});

const updateItemSchema = z.object({
  itemId: z.string().min(1),
  sets: z.string().optional().or(z.literal("")),
  reps: z.string().optional().or(z.literal("")),
  restSec: z.string().optional().or(z.literal("")),
  restSecBySet: z.string().optional().or(z.literal("")),
  tempo: z.string().optional().or(z.literal("")),
  rpe: z.string().optional().or(z.literal("")),
  itemNotes: z.string().optional().or(z.literal("")),
  loadsKg: z.string().optional().or(z.literal("")),
});

const moveItemSchema = z.object({
  workoutId: z.string().min(1),
  itemId: z.string().min(1),
  dir: z.enum(["up", "down"]),
});

const deleteItemSchema = z.object({
  workoutId: z.string().min(1),
  itemId: z.string().min(1),
});

export async function createWorkoutTemplate(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = createWorkoutSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    restSecBySet: String(formData.get("restSecBySet") ?? ""),
  });

  if (!parsed.success) {
    throw new Error("Validazione non valida");
  }
  const restRaw = parseCsvNumbers(parsed.data.restSecBySet);

  const w = await prisma.workoutTemplate.create({
    data: {
      tenantId: tenant.id,
      title: parsed.data.title.trim(),
      notes: parsed.data.notes?.trim() || null,
      isArchived: false,
    },
    select: { id: true },
  });

  revalidatePath("/app/workouts");
  redirect(`/app/workouts/${w.id}/edit?flash=created`);
}

export async function updateWorkoutTemplate(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = updateWorkoutSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    isArchived: String(formData.get("isArchived") ?? ""),
  });

  if (!parsed.success) {
    throw new Error("Validazione non valida");
  }

  const w = await prisma.workoutTemplate.findFirst({
    where: { id: parsed.data.id, tenantId: tenant.id },
    select: { id: true },
  });
  if (!w) {
    throw new Error("Workout non trovato");
  }

  await prisma.workoutTemplate.update({
    where: { id: w.id },
    data: {
      title: parsed.data.title.trim(),
      notes: parsed.data.notes?.trim() || null,
      isArchived: parsed.data.isArchived === "on",
    },
  });

  revalidatePath("/app/workouts");
  revalidatePath(`/app/workouts/${w.id}/edit`);
  redirect(`/app/workouts/${w.id}/edit?flash=updated`);
}

export async function listWorkoutTemplates(filters?: {
  q?: string;
  state?: "active" | "archived" | "all";
}) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const q = (filters?.q ?? "").trim();
  const state = filters?.state ?? "active";

  const where: any = { tenantId: tenant.id };
  if (state === "active") where.isArchived = false;
  if (state === "archived") where.isArchived = true;

  if (q) {
    where.title = { contains: q, mode: "insensitive" };
  }

  return prisma.workoutTemplate.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      isArchived: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });
}

export async function getWorkoutTemplate(id: string) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  return prisma.workoutTemplate.findFirst({
    where: { id, tenantId: tenant.id },
    select: {
      id: true,
      title: true,
      notes: true,
      isArchived: true,
      updatedAt: true,
      items: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          sets: true,
          reps: true,
          restSec: true,
          tempo: true,
          rpe: true,
          itemNotes: true,
          nameSnapshot: true,
          tipsSnapshot: true,
          globalExerciseId: true,
          tenantExerciseId: true,
          restSecBySet: true,
        },
      },
    },
  });
}

export async function addWorkoutItem(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = addItemSchema.safeParse({
    workoutId: String(formData.get("workoutId") ?? ""),
    ref: String(formData.get("ref") ?? ""),
    sets: String(formData.get("sets") ?? ""),
    reps: String(formData.get("reps") ?? ""),
    restSec: String(formData.get("restSec") ?? ""),
    restSecBySet: String(formData.get("restSecBySet") ?? ""),
    tempo: String(formData.get("tempo") ?? ""),
    rpe: String(formData.get("rpe") ?? ""),
    itemNotes: String(formData.get("itemNotes") ?? ""),
    loadsKg: String(formData.get("loadsKg") ?? ""),
  });

  if (!parsed.success) {
    throw new Error("Validazione non valida");
  }

  const w = await prisma.workoutTemplate.findFirst({
    where: { id: parsed.data.workoutId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!w) {
    throw new Error("Workout non valida");
  }

  const resolved = await resolveExerciseForItem({
    tenantId: tenant.id,
    ref: parsed.data.ref,
  });

  const last = await prisma.workoutItem.findFirst({
    where: { tenantId: tenant.id, workoutId: w.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (last?.order ?? 0) + 1;

  const sets = parsed.data.sets?.trim() ? Number(parsed.data.sets) : null;
  const restSec = parsed.data.restSec?.trim()
    ? Number(parsed.data.restSec)
    : null;
  const rpe = parsed.data.rpe?.trim() ? Number(parsed.data.rpe) : null;

  const setsN = Number.isFinite(sets as any) ? (sets as number) : null;

  const loadsKgRaw = parseCsvNumbers(parsed.data.loadsKg);
  const loadsKg = normalizeBySets(loadsKgRaw, setsN);

  const restBySetRaw = parseCsvNumbers(parsed.data.restSecBySet).map((n) =>
    Math.round(n)
  );
  const restSecBySet = normalizeBySets(restBySetRaw, setsN);

  await prisma.workoutItem.create({
    data: {
      tenantId: tenant.id,
      workoutId: w.id,
      order: nextOrder,

      exerciseId:
        resolved.kind === "global"
          ? resolved.globalExerciseId!
          : resolved.tenantExerciseId!,
      globalExerciseId: resolved.globalExerciseId,
      tenantExerciseId: resolved.tenantExerciseId,

      sets: setsN,
      reps: parsed.data.reps?.trim() || null,
      restSec: Number.isFinite(restSec as any) ? restSec : null,
      restSecBySet,
      loadsKg,

      tempo: parsed.data.tempo?.trim() || null,
      rpe: Number.isFinite(rpe as any) ? rpe : null,
      itemNotes: parsed.data.itemNotes?.trim() || null,

      nameSnapshot: resolved.nameSnapshot,
      tipsSnapshot: resolved.tipsSnapshot,
    },
    select: { id: true },
  });

  revalidatePath(`/app/workouts/${w.id}/edit`);
  redirect(`/app/workouts/${w.id}/edit?flash=item-added`);
}

export async function updateWorkoutItem(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = updateItemSchema.safeParse({
    itemId: String(formData.get("itemId") ?? ""),
    sets: String(formData.get("sets") ?? ""),
    reps: String(formData.get("reps") ?? ""),
    restSec: String(formData.get("restSec") ?? ""),
    restSecBySet: String(formData.get("restSecBySet") ?? ""),
    tempo: String(formData.get("tempo") ?? ""),
    rpe: String(formData.get("rpe") ?? ""),
    itemNotes: String(formData.get("itemNotes") ?? ""),
    loadsKg: String(formData.get("loadsKg") ?? ""),
  });

  if (!parsed.success) {
    throw new Error("Validazione non valida");
  }

  const item = await prisma.workoutItem.findFirst({
    where: { id: parsed.data.itemId, tenantId: tenant.id },
    select: { id: true, workoutId: true },
  });
  if (!item) {
    throw new Error("Workout non valida");
  }

  const sets = parsed.data.sets?.trim() ? Number(parsed.data.sets) : null;
  const restSec = parsed.data.restSec?.trim()
    ? Number(parsed.data.restSec)
    : null;
  const rpe = parsed.data.rpe?.trim() ? Number(parsed.data.rpe) : null;

  const setsN = Number.isFinite(sets as any) ? (sets as number) : null;

  const loadsKgRaw = parseCsvNumbers(parsed.data.loadsKg);
  const loadsKg = normalizeBySets(loadsKgRaw, setsN);

  const restBySetRaw = parseCsvNumbers(parsed.data.restSecBySet).map((n) =>
    Math.round(n)
  );
  const restSecBySet = normalizeBySets(restBySetRaw, setsN);

  await prisma.workoutItem.update({
    where: { id: item.id },
    data: {
      sets: setsN,
      reps: parsed.data.reps?.trim() || null,
      restSec: Number.isFinite(restSec as any) ? restSec : null,
      restSecBySet,
      loadsKg,
      tempo: parsed.data.tempo?.trim() || null,
      rpe: Number.isFinite(rpe as any) ? rpe : null,
      itemNotes: parsed.data.itemNotes?.trim() || null,
    },
  });

  revalidatePath(`/app/workouts/${item.workoutId}/edit`);
  redirect(`/app/workouts/${item.workoutId}/edit?flash=item-updated`);
}

export async function moveWorkoutItem(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = moveItemSchema.safeParse({
    workoutId: String(formData.get("workoutId") ?? ""),
    itemId: String(formData.get("itemId") ?? ""),
    dir: String(formData.get("dir") ?? ""),
  });

  if (!parsed.success) {
    throw new Error("Validazione non valida");
  }

  const w = await prisma.workoutTemplate.findFirst({
    where: { id: parsed.data.workoutId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!w) {
    throw new Error("Workout non trovato");
  }

  const items = await prisma.workoutItem.findMany({
    where: { tenantId: tenant.id, workoutId: w.id },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });

  const idx = items.findIndex((x) => x.id === parsed.data.itemId);
  if (idx === -1) {
    throw new Error("workout item non valida");
  }

  const swapWith = parsed.data.dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) {
    redirect(`/app/workouts/${w.id}/edit`);
  }

  const a = items[idx];
  const b = items[swapWith];

  await prisma.$transaction([
    prisma.workoutItem.update({
      where: { id: a.id },
      data: { order: b.order },
    }),
    prisma.workoutItem.update({
      where: { id: b.id },
      data: { order: a.order },
    }),
  ]);

  revalidatePath(`/app/workouts/${w.id}/edit`);
  redirect(`/app/workouts/${w.id}/edit`);
}

export async function deleteWorkoutItem(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = deleteItemSchema.safeParse({
    workoutId: String(formData.get("workoutId") ?? ""),
    itemId: String(formData.get("itemId") ?? ""),
  });

  if (!parsed.success) {
    throw new Error("Validazione non trovata");
  }

  const item = await prisma.workoutItem.findFirst({
    where: {
      id: parsed.data.itemId,
      tenantId: tenant.id,
      workoutId: parsed.data.workoutId,
    },
    select: { id: true, workoutId: true },
  });
  if (!item) {
    throw new Error("Workout non trovato");
  }

  await prisma.workoutItem.delete({ where: { id: item.id } });

  const remaining = await prisma.workoutItem.findMany({
    where: { tenantId: tenant.id, workoutId: item.workoutId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  await prisma.$transaction(
    remaining.map((it, i) =>
      prisma.workoutItem.update({
        where: { id: it.id },
        data: { order: i + 1 },
      })
    )
  );

  revalidatePath(`/app/workouts/${item.workoutId}/edit`);
  redirect(`/app/workouts/${item.workoutId}/edit?flash=item-deleted`);
}
