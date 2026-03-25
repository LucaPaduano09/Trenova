export const revalidate = 100;

import Link from "next/link";
import {
  ArrowRight,
  Link2,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
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
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight cf-text sm:text-3xl">
            Clienti
          </h1>

          <p className="mt-2 max-w-2xl text-sm cf-muted">
            Gestisci i tuoi clienti, crea nuovi profili e invia inviti
            condivisibili per collegare in pochi secondi ogni persona al tuo
            spazio Trenova.
          </p>
        </div>
          <div className="inline-flex items-center gap-2 rounded-full border cf-surface px-3 py-1 text-xs cf-muted">
            <Users className="h-3.5 w-3.5" />
            <span>Client Management</span>
          </div>
      </header>

      <div className="relative overflow-hidden rounded-[28px] border cf-surface p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs cf-muted">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Onboarding più rapido</span>
            </div>

            <h2 className="mt-3 text-lg font-semibold cf-text sm:text-xl">
              Invita un cliente con un link elegante e immediato
            </h2>

            <p className="mt-2 text-sm leading-6 cf-muted">
              Genera un link personale da condividere via WhatsApp, email o
              messaggio. Il cliente potrà accedere o registrarsi e verrà
              associato direttamente al tuo profilo, senza passaggi manuali.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border cf-surface px-3 py-1 text-xs cf-muted">
                Link condivisibile
              </span>
              <span className="rounded-full border cf-surface px-3 py-1 text-xs cf-muted">
                Email opzionale
              </span>
              <span className="rounded-full border cf-surface px-3 py-1 text-xs cf-muted">
                Associazione automatica
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/app/clients/invite"
              className={[
                "group inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium",
                "bg-gradient-to-r from-[#0f2747] via-[#12305a] to-[#0f2747] opacity-95 text-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:opacity-95",
                "dark:bg-white dark:text-neutral-900",
              ].join(" ")}
            >
              <span>Vai agli inviti</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/app/clients/new"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium cf-surface cf-text transition-all duration-200 hover:-translate-y-[1px]"
            >
              Crea manualmente
            </Link>
          </div>
        </div>
      </div>

      <ClientsFiltersBar initial={initial} resultsCount={clients.length} />

      <section className="overflow-hidden rounded-3xl border cf-surface">
        {clients.length === 0 ? (
          <div className="p-10">
            <div className="inline-flex items-center gap-2 rounded-full border cf-surface px-3 py-1 text-xs cf-muted">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Nessun cliente ancora collegato</span>
            </div>

            <div className="mt-4 text-base font-semibold cf-text">
              Inizia dal primo invito
            </div>

            <p className="mt-2 max-w-xl text-sm cf-muted">
              Puoi creare un profilo manualmente oppure invitare il cliente con
              un link. È il modo più semplice per farlo entrare subito nel tuo
              ecosistema Trenova.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/app/clients/invite"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-[1px] hover:opacity-95 dark:bg-white dark:text-neutral-900"
              >
                <Link2 className="h-4 w-4" />
                <span>Invita cliente</span>
              </Link>

              <Link
                href="/app/clients/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium cf-surface cf-text transition-all duration-200 hover:-translate-y-[1px]"
              >
                <Plus className="h-4 w-4" />
                <span>Crea nuovo cliente</span>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {clients.map((c) => (
              <li key={c.id} className="group">
                <Link
                  href={`/app/clients/${c.slug}`}
                  className="flex items-center justify-between gap-4 p-5 transition-all duration-300 hover:px-6"
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