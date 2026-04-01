export const revalidate = 100;

import Link from "next/link";
import { listExercises } from "../../../../actions/exercises";
import ExercisesFiltersBar from "../../_components/ExercisesFilterBar";

type SP = { [key: string]: string | string[] | undefined };
const PAGE_SIZE = 12;

function s(sp: SP, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

function parsePositivePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
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
  const page = parsePositivePage(s(sp, "page"));

  const items = await listExercises({ q, state, sort, image, tag });
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleItems = items.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = totalItems === 0 ? 0 : pageStart + 1;
  const showingTo = totalItems === 0 ? 0 : Math.min(pageStart + PAGE_SIZE, totalItems);

  function makeHref(nextPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (state !== "active") params.set("state", state);
    if (sort !== "updated") params.set("sort", sort);
    if (image !== "any") params.set("image", image);
    if (tag) params.set("tag", tag);
    if (nextPage > 1) params.set("page", String(nextPage));

    const query = params.toString();
    return `/app/exercises${query ? `?${query}` : ""}`;
  }

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
            {totalItems} risultati
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
        resultsCount={totalItems}
      />

      <section className="overflow-hidden rounded-[30px] border cf-surface">
        {totalItems === 0 ? (
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
          <>
            <div className="border-b border-black/5 px-5 py-4 dark:border-white/10">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold cf-text">
                    Libreria esercizi
                  </div>
                  <div className="mt-1 text-xs cf-muted">
                    Visualizzi {showingFrom}-{showingTo} di {totalItems} esercizi
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs cf-muted">
                  <span className="rounded-full border cf-surface px-3 py-1">
                    {state === "active"
                      ? "Solo attivi"
                      : state === "archived"
                        ? "Solo archiviati"
                        : "Tutti gli stati"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 xl:grid-cols-2">
              {visibleItems.map((e) => (
                <Link
                  key={e.ref}
                  href={`/app/exercises/${encodeURIComponent(e.ref)}/edit`}
                  className="group rounded-[26px] border cf-surface p-4 transition duration-300 hover:-translate-y-0.5 hover:bg-black/5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:hover:bg-white/5 dark:hover:shadow-none"
                >
                  <div className="flex items-start gap-4">
                    <Thumb url={e.imageUrl} name={e.name} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold cf-text">
                            {e.name}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] cf-faint">
                            <span>{e.kind === "custom" ? "Custom" : "Globale"}</span>
                            <span className="opacity-30">•</span>
                            <span>
                              Aggiornato{" "}
                              {new Intl.DateTimeFormat("it-IT", {
                                day: "2-digit",
                                month: "short",
                              }).format(e.updatedAt)}
                            </span>
                          </div>
                        </div>

                        <span className="rounded-full border cf-surface px-3 py-1 text-xs cf-text transition group-hover:translate-x-0.5">
                          Apri
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {e.tags?.slice(0, 5)?.map((t) => (
                          <span key={t} className="cf-chip">
                            {t}
                          </span>
                        ))}
                        {e.tags?.length > 5 ? (
                          <span className="rounded-full border cf-surface px-2.5 py-1 text-xs cf-faint">
                            +{e.tags.length - 5}
                          </span>
                        ) : null}
                        {e.isArchived ? (
                          <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-200">
                            Archiviato
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="border-t border-black/5 px-5 py-4 dark:border-white/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm cf-muted">
                    Pagina {currentPage} di {totalPages}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={makeHref(Math.max(1, currentPage - 1))}
                      aria-disabled={currentPage === 1}
                      className={[
                        "rounded-2xl border px-4 py-2 text-sm transition",
                        currentPage === 1
                          ? "pointer-events-none opacity-40 cf-surface"
                          : "cf-surface cf-text hover:bg-black/5 dark:hover:bg-white/10",
                      ].join(" ")}
                    >
                      Precedente
                    </Link>

                    <div className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text">
                      {currentPage}
                    </div>

                    <Link
                      href={makeHref(Math.min(totalPages, currentPage + 1))}
                      aria-disabled={currentPage === totalPages}
                      className={[
                        "rounded-2xl border px-4 py-2 text-sm transition",
                        currentPage === totalPages
                          ? "pointer-events-none opacity-40 cf-surface"
                          : "cf-surface cf-text hover:bg-black/5 dark:hover:bg-white/10",
                      ].join(" ")}
                    >
                      Successiva
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </>
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
