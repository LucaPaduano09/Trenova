export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createWorkoutTemplate } from "../../../../../actions/workouts";

export default function NewWorkoutPage() {
  return (
    <div className="space-y-6 cf-text">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuova scheda</h1>
          <p className="mt-1 text-sm cf-muted">
            Crea un template di allenamento.
          </p>
        </div>
        <Link
          href="/app/workouts"
          className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90"
        >
          Indietro
        </Link>
      </header>

      <div className="cf-card cf-hairline p-6">
        <form action={createWorkoutTemplate} className="grid gap-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium">Titolo</div>
            <input
              name="title"
              required
              className="cf-input"
              placeholder="Es. Full Body A"
            />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Note</div>
            <textarea name="notes" className="cf-input min-h-[110px]" />
          </div>

          <div className="flex justify-end">
            <button className="rounded-2xl px-4 py-2 text-sm cf-surface cf-text hover:opacity-90">
              Crea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
