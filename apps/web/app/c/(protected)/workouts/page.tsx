import { getCurrentClient } from "@/lib/auth/getCurrentClient";
import { prisma } from "@/lib/db";
import WorkoutsView from "../_components/WorkoutsView";

type WorkoutItemView = {
  id: string;
  order: number;
  name: string;
  tips: string | null;
  imageUrl: string | null;
  sets: number | null;
  reps: string | null;
  restSec: number | null;
  tempo: string | null;
  rpe: number | null;
  loadsKg: number[];
  restSecBySet: number[];
  itemNotes: string | null;
  tags: string[];
};

type WorkoutGroupView = {
  key: string;
  name: string;
  order: number;
  items: WorkoutItemView[];
};

export default async function ClientWorkoutsPage() {
  const { client } = await getCurrentClient();

  const activePlan = await prisma.workoutPlan.findFirst({
    where: {
      tenantId: client.tenantId ?? undefined,
      clientId: client.id,
      status: "active",
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      notes: true,
      currentVersion: true,
      startAt: true,
      updatedAt: true,
    },
  });

  if (!activePlan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Workout</h1>
          <p className="mt-1 text-sm text-white/60">
            La tua programmazione attuale comparirà qui.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-white/70 backdrop-blur-xl">
          Nessuna scheda attiva assegnata al momento.
        </div>
      </div>
    );
  }

  const currentVersion = await prisma.workoutPlanVersion.findFirst({
    where: {
      tenantId: client.tenantId ?? undefined,
      planId: activePlan.id,
      version: activePlan.currentVersion,
    },
    select: {
      id: true,
      version: true,
      title: true,
      notes: true,
      items: {
        orderBy: [{ workoutOrder: "asc" }, { order: "asc" }],
        select: {
          id: true,
          order: true,
          workoutKey: true,
          workoutNameSnapshot: true,
          workoutOrder: true,
          nameSnapshot: true,
          tipsSnapshot: true,
          imageUrlSnapshot: true,
          sets: true,
          reps: true,
          restSec: true,
          tempo: true,
          rpe: true,
          loadsKg: true,
          restSecBySet: true,
          itemNotes: true,
          tagsSnapshot: true,
        },
      },
    },
  });

  if (!currentVersion || currentVersion.items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Workout</h1>
          <p className="mt-1 text-sm text-white/60">
            La tua programmazione attuale comparirà qui.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-white/70 backdrop-blur-xl">
          Nessuna versione valida della scheda è disponibile al momento.
        </div>
      </div>
    );
  }

  // DEBUG TEMPORANEO:
  // controlla in terminale server se i campi workout* sono davvero valorizzati
  console.log(
    currentVersion.items.map((item) => ({
      name: item.nameSnapshot,
      workoutKey: item.workoutKey,
      workoutNameSnapshot: item.workoutNameSnapshot,
      workoutOrder: item.workoutOrder,
    }))
  );

  const groupsMap = new Map<string, WorkoutGroupView>();

  for (const item of currentVersion.items) {
    const normalizedWorkoutName =
      item.workoutNameSnapshot?.trim() || "Workout";

    const normalizedWorkoutOrder = item.workoutOrder ?? 0;

    const groupKey =
      item.workoutKey?.trim() ||
      `${normalizedWorkoutOrder}-${normalizedWorkoutName}`;

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        key: groupKey,
        name: normalizedWorkoutName,
        order: normalizedWorkoutOrder,
        items: [],
      });
    }

    groupsMap.get(groupKey)!.items.push({
      id: item.id,
      order: item.order,
      name: item.nameSnapshot,
      tips: item.tipsSnapshot ?? null,
      imageUrl: item.imageUrlSnapshot ?? null,
      sets: item.sets ?? null,
      reps: item.reps ?? null,
      restSec: item.restSec ?? null,
      tempo: item.tempo ?? null,
      rpe: item.rpe ?? null,
      loadsKg: item.loadsKg ?? [],
      restSecBySet: item.restSecBySet ?? [],
      itemNotes: item.itemNotes ?? null,
      tags: item.tagsSnapshot ?? [],
    });
  }

  const workouts = Array.from(groupsMap.values())
    .sort((a, b) => a.order - b.order)
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => a.order - b.order),
    }));

  console.log(
    "Grouped workouts:",
    workouts.map((w) => ({
      key: w.key,
      name: w.name,
      order: w.order,
      count: w.items.length,
    }))
  );

  return (
    <WorkoutsView
      planName={activePlan.title}
      planNotes={activePlan.notes ?? null}
      versionTitle={currentVersion.title}
      versionNumber={currentVersion.version}
      workouts={workouts}
    />
  );
}