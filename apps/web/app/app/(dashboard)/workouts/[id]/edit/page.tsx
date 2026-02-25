export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addWorkoutItem,
  deleteWorkoutItem,
  getWorkoutTemplate,
  moveWorkoutItem,
  updateWorkoutItem,
  updateWorkoutTemplate,
} from "../../../../../../actions/workouts";
import { listExercises } from "../../../../../../actions/exercises";
import AddWorkoutItemForm from "../../_components/AddWorkoutItemForm";
import EditWorkoutItemForm from "../../_components/EditWorkoutItemForm";

export default async function EditWorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const w = await getWorkoutTemplate(id);
  if (!w) return notFound();

  const exercises = await listExercises({
    q,
    state: "active",
    sort: "name",
    image: "any",
  });

  return (
    <div className="space-y-6 cf-text">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifica scheda</h1>
          <p className="mt-1 text-sm cf-muted">
            Aggiungi esercizi e imposta parametri.
          </p>
        </div>

        <Link
          href="/app/workouts"
          className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90"
        >
          Indietro
        </Link>
      </header>

      {/* Workout meta */}
      <div className="cf-card cf-hairline p-6">
        <form action={updateWorkoutTemplate} className="grid gap-4">
          <input type="hidden" name="id" value={w.id} />

          <div className="grid gap-2">
            <div className="text-sm font-medium">Titolo</div>
            <input
              name="title"
              defaultValue={w.title}
              className="cf-input"
              required
            />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Note</div>
            <textarea
              name="notes"
              defaultValue={w.notes ?? ""}
              className="cf-input min-h-[110px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm cf-muted">
              <input
                type="checkbox"
                name="isArchived"
                defaultChecked={w.isArchived}
                className="h-4 w-4"
              />
              Archiviata
            </label>

            <button className="rounded-2xl px-4 py-2 text-sm cf-surface cf-text hover:opacity-90">
              Salva
            </button>
          </div>
        </form>
      </div>

      {/* Add item */}
      <div className="cf-card cf-hairline p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Aggiungi esercizio</div>
            <div className="mt-1 text-xs cf-faint">
              Seleziona dal catalogo (global + custom) e salva lo snapshot.
            </div>
          </div>

          <form
            action={`/app/workouts/${w.id}/edit`}
            className="flex items-center gap-2"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="Cerca esercizio…"
              className="cf-input h-10 w-[220px]"
            />
            <button className="rounded-2xl border cf-surface px-3 py-2 text-sm hover:opacity-90">
              Cerca
            </button>
          </form>
        </div>

        <AddWorkoutItemForm workoutId={w.id} exercises={exercises} />
      </div>

      {/* Items list */}
      <div className="cf-card cf-hairline overflow-hidden">
        <div className="p-6">
          <div className="text-sm font-semibold">Esercizi in scheda</div>
          <div className="mt-1 text-xs cf-faint">
            Ordine + parametri. (Drag&drop lo facciamo dopo)
          </div>
        </div>

        {w.items.length === 0 ? (
          <div className="px-6 pb-8">
            <div className="cf-soft cf-hairline p-8">
              <div className="text-sm font-medium">Vuota</div>
              <p className="mt-1 text-sm cf-muted">
                Aggiungi il primo esercizio.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {w.items.map((it) => (
              <li key={it.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="cf-chip">#{it.order}</span>
                      <div className="truncate text-base font-semibold cf-text">
                        {it.nameSnapshot ?? "—"}
                      </div>
                    </div>

                    {it.tipsSnapshot ? (
                      <div className="mt-2 text-sm cf-muted line-clamp-2">
                        {it.tipsSnapshot}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Pill label="Serie" value={it.sets ?? "—"} />
                      <Pill label="Reps" value={it.reps ?? "—"} />
                      <Pill
                        label="Rec"
                        value={it.restSec != null ? `${it.restSec}s` : "—"}
                      />
                      <Pill label="Tempo" value={it.tempo ?? "—"} />
                      <Pill label="RPE" value={it.rpe ?? "—"} />
                      <Pill
                        label="Kg"
                        value={
                          it.loadsKg?.length ? it.loadsKg.join(" / ") : "—"
                        }
                      />
                    </div>

                    {it.itemNotes ? (
                      <div className="mt-2 text-sm cf-text whitespace-pre-wrap">
                        {it.itemNotes}
                      </div>
                    ) : null}

                    {/* inline edit */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs cf-faint hover:opacity-90">
                        Modifica parametri
                      </summary>
                      <EditWorkoutItemForm
                        itemId={it.id}
                        sets={it.sets ?? null}
                        reps={it.reps ?? null}
                        restSec={it.restSec ?? null}
                        tempo={it.tempo ?? null}
                        rpe={it.rpe ?? null}
                        loadsKg={(it.loadsKg as any) ?? null}
                        restSecBySet={it.restSecBySet ?? null}
                        itemNotes={it.itemNotes ?? null}
                      />
                    </details>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="cf-soft cf-hairline flex items-center gap-2 p-1">
                      <form action={moveWorkoutItem}>
                        <input type="hidden" name="workoutId" value={w.id} />
                        <input type="hidden" name="itemId" value={it.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button className="rounded-2xl border cf-surface px-3 py-2 text-sm hover:opacity-90">
                          ↑
                        </button>
                      </form>

                      <form action={moveWorkoutItem}>
                        <input type="hidden" name="workoutId" value={w.id} />
                        <input type="hidden" name="itemId" value={it.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button className="rounded-2xl border cf-surface px-3 py-2 text-sm hover:opacity-90">
                          ↓
                        </button>
                      </form>
                    </div>

                    <form action={deleteWorkoutItem}>
                      <input type="hidden" name="workoutId" value={w.id} />
                      <input type="hidden" name="itemId" value={it.id} />
                      <button className="w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90">
                        Rimuovi
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: any }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border cf-surface px-3 py-1">
      <span className="cf-faint">{label}</span>
      <span className="cf-text">{String(value)}</span>
    </span>
  );
}

function Input({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: any;
}) {
  return (
    <div className="grid gap-1">
      <div className="text-xs cf-faint">{label}</div>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="cf-input h-10"
      />
    </div>
  );
}
