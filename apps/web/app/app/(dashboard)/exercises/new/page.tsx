export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createExercise } from "../../../../../actions/exercises";

export default function NewExercisePage() {
  return (
    <div className="space-y-6 cf-text">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight cf-text">
            Nuovo esercizio
          </h1>
          <p className="mt-1 text-sm cf-muted">
            Aggiungi un esercizio alla libreria.
          </p>
        </div>
        <Link
          href="/app/exercises"
          className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90"
        >
          Indietro
        </Link>
      </header>

      <div className="cf-card cf-hairline p-6">
        <form action={createExercise} className="grid gap-4">
          <Field label="Nome esercizio">
            <input
              name="name"
              required
              className="cf-input"
              placeholder="Es. Panca piana"
            />
          </Field>

          <Field label="URL immagine (opzionale)">
            <input
              name="imageUrl"
              className="cf-input"
              placeholder="https://…"
            />
          </Field>

          <Field label="Descrizione (opzionale)">
            <textarea
              name="description"
              className="cf-input min-h-[96px]"
              placeholder="Come eseguire l’esercizio…"
            />
          </Field>

          <Field label="Tips PT (opzionale)">
            <textarea
              name="coachTips"
              className="cf-input min-h-[96px]"
              placeholder="Cue tecnici, errori comuni, ecc…"
            />
          </Field>

          <Field label="Tag (opzionale)">
            <input
              name="tags"
              className="cf-input"
              placeholder="petto, tricipiti, forza (separati da virgola)"
            />
          </Field>

          <div className="flex items-center justify-between gap-3 pt-2">
            <label className="inline-flex items-center gap-2 text-sm cf-muted">
              <input type="checkbox" name="isArchived" className="h-4 w-4" />
              Archivia subito
            </label>

            <button className="rounded-2xl px-4 py-2 text-sm cf-surface cf-text hover:opacity-90">
              Crea esercizio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-medium cf-text">{label}</div>
      {children}
    </div>
  );
}
