import { assignWorkoutTemplateToClient } from "@/actions/workout-plan";
import { prisma } from "@/lib/db";

export default async function ClientWorkoutsTab({
  tenantId,
  client,
}: {
  tenantId: string;
  client: {
    id: string;
    slug: string;
    createdAt: Date;
    notes?: string | null;
  };
}) {
  const [templates, activePlan, activeVersion] = await Promise.all([
    prisma.workoutTemplate.findMany({
      where: {
        tenantId,
        isArchived: false,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        notes: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.workoutPlan.findFirst({
      where: {
        tenantId,
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
    }),
    prisma.workoutPlan.findFirst({
      where: {
        tenantId,
        clientId: client.id,
        status: "active",
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        currentVersion: true,
      },
    }).then(async (plan) => {
      if (!plan) return null;

      return prisma.workoutPlanVersion.findFirst({
        where: {
          tenantId,
          planId: plan.id,
          version: plan.currentVersion,
        },
        select: {
          id: true,
          items: {
            orderBy: [{ workoutOrder: "asc" }, { order: "asc" }],
            select: {
              id: true,
              workoutKey: true,
              workoutNameSnapshot: true,
              workoutOrder: true,
            },
          },
        },
      });
    }),
  ]);

  const activeWorkoutGroups = activeVersion
    ? Array.from(
        new Map(
          activeVersion.items.map((item) => {
            const key =
              item.workoutKey ||
              `${item.workoutOrder ?? 0}-${item.workoutNameSnapshot ?? "Workout"}`;

            return [
              key,
              {
                key,
                name: item.workoutNameSnapshot || "Workout",
                order: item.workoutOrder ?? 0,
              },
            ] as const;
          })
        ).values()
      ).sort((a, b) => a.order - b.order)
    : [];

  return (
    <div className="space-y-6">
      <section className="cf-card cf-hairline p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold cf-text">
              Componi una scheda
            </h2>
            <p className="mt-1 text-sm cf-muted">
              Seleziona più workout template per costruire una scheda completa da
              assegnare a questo cliente. Ogni template diventerà un workout
              separato nella sua area cliente.
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="mt-6 rounded-2xl border cf-surface p-4 text-sm cf-muted">
            Non hai ancora creato nessun workout template da assegnare.
          </div>
        ) : (
          <form
            action={assignWorkoutTemplateToClient}
            className="mt-6 space-y-6"
          >
            <input type="hidden" name="clientId" value={client.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium cf-text">
                  Titolo scheda
                </label>
                <input
                  name="title"
                  type="text"
                  placeholder="Es. Upper / Lower Split"
                  className="w-full rounded-2xl border cf-surface px-4 py-3 text-sm cf-text outline-none"
                />
                <p className="mt-2 text-xs cf-muted">
                  Se lasci vuoto, Trenova genererà un titolo automatico.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium cf-text">
                  Cliente
                </label>
                <div className="rounded-2xl border cf-surface px-4 py-3 text-sm cf-text">
                  {client.slug}
                </div>
                <p className="mt-2 text-xs cf-muted">
                  La scheda verrà assegnata al cliente corrente.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium cf-text">
                Note scheda (opzionale)
              </label>
              <textarea
                name="notes"
                rows={4}
                placeholder="Aggiungi eventuali indicazioni generali per questa scheda..."
                className="w-full rounded-2xl border cf-surface px-4 py-3 text-sm cf-text outline-none"
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <label className="block text-sm font-medium cf-text">
                    Workout da includere
                  </label>
                  <p className="mt-1 text-xs cf-muted">
                    Seleziona uno o più template. L’ordine di visualizzazione
                    seguirà l’ordine della lista.
                  </p>
                </div>
                <div className="rounded-full border cf-surface px-3 py-1 text-xs cf-muted">
                  {templates.length} template disponibili
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {templates.map((template, index) => (
                  <label
                    key={template.id}
                    className="group flex cursor-pointer items-start gap-3 rounded-2xl border cf-surface p-4 transition hover:-translate-y-[1px]"
                  >
                    <input
                      type="checkbox"
                      name="templateIds"
                      value={template.id}
                      className="mt-1 h-4 w-4 rounded border-neutral-300"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full border cf-surface px-2.5 py-1 text-[11px] cf-muted">
                          Workout {index + 1}
                        </div>
                        <div className="text-sm font-semibold cf-text">
                          {template.title}
                        </div>
                      </div>

                      {template.notes ? (
                        <p className="mt-2 text-sm leading-6 cf-muted">
                          {template.notes}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm cf-muted">
                          Nessuna nota per questo template.
                        </p>
                      )}

                      <div className="mt-3 text-xs cf-faint">
                        {template.items.length} esercizi
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm cf-muted">
              <input
                type="checkbox"
                name="archivePreviousActivePlan"
                value="true"
                className="h-4 w-4 rounded border-neutral-300"
                defaultChecked
              />
              Termina l’eventuale scheda attiva precedente
            </label>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95 dark:bg-white dark:text-neutral-900"
              >
                Assegna scheda workout
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="cf-card cf-hairline p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold cf-text">Scheda attiva</h3>
            <p className="mt-1 text-sm cf-muted">
              Questo è il piano attualmente visibile nell’area workout del
              cliente.
            </p>
          </div>
        </div>

        {!activePlan ? (
          <div className="mt-6 rounded-2xl border cf-surface p-4 text-sm cf-muted">
            Nessuna scheda attiva assegnata al momento.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border cf-surface p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-lg font-semibold cf-text">
                    {activePlan.title}
                  </div>

                  <div className="mt-2 text-sm cf-muted">
                    Versione corrente: {activePlan.currentVersion}
                  </div>

                  {activePlan.notes ? (
                    <p className="mt-3 max-w-2xl text-sm leading-6 cf-muted">
                      {activePlan.notes}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-full border cf-surface px-3 py-1 text-xs cf-text">
                  Active
                </div>
              </div>
            </div>

            {activeWorkoutGroups.length > 0 ? (
              <div className="rounded-3xl border cf-surface p-5">
                <div className="text-sm font-medium cf-text">
                  Workout inclusi nella scheda
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeWorkoutGroups.map((workout, index) => (
                    <div
                      key={workout.key}
                      className="rounded-full border cf-surface px-3 py-1 text-xs cf-muted"
                    >
                      {index + 1}. {workout.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}