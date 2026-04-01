export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  archiveExercise,
  getExercise,
  restoreExercise,
  updateExercise,
} from "../../../../../../actions/exercises";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref: refRaw } = await params;
  const ref = decodeURIComponent(refRaw);
  const ex = await getExercise(ref);
  console.log("REF:", ref);
  if (!ex) return notFound();
  const tagsArr = (ex.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const shortDate = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
  }).format(new Date());

  return (
    <div className="space-y-6 cf-text">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight cf-text">
            Modifica esercizio
          </h1>
          <p className="mt-1 text-sm cf-muted">
            Aggiorna descrizione, tips e immagine.
          </p>
        </div>
        <Link
          href="/app/exercises"
          className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90"
        >
          Indietro
        </Link>
      </header>

      <section className="overflow-hidden rounded-[32px] border cf-surface">
        <div className="relative border-b border-black/5 px-6 py-6 dark:border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(25,98,255,0.12),transparent_38%),radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.1),transparent_34%)]" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <ExerciseThumb url={ex.imageUrl} name={ex.name} size="lg" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] cf-faint">
                  <span>{ex.kind === "custom" ? "Esercizio custom" : "Esercizio globale"}</span>
                  <span className="opacity-30">•</span>
                  <span>Review {shortDate}</span>
                </div>
                <h2 className="mt-2 truncate text-2xl font-semibold cf-text">
                  {ex.name}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tagsArr.length ? (
                    tagsArr.slice(0, 6).map((t) => (
                      <span key={t} className="cf-chip">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border cf-surface px-3 py-1 text-xs cf-faint">
                      Nessun tag
                    </span>
                  )}
                  {ex.isArchived ? (
                    <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-200">
                      Archiviato
                    </span>
                  ) : null}
                  {ex.kind === "global" && ex.isHidden ? (
                    <span className="rounded-full border border-slate-500/25 bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                      Nascosto per te
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
              <MetricCard label="Origine" value={ex.kind === "custom" ? "Custom" : "Globale"} />
              <MetricCard label="Tag" value={String(tagsArr.length)} />
              <MetricCard
                label="Media"
                value={ex.imageUrl ? "Immagine" : "Placeholder"}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="space-y-6">
            <div className="rounded-[28px] border cf-surface p-6">
              <div className="mb-4">
                <div className="text-[11px] uppercase tracking-[0.14em] cf-muted">
                  Editor contenuti
                </div>
                <div className="mt-1 text-lg font-semibold cf-text">
                  Informazioni esercizio
                </div>
              </div>

              <form action={updateExercise} className="grid gap-5">
                <input type="hidden" name="ref" value={ex.ref} />

                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label="Nome esercizio">
                    <input
                      name="name"
                      required
                      defaultValue={ex.name}
                      className="cf-input"
                    />
                  </Field>

                  <Field label="URL immagine">
                    <input
                      name="imageUrl"
                      defaultValue={ex.imageUrl ?? ""}
                      className="cf-input"
                      placeholder="https://…"
                    />
                  </Field>
                </div>

                <Field label="Descrizione">
                  <textarea
                    name="description"
                    defaultValue={ex.description ?? ""}
                    className="cf-input min-h-[140px]"
                    placeholder="Spiega setup, esecuzione e focus del movimento…"
                  />
                </Field>

                <Field label="Tips PT">
                  <textarea
                    name="coachTips"
                    defaultValue={ex.coachTips ?? ""}
                    className="cf-input min-h-[140px]"
                    placeholder="Cue tecnici, errori frequenti, note di coaching…"
                  />
                </Field>

                <Field label="Tag (separati da virgola)">
                  <input
                    name="tags"
                    defaultValue={ex.tags ?? ""}
                    className="cf-input"
                    placeholder="glutei, core, mobilita, cavi"
                  />
                </Field>

                <div className="flex flex-col gap-3 border-t border-black/5 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  {ex.kind === "custom" ? (
                    <label className="inline-flex items-center gap-2 text-sm cf-muted">
                      <input
                        type="checkbox"
                        name="isArchived"
                        defaultChecked={ex.isArchived}
                        className="h-4 w-4"
                      />
                      Archiviato
                    </label>
                  ) : (
                    <label className="inline-flex items-center gap-2 text-sm cf-muted">
                      <input
                        type="checkbox"
                        name="isHidden"
                        defaultChecked={ex.isHidden}
                        className="h-4 w-4"
                      />
                      Nascondi questo esercizio solo per il tuo tenant
                    </label>
                  )}

                  <button className="rounded-2xl bg-gradient-to-r from-[#0f2747] via-[#12305a] to-[#0f2747] px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_40px_rgba(15,39,71,0.2)] transition hover:opacity-95">
                    Salva modifiche
                  </button>
                </div>
              </form>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[28px] border cf-surface p-6">
              <div className="text-[11px] uppercase tracking-[0.14em] cf-muted">
                Anteprima rapida
              </div>

              <div className="mt-4 overflow-hidden rounded-[26px] border cf-surface">
                <div className="relative aspect-[4/3]">
                  {ex.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ex.imageUrl}
                      alt={ex.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_top_left,rgba(25,98,255,0.15),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_40%)] text-3xl font-semibold cf-text">
                      {ex.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.62),transparent_60%)]" />
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <div className="text-base font-semibold cf-text">{ex.name}</div>
                    <div className="mt-1 text-sm cf-muted">
                      {ex.description?.trim()
                        ? ex.description
                        : "Aggiungi una descrizione per rendere l’esercizio più chiaro ai trainer e nelle future schede."}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tagsArr.slice(0, 8).map((t) => (
                      <span key={t} className="cf-chip">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border cf-surface p-6">
              <div className="text-[11px] uppercase tracking-[0.14em] cf-muted">
                Gestione stato
              </div>
              <div className="mt-2 text-sm cf-muted">
                Mantieni pulita la libreria archiviando o ripristinando l’esercizio.
              </div>

              <div className="mt-5 grid gap-3">
                {ex.isArchived ? (
                  <form action={restoreExercise}>
                    <input type="hidden" name="ref" value={ex.ref} />
                    <button className="w-full rounded-2xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-200">
                      Ripristina esercizio
                    </button>
                  </form>
                ) : (
                  <form action={archiveExercise}>
                    <input type="hidden" name="ref" value={ex.ref} />
                    <button className="w-full rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-500/15 dark:text-rose-200">
                      Archivia esercizio
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-5 rounded-2xl border cf-surface px-4 py-3 text-xs cf-faint">
                Tip: quando vorrai, possiamo sostituire l’URL immagine con un upload vero su storage.
              </div>
            </div>
          </aside>
        </div>
      </section>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border cf-surface px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.14em] cf-muted">
        {label}
      </div>
      <div className="mt-2 text-base font-semibold cf-text">{value}</div>
    </div>
  );
}

function ExerciseThumb({
  url,
  name,
  size = "sm",
}: {
  url?: string | null;
  name: string;
  size?: "sm" | "lg";
}) {
  const classes =
    size === "lg"
      ? "h-20 w-20 rounded-[28px]"
      : "h-14 w-14 rounded-2xl";

  return (
    <div className={["relative shrink-0 overflow-hidden border cf-surface", classes].join(" ")}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-sm font-semibold cf-text">
          {name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("")}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.18),transparent_55%)]" />
    </div>
  );
}
