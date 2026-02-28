export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { attachNewWorkoutToSession } from "../../../../../../actions/attachWorkoutToSession";
import { listWorkoutTemplates } from "../../../../../../actions/workouts";

export default async function AddWorkoutToSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log(id);
  const templates = await listWorkoutTemplates({ state: "active" });

  return (
    <div className="space-y-6 cf-text">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Assegna scheda alla sessione
          </h1>
          <p className="mt-1 text-sm cf-muted">
            Seleziona una scheda creata dal PT e agganciala a questo
            appuntamento.
          </p>
        </div>

        <Link
          href={`/app/sessions/${id}/edit`}
          className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90"
        >
          Indietro
        </Link>
      </header>

      <div className="rounded-3xl border cf-surface p-5">
        <form action={attachNewWorkoutToSession} className="grid gap-4">
          <input type="hidden" name="appointmentId" value={id} />

          <div className="grid gap-2">
            <div className="text-sm font-medium">Scheda</div>
            <select
              name="workoutTemplateId"
              className="cf-input"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Seleziona scheda…
              </option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            <div className="text-xs cf-faint">
              Tip: poi aggiungiamo ricerca live + preview degli esercizi.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button className="rounded-2xl px-4 py-2 text-sm cf-surface cf-text hover:opacity-90">
              Assegna alla sessione
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
