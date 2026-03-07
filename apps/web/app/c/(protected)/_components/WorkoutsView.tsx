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

type WorkoutsViewProps = {
  planName: string;
  planNotes?: string | null;
  versionTitle: string;
  versionNumber: number;
  workouts: WorkoutGroupView[];
};

export default function WorkoutsView({
  planName,
  planNotes,
  versionTitle,
  versionNumber,
  workouts,
}: WorkoutsViewProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
              Scheda attiva
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              {planName}
            </h1>

            <p className="mt-2 text-sm text-white/55">
              {versionTitle} · Versione {versionNumber}
            </p>

            {planNotes ? (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                {planNotes}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
            {workouts.length} workout nella tua scheda
          </div>
        </div>

        {workouts.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {workouts.map((workout, index) => (
              <div
                key={workout.key}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70"
              >
                {index + 1}. {workout.name}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="space-y-4">
        {workouts.map((workout, workoutIndex) => (
          <details
            key={workout.key}
            open={workoutIndex === 0}
            className="group rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:content-none">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Workout {workoutIndex + 1}
                </div>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {workout.name}
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  {workout.items.length} esercizi
                </p>
              </div>

              <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60 transition group-open:bg-white/[0.07]">
                <span className="group-open:hidden">Apri</span>
                <span className="hidden group-open:inline">Chiudi</span>
              </div>
            </summary>

            <div className="border-t border-white/10 px-5 pb-5 pt-4">
              <div className="space-y-4">
                {workout.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-white">
                          {item.order}. {item.name}
                        </div>

                        {item.tags.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <span
                                key={`${item.id}-${tag}`}
                                className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/60"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {item.tips ? (
                          <p className="mt-3 text-sm leading-6 text-white/55">
                            {item.tips}
                          </p>
                        ) : null}

                        {item.itemNotes ? (
                          <p className="mt-3 text-sm leading-6 text-white/45">
                            Nota: {item.itemNotes}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
                        <MetricPill
                          label="Set"
                          value={item.sets != null ? String(item.sets) : "—"}
                        />
                        <MetricPill label="Reps" value={item.reps ?? "—"} />
                        <MetricPill
                          label="Rest"
                          value={item.restSec != null ? `${item.restSec}s` : "—"}
                        />
                        <MetricPill
                          label="RPE"
                          value={item.rpe != null ? String(item.rpe) : "—"}
                        />
                      </div>
                    </div>

                    {(item.loadsKg.length > 0 || item.restSecBySet.length > 0) ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-white/40">
                            Carichi programmati
                          </div>
                          <div className="mt-2 text-sm text-white/70">
                            {item.loadsKg.length > 0
                              ? item.loadsKg.map((kg) => `${kg} kg`).join(" · ")
                              : "—"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-white/40">
                            Recupero per set
                          </div>
                          <div className="mt-2 text-sm text-white/70">
                            {item.restSecBySet.length > 0
                              ? item.restSecBySet.map((s) => `${s}s`).join(" · ")
                              : "—"}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}