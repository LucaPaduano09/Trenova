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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        <div className="lg:col-span-2 cf-card cf-hairline p-6">
          <form action={updateExercise} className="grid gap-4">
            <input type="hidden" name="ref" value={ex.ref} />

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

            <Field label="Descrizione">
              <textarea
                name="description"
                defaultValue={ex.description ?? ""}
                className="cf-input min-h-[110px]"
              />
            </Field>

            <Field label="Tips PT">
              <textarea
                name="coachTips"
                defaultValue={ex.coachTips ?? ""}
                className="cf-input min-h-[110px]"
              />
            </Field>

            <Field label="Tag (separati da virgola)">
              <input
                name="tags"
                defaultValue={ex.tags ?? ""}
                className="cf-input"
              />
            </Field>

            <div className="flex items-center justify-between gap-3 pt-2">
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
                  Nascondi (solo per te)
                </label>
              )}

              <button className="rounded-2xl px-4 py-2 text-sm cf-surface cf-text hover:opacity-90">
                Salva modifiche
              </button>
            </div>
          </form>
        </div>

        <div className="cf-card cf-hairline p-6">
          <div className="text-sm font-semibold cf-text">Anteprima</div>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl border cf-surface">
              {ex.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ex.imageUrl}
                  alt={ex.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs font-semibold cf-text">
                  {ex.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.18),transparent_55%)]" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold cf-text">
                {ex.name}
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs cf-faint">
                {tagsArr.slice(0, 6).map((t) => (
                  <span key={t} className="cf-chip">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            {ex.isArchived ? (
              <form action={restoreExercise}>
                <input type="hidden" name="ref" value={ex.ref} />
                <button className="w-full rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90">
                  Ripristina
                </button>
              </form>
            ) : (
              <form action={archiveExercise}>
                <input type="hidden" name="ref" value={ex.ref} />
                <button className="w-full rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90">
                  Archivia
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 text-xs cf-faint">
            Tip: più avanti possiamo sostituire l’URL con upload (S3/R2/Supabase
            storage).
          </div>
        </div>
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
