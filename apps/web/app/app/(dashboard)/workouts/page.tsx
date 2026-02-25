export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { listWorkoutTemplates } from "../../../../actions/workouts";
import { WorkoutsFiltersBar } from "./_components/WorkoutFiltersBar";

type SP = { [key: string]: string | string[] | undefined };
function s(sp: SP, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams?: SP | Promise<SP>;
}) {
  const sp = (await searchParams) ?? {};

  const q = s(sp, "q") ?? "";
  const stateRaw = s(sp, "state");
  const state =
    stateRaw === "archived" || stateRaw === "all"
      ? (stateRaw as any)
      : "active";

  const items = await listWorkoutTemplates({ q, state });
  return (
    <div className="space-y-6 cf-text">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schede</h1>
          <p className="mt-1 text-sm cf-muted">
            Crea template di allenamento e riusali con i clienti.
          </p>
        </div>

        <Link
          href="/app/workouts/new"
          className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm cf-surface cf-text"
        >
          Nuova scheda
        </Link>
      </header>

      <WorkoutsFiltersBar />

      <section className="overflow-hidden rounded-3xl border cf-surface">
        {items.length === 0 ? (
          <div className="p-10">
            <div className="text-sm font-medium cf-text">Nessun template</div>
            <p className="mt-1 text-sm cf-muted">Crea la prima scheda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {items.map((w) => (
              <li key={w.id} className="group">
                <Link
                  href={`/app/workouts/${w.id}/edit`}
                  className="flex items-center justify-between gap-4 p-5 transition duration-300 hover:px-6"
                >
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold cf-text">
                      {w.title}
                    </div>
                    {/* <div className="cf-text text-sm">{w.notes}</div> */}
                    <div className="mt-1 flex items-center gap-2 text-xs cf-faint">
                      <span className="cf-chip">{w._count.items} esercizi</span>
                      {w.isArchived ? (
                        <span className="cf-chip">Archiviata</span>
                      ) : null}
                    </div>
                  </div>
                  <span className="cf-faint transition group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
