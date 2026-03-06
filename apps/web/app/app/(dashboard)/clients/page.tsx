export const revalidate = 100;

import Link from "next/link";
import { listClients } from "../../../../actions/clients";
import ClientsFiltersBar from "./_components/ClientsFiltersBar";

type SP = { [key: string]: string | string[] | undefined };
function s(sp: SP, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: SP;
}) {
  const sp = (await searchParams) ?? {};

  const q = s(sp, "q") ?? "";

  const stateRaw = s(sp, "state");
  const state =
    stateRaw === "archived" || stateRaw === "all"
      ? (stateRaw as any)
      : "active";

  const createdRaw = s(sp, "created");
  const created =
    createdRaw === "7d" || createdRaw === "30d" || createdRaw === "90d"
      ? (createdRaw as any)
      : "all";

  const sortRaw = s(sp, "sort");
  const sort =
    sortRaw === "old" || sortRaw === "name" ? (sortRaw as any) : "new";

  const emailRaw = s(sp, "email");
  const email =
    emailRaw === "with" || emailRaw === "without" ? (emailRaw as any) : "any";

  const phoneRaw = s(sp, "phone");
  const phone =
    phoneRaw === "with" || phoneRaw === "without" ? (phoneRaw as any) : "any";

  const clients = await listClients({ q, state, created, sort, email, phone });

  const initial = { q, state, created, sort, email, phone };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold cf-text tracking-tight">Clienti</h1>
          <p className="mt-1 text-sm cf-muted">
            Gestisci i clienti e invita nuove persone a collegarsi al tuo profilo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden sm:inline-flex rounded-full border cf-surface px-3 py-1 text-xs cf-muted backdrop-blur">
            {clients.length} risultati
          </span>

          <Link
            href="/app/clients/invite"
            className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm cf-surface cf-text transition hover:-translate-y-[1px]"
          >
            Invita cliente
          </Link>

          <Link
            href="/app/clients/new"
            className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm bg-neutral-900 text-white transition hover:opacity-90 dark:bg-white dark:text-neutral-900"
          >
            Nuovo cliente
          </Link>
        </div>
      </header>

      <div className="rounded-3xl border cf-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold cf-text">
              Invita un cliente con un link
            </div>
            <p className="mt-1 text-sm cf-muted">
              Genera un invito condivisibile: il cliente potrà registrarsi o accedere
              e verrà associato direttamente al tuo account.
            </p>
          </div>

          <Link
            href="/app/clients/invite"
            className="inline-flex shrink-0 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium cf-surface cf-text transition hover:-translate-y-[1px]"
          >
            Vai agli inviti
          </Link>
        </div>
      </div>

      <ClientsFiltersBar initial={initial} resultsCount={clients.length} />

      <section className="overflow-hidden rounded-3xl border cf-surface">
        {clients.length === 0 ? (
          <div className="p-10">
            <div className="text-sm font-medium cf-text">Nessun risultato</div>
            <p className="mt-1 text-sm cf-muted">
              Prova a cambiare ricerca o filtri, oppure inizia invitando il tuo primo cliente.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/app/clients/invite"
                className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm cf-surface cf-text"
              >
                Invita cliente
              </Link>

              <Link
                href="/app/clients/new"
                className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm cf-surface cf-text"
              >
                Crea nuovo cliente
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {clients.map((c) => (
              <li key={c.id} className="group">
                <Link
                  href={`/app/clients/${c.slug}`}
                  className="flex items-center justify-between gap-4 p-5 transition duration-300 hover:px-6"
                >
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold cf-text">
                      {c.fullName}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs cf-faint">
                      <span className="truncate">{c.email ?? "—"}</span>
                      <span className="opacity-40">•</span>
                      <span className="truncate">{c.phone ?? "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full border cf-surface px-3 py-1 text-xs font-medium cf-text">
                      {c.status}
                    </span>
                    <span className="cf-faint transition group-hover:translate-x-0.5">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}