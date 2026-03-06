import { getCurrentClient } from "@/lib/auth/getCurrentClient";
import { prisma } from "@/lib/db";
import WorkoutsView from "../_components/WorkoutsView";


export default async function ClientWorkoutsPage() {
  const { client } = await getCurrentClient();

  const activePlan = await prisma.workoutPlan.findFirst({
    where: {
      clientId: client.id,
      status: "active",
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      versions: {
        orderBy: {
          version: "desc",
        },
        take: 1,
        include: {
          items: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              order: true,
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
      },
    },
  });

  if (!activePlan || activePlan.versions.length === 0) {
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

  const latestVersion = activePlan.versions[0];

  return (
    <WorkoutsView
      planName={activePlan.title}
      versionTitle={latestVersion.title}
      items={latestVersion.items.map((item) => ({
        id: item.id,
        order: item.order,
        name: item.nameSnapshot,
        tips: item.tipsSnapshot,
        imageUrl: item.imageUrlSnapshot,
        sets: item.sets,
        reps: item.reps,
        restSec: item.restSec,
        tempo: item.tempo,
        rpe: item.rpe,
        loadsKg: item.loadsKg,
        restSecBySet: item.restSecBySet,
        itemNotes: item.itemNotes,
        tags: item.tagsSnapshot,
      }))}
    />
  );
}