export const revalidate = 100;

import Link from "next/link";
import { listExercises } from "../../../../actions/exercises";
import ExercisesFiltersBar from "../../_components/ExercisesFilterBar";

type SP = { [key: string]: string | string[] | undefined };

function s(sp: SP, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function ExercisesPage({
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

  const sortRaw = s(sp, "sort");
  const sort =
    sortRaw === "name" || sortRaw === "newest" || sortRaw === "oldest"
      ? (sortRaw as any)
      : "updated";

  const imageRaw = s(sp, "image");
  const image =
    imageRaw === "with" || imageRaw === "without" ? (imageRaw as any) : "any";

  const tag = s(sp, "tag") ?? "";

  const items = await listExercises({ q, state, sort, image, tag });

  return (
    <div className="space-y-6 cf-text">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight cf-text">
            Esercizi
          </h1>
          <p className="mt-1 text-sm cf-muted">
            Crea la tua libreria esercizi e riusali nelle schede.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex rounded-full border cf-surface px-3 py-1 text-xs cf-muted">
            {items.length} risultati
          </span>

          <Link
            href="/app/exercises/new"
            className="rounded-2xl px-4 py-2 text-sm cf-surface cf-text"
          >
            Nuovo esercizio
          </Link>
        </div>
      </header>

      <ExercisesFiltersBar
        initialQ={q}
        initialState={state}
        initialSort={sort}
        initialImage={image}
        initialTag={tag}
        resultsCount={items.length}
      />

      <section className="overflow-hidden rounded-3xl border cf-surface">
        {items.length === 0 ? (
          <div className="p-10">
            <div className="text-sm font-medium cf-text">Nessun esercizio</div>
            <p className="mt-1 text-sm cf-muted">
              Crea il primo esercizio per iniziare a costruire schede.
            </p>
            <Link
              href="/app/exercises/new"
              className="mt-6 inline-flex rounded-2xl px-4 py-2 text-sm cf-surface cf-text"
            >
              Crea esercizio
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {items.map((e, index) => (
              <li key={index} className="group">
                <Link
                  href={`/app/exercises/${encodeURIComponent(e.ref)}/edit`}
                  className="flex items-center justify-between gap-4 p-5 transition duration-300 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Thumb url={e.imageUrl} name={e.name} />
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold cf-text">
                        {e.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs cf-faint">
                        {e.tags?.slice(0, 4)?.map((t) => (
                          <span key={t} className="cf-chip">
                            {t}
                          </span>
                        ))}
                        {e.tags?.length > 4 ? (
                          <span className="cf-faint">+{e.tags.length - 4}</span>
                        ) : null}
                        {e.isArchived ? (
                          <span className="cf-chip opacity-80">Archiviato</span>
                        ) : null}
                      </div>
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

function Thumb({ url, name }: { url?: string | null; name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border cf-surface">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-xs font-semibold cf-text">
          {initials}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.18),transparent_55%)]" />
    </div>
  );
}
