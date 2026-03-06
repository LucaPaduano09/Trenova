"use client";

type WorkoutItem = {
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

function MetricPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65">
      {children}
    </div>
  );
}

export default function WorkoutsView({
  planName,
  versionTitle,
  items,
}: {
  planName: string;
  versionTitle: string;
  items: WorkoutItem[];
}) {
  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
          Workout
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
          {planName}
        </h1>

        <p className="mt-2 text-sm text-white/55">
          {versionTitle}
        </p>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
          Qui trovi la tua scheda attiva con tutti gli esercizi programmati dal
          tuo trainer. Più avanti potrai anche tracciare set, carichi e
          completamento dell’allenamento.
        </p>

        <div className="mt-6">
          <button
            disabled
            className="rounded-2xl border border-white/10 bg-white px-4 py-2.5 text-sm font-medium text-black opacity-80"
          >
            Inizia allenamento
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-white">
                  {index + 1}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {item.name}
                  </h2>

                  {item.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <MetricPill key={tag}>{tag}</MetricPill>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {item.sets != null ? <MetricPill>{item.sets} serie</MetricPill> : null}
              {item.reps ? <MetricPill>{item.reps} reps</MetricPill> : null}
              {item.restSec != null ? <MetricPill>{item.restSec}s rest</MetricPill> : null}
              {item.tempo ? <MetricPill>Tempo {item.tempo}</MetricPill> : null}
              {item.rpe != null ? <MetricPill>RPE {item.rpe}</MetricPill> : null}
            </div>

            {item.loadsKg.length > 0 ? (
              <div className="mt-5">
                <div className="text-xs uppercase tracking-[0.14em] text-white/40">
                  Carichi programmati
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.loadsKg.map((load, i) => (
                    <MetricPill key={`${item.id}-load-${i}`}>
                      Set {i + 1}: {load} kg
                    </MetricPill>
                  ))}
                </div>
              </div>
            ) : null}

            {item.restSecBySet.length > 0 ? (
              <div className="mt-5">
                <div className="text-xs uppercase tracking-[0.14em] text-white/40">
                  Recuperi per set
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.restSecBySet.map((rest, i) => (
                    <MetricPill key={`${item.id}-rest-${i}`}>
                      Set {i + 1}: {rest}s
                    </MetricPill>
                  ))}
                </div>
              </div>
            ) : null}

            {item.itemNotes ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-white/40">
                  Note
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {item.itemNotes}
                </p>
              </div>
            ) : null}

            {item.tips ? (
              <div className="mt-4 text-sm leading-6 text-white/50">
                {item.tips}
              </div>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}