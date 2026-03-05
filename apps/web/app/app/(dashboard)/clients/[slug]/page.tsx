import { prisma } from "@/lib/db";
import { requireTenantFromSession } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteSessionButton from "../../../_components/DeleteSessionButton";
import {
  deleteSession,
  markSessionPaid,
  markSessionUnpaid,
} from "../../../../../actions/sessions";
import { listMetricsEntries } from "../../../../../actions/metrics";
import { getClientProfile } from "../../../../../actions/profile";
import { createMetricsEntry } from "../../../../../actions/metrics";
import Image from "next/image";
import BodyMapCard from "./_components/BodyMapCard";
import OverviewStatsCards from "./_components/OverviewStatsCards";
import { getClientOverviewStats } from "@/actions/clientOverview";
import { MiniOverviewCard } from "./_components/MiniOverviewCard";
import MetricsForm from "./_components/MetricsForm";
import { assignPackageToClient, deactivatePackagePurchase, reactivatePackagePurchase } from "../../../../../actions/packagePurchase";

export const revalidate = 100;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatMoneyEUR(priceCents?: number | null) {
  if (priceCents == null) return "—";
  const eur = (priceCents / 100).toFixed(2).replace(".", ",");
  return `€ ${eur}`;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function labelLocationType(v: string) {
  const map: Record<string, string> = {
    GYM: "Palestra",
    HOME: "A domicilio",
    OUTDOOR: "Outdoor",
    ONLINE: "Online",
    OTHER: "Altro",
  };
  return map[v] ?? v;
}
function bpToPct(v?: number | null) {
  if (v == null) return "—";
  return (v / 100).toFixed(1).replace(".", ",") + "%";
}
function gToKg(v?: number | null) {
  if (v == null) return "—";
  return (v / 1000).toFixed(1).replace(".", ",") + " kg";
}
function mmToCm(v?: number | null) {
  if (v == null) return "—";
  return (v / 10).toFixed(1).replace(".", ",") + " cm";
}

type TabKey = "overview" | "packages" | "sessions" | "progress";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?:
    | { tab?: string; flash?: string; sid?: string }
    | Promise<{ tab?: string; flash?: string; sid?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const flash = sp?.flash;
  const sid = sp?.sid;

  const activeTab: TabKey =
    (sp?.tab as TabKey) &&
    ["overview", "packages", "sessions", "progress"].includes(sp?.tab as string)
      ? (sp?.tab as TabKey)
      : "overview";

  const { tenant } = await requireTenantFromSession();

  const client = await prisma.client.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug } },
    select: {
      id: true,
      slug: true,
      fullName: true,
      email: true,
      phone: true,
      notes: true,
      status: true,
      createdAt: true,
    },
  });

  if (!client) return notFound();
  const overviewStats =
    activeTab === "overview" ? await getClientOverviewStats(client.id) : null;

  const churn = overviewStats?.performance?.inactivity;
  const sessions =
    activeTab === "sessions"
      ? await prisma.appointment.findMany({
          where: {
            tenantId: tenant.id,
            clientId: client.id,
            OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
          },
          orderBy: { startsAt: "desc" },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            locationType: true,
            location: true,
            notes: true,
            priceCents: true,
            currency: true,
            paidAt: true,
            paymentMethod: true,
            workoutTemplateId: true,
          },
        })
      : [];

  const avatar = initials(client.fullName || "Client");
  const profile =
    activeTab === "progress" ? await getClientProfile(client.id) : null;
  const entries =
    activeTab === "progress" ? await listMetricsEntries(client.id) : [];
  const isOverview = activeTab === "overview";

  const now = new Date();
  const from30 = new Date();
  from30.setDate(from30.getDate() - 30);

  // sessioni ultimi 30gg (per revenue/paid rate)
  const stats30 = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      clientId: client.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { gte: from30, lte: now },
      // se vuoi includere solo sessioni svolte per revenue: metti COMPLETED (ma dipende dal tuo flow)
      // status: "COMPLETED",
    },
    select: { paidAt: true, priceCents: true },
  });

  // prossima sessione pianificata
  const nextAppt = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      clientId: client.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { gte: now },
      status: "SCHEDULED",
    },
    orderBy: { startsAt: "asc" },
    select: { startsAt: true },
  });

  // ultima sessione (passata)
  const lastAppt = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      clientId: client.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      endsAt: { lt: now },
    },
    orderBy: { endsAt: "desc" },
    select: { endsAt: true, startsAt: true },
  });

  const total30 = stats30.length;
  const paid30 = stats30.filter((s) => !!s.paidAt);
  const paidRate30 = total30 ? Math.round((paid30.length / total30) * 100) : 0;
  const revenue30 = paid30.reduce((sum, s) => sum + (s.priceCents ?? 0), 0);

  const daysAgo = (d?: Date | null) => {
    if (!d) return null;
    const ms = now.getTime() - d.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  };

  const kpi = {
    lastAt: lastAppt?.endsAt ?? lastAppt?.startsAt ?? null, // meglio endsAt se lo hai
    nextAt: nextAppt?.startsAt ?? null,
    revenue30,
    paidRate30,
  };
  //prendo il workout associato alla sessione
  const workoutIds = Array.from(
    new Set(sessions.map((s) => s.workoutTemplateId).filter(Boolean))
  ) as string[];
  const templates = await prisma.workoutTemplate.findMany({
    where: {
      tenantId: tenant.id,
      id: { in: workoutIds },
    },
    select: { id: true, title: true },
  });
  const workoutTitleById = new Map(templates.map((t) => [t.id, t.title]));
  const packages =
    activeTab === "packages"
      ? await prisma.package.findMany({
          where: { tenantId: tenant.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            type: true,
            sessionCount: true,
            bundlePrice: true,         
            monthlyPrice: true,
            monthlySessionCount: true, 
          },
        })
      : [];

  const purchases =
    activeTab === "packages"
      ? await prisma.packagePurchase.findMany({
          where: { tenantId: tenant.id, clientId: client.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            active: true,
            remainingSessions: true,
            startedAt: true,
            expiresAt: true,
            package: { select: { name: true, type: true, sessionCount: true, bundlePrice: true, monthlyPrice: true, monthlySessionCount: true } },
          },
        })
      : [];
  return (
    <div className="space-y-6 cf-text">
      {/* Top hero */}
      <div className="cf-card cf-hairline p-6 space-y-6">
        {/* TOP GRID */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="flex items-start gap-4">
            <div className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border bg-white/70 text-sm font-semibold cf-text shadow-sm">
              <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.08),transparent_55%)]" />
              <span className="relative text-base">{avatar}</span>
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {client.fullName}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm cf-muted">
                <span className="truncate">{client.email ?? "—"}</span>
                <span className="opacity-30">•</span>
                <span className="truncate">{client.phone ?? "—"}</span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <StatusPill status={client.status} />
                <Link
                  href="/app/clients"
                  className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-faint cf-text hover:border-black dark:hover:border-white"
                >
                  Indietro
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <MiniOverviewCard client={client} kpi={kpi} />
        </div>

        {/* Divider */}
        {/* <div className="h-px bg-black/5 dark:bg-white/10" /> */}

        {/* QUICK ACTIONS
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ActionCard
            title="Nuova sessione"
            subtitle="Aggiungi una sessione"
            href={`/app/booking/new?client=${client.slug}`}
          />
          <ActionCard
            title="Aggiungi pacchetto"
            subtitle="Vendi 10/20 sessioni"
            href={`/app/packages/new?client=${client.slug}`}
          />
          <ActionCard
            title="Registra progressi"
            subtitle="Peso, foto, note"
            href={`/app/progress/new?client=${client.slug}`}
          />
        </div> */}
      </div>

      {/* Tabs (URL-driven) */}
      <div className="sticky top-6 z-10 cf-surface cf-hairline p-2">
        <div className="flex flex-wrap gap-2">
          <TabLink
            href={`/app/clients/${client.slug}?tab=overview`}
            active={activeTab === "overview"}
          >
            Panoramica
          </TabLink>
          <TabLink
            href={`/app/clients/${client.slug}?tab=packages`}
            active={activeTab === "packages"}
          >
            Pacchetti
          </TabLink>
          <TabLink
            href={`/app/clients/${client.slug}?tab=sessions`}
            active={activeTab === "sessions"}
          >
            Sessioni
          </TabLink>
          <TabLink
            href={`/app/clients/${client.slug}?tab=progress`}
            active={activeTab === "progress"}
          >
            Progressi
          </TabLink>
        </div>
      </div>

      {/* Content */}
      
      {activeTab === "packages" ? (
        <div className="cf-surface cf-hairline overflow-hidden">
          <div className="p-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold cf-text">Pacchetti</div>
              <div className="mt-1 text-sm cf-muted">
                Assegna bundle o abbonamento mensile.
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Assign package */}
            <div className="cf-card">
              <div className="text-sm font-semibold cf-text">Assegna pacchetto</div>
              <div className="mt-1 text-xs cf-muted">
                Seleziona un pacchetto creato in /app/packages.
              </div>

              {packages.length === 0 ? (
                <div className="mt-4 text-sm cf-muted">
                  Nessun pacchetto disponibile. Creane uno in{" "}
                  <Link className="underline" href="/app/packages">
                    Pacchetti
                  </Link>
                  .
                </div>
              ) : (
                <form action={assignPackageToClient} className="mt-4 grid gap-3">
                  <input type="hidden" name="clientId" value={client.id} />
                  <input type="hidden" name="clientSlug" value={client.slug} />

                  <label className="grid gap-1">
                    <span className="text-xs cf-muted">Pacchetto</span>
                    <select
                      name="packageId"
                      className="h-10 rounded-2xl border cf-surface px-3 text-xs outline-none"
                      defaultValue={packages[0]?.id}
                    >
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{" "}
                          {p.type === "SESSION_BUNDLE"
                            ? `• ${p.sessionCount ?? 0} sessioni${p.bundlePrice != null ? ` • € ${p.bundlePrice}` : ""}`
                            : `• ${p.monthlySessionCount ?? 0} crediti${p.monthlyPrice != null ? ` • € ${p.monthlyPrice}/mese` : ""}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs cf-muted">
                      Scadenza (opzionale) — consigliata per mensile
                    </span>
                    <input
                      name="expiresAt"
                      type="date"
                      className="h-10 rounded-2xl border cf-surface px-3 text-xs outline-none"
                    />
                  </label>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Assegna
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Purchases list */}
            <div className="cf-card">
              <div className="text-sm font-semibold cf-text">Pacchetti assegnati</div>
              <div className="mt-1 text-xs cf-muted">
                Bundle mostra crediti residui. Mensile mostra stato/periodo.
              </div>

              {purchases.length === 0 ? (
                <div className="mt-4 text-sm cf-muted">Nessun pacchetto assegnato.</div>
              ) : (
                <ul className="mt-4 divide-y divide-black/5 dark:divide-white/10">
                  {purchases.map((p) => (
                    <li key={p.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold cf-text truncate">
                          {p.package.name}
                        </div>

                        <div className="mt-1 text-xs cf-muted">
                          {p.package.type === "SESSION_BUNDLE" ? (
                              <>
                                Residue: <span className="font-medium cf-text">{p.remainingSessions ?? 0}</span> /{" "}
                                {p.package.sessionCount ?? 0}
                                {p.package.bundlePrice != null ? ` • € ${p.package.bundlePrice}` : ""}
                              </>
                            ) : (
                              <>
                                Mensile • Residui: <span className="font-medium cf-text">{p.remainingSessions ?? 0}</span> /{" "}
                                {p.package.monthlySessionCount ?? 0}
                                {p.package.monthlyPrice != null ? ` • € ${p.package.monthlyPrice}/mese` : ""}
                              </>
                            )
                          }
                          {p.expiresAt ? (
                            <>
                              {" "}
                              • Scade:{" "}
                              {new Date(p.expiresAt).toLocaleDateString("it-IT")}
                            </>
                          ) : null}
                        </div>

                        <div className="mt-1 text-[11px] cf-muted">
                          {p.active ? "Attivo" : "Disattivato"} • Avviato:{" "}
                          {new Date(p.startedAt).toLocaleDateString("it-IT")}
                        </div>
                      </div>
                        {p.active ? (
                          <form action={deactivatePackagePurchase} className="shrink-0">
                            <input type="hidden" name="purchaseId" value={p.id} />
                            <input type="hidden" name="clientSlug" value={client.slug} />
                            <button
                              type="submit"
                              className="rounded-2xl border cf-surface px-3 py-2 text-xs hover:border-black dark:hover:border-white"
                              title="Disattiva questo pacchetto per il cliente"
                            >
                              Disattiva
                            </button>
                          </form>
                        ) : (
                          <form action={reactivatePackagePurchase} className="shrink-0">
                            <input type="hidden" name="purchaseId" value={p.id} />
                            <input type="hidden" name="clientSlug" value={client.slug} />
                            <button
                              type="submit"
                              className="rounded-2xl border cf-surface px-3 py-2 text-xs hover:border-black dark:hover:border-white"
                              title="Riattiva questo pacchetto per il cliente"
                            >
                              Riattiva
                            </button>
                          </form>
                        )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "sessions" ? (
        <div className="cf-surface cf-hairline overflow-hidden">
          <div className="p-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold cf-text">Sessioni</div>
              <div className="mt-1 text-sm cf-muted">
                Storico sessioni e pagamenti.
              </div>
            </div>

            <Link
              href={`/app/booking/new?client=${client.slug}`}
              className="inline-flex items-center justify-center rounded-2xl cf-surface px-4 py-2 cf-text hover:border-black dark:hover:border-white"
            >
              Nuova sessione
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="px-6 pb-8">
              <div className="cf-soft cf-hairline p-8">
                <div className="text-sm font-medium">Nessuna sessione</div>
                <p className="mt-1 text-sm cf-muted">
                  Crea la prima sessione per questo cliente.
                </p>
                <Link
                  href={`/app/booking/new?client=${client.slug}`}
                  className="mt-6 inline-flex items-center justify-center rounded-2xl border bg-white px-4 py-2 text-sm hover:bg-neutral-50"
                >
                  Crea prima sessione
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {sessions.map((s, index) => {
                const paid = !!s.paidAt;
                const start = new Date(s.startsAt);
                const end = new Date(s.endsAt);
                const isFlash =
                  sid === s.id && (flash === "paid" || flash === "unpaid");
                const title = s.workoutTemplateId
                  ? workoutTitleById.get(s.workoutTemplateId)
                  : null;
                return (
                  <span
                    key={s.id}
                    className=" border-none flex items-center justify-center flex-col"
                  >
                    <li
                      key={s.id}
                      className="w-full border-none relative p-5 transition hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold cf-text">
                              {formatDate(start)}
                            </div>
                            <div className="text-sm cf-faint">
                              {formatTime(start)}–{formatTime(end)}
                            </div>

                            <span className="cf-chip">
                              {labelLocationType(String(s.locationType))}
                              {s.location ? ` · ${s.location}` : ""}
                            </span>
                          </div>

                          {s.notes ? (
                            <div className="mt-2 text-sm cf-text line-clamp-2">
                              {s.notes}
                            </div>
                          ) : (
                            <div className="mt-2 text-sm cf-faint">—</div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs cf-faint">
                            <span className="cf-chip">
                              {formatMoneyEUR(s.priceCents)}
                            </span>
                            <span
                              className={[
                                "cf-chip relative overflow-hidden",
                                isFlash ? "cf-wow" : "",
                                ,
                              ].join(" ")}
                            >
                              <span className="relative z-10">
                                {paid ? "Pagata" : "Da pagare"}
                              </span>
                              {isFlash ? (
                                <span className="cf-wow-glow" />
                              ) : null}
                            </span>
                            {s.paymentMethod ? (
                              <span className="cf-chip">{s.paymentMethod}</span>
                            ) : null}
                            {title ? (
                              <span className="cf-chip">{title}</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="cf-soft cf-hairline flex items-center gap-2 p-1">
                          <Link
                            href={`/app/sessions/${s.id}/${
                              title ? "change-workout" : "add-workout"
                            }`}
                            className="group inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium border cf-soft backdrop-blur-xl cf-text shadow-sm transition-all duration-200  hover:shadow-md active:scale-[0.98] hover:border-black dark:hover:border-white"
                            title="Assegna una scheda a questa sessione"
                          >
                            <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.08),transparent_60%)] hover:border-black dark:hover:border-white" />
                            <span className="relative">
                              <Image
                                alt="aggiungi-workout"
                                width={16}
                                height={16}
                                src={"/icons/add-workout.svg"}
                                className="block dark:hidden"
                              />
                              <Image
                                alt="aggiungi-workout"
                                width={16}
                                height={16}
                                src={"/icons/white-add-workout.svg"}
                                className="hidden dark:block "
                              />
                            </span>
                          </Link>
                          <Link
                            href={`/app/sessions/${s.id}/edit`}
                            className={[
                              `p-2 group block rounded-3xl border backdrop-blur-xl shadow-sm transition
           bg-white/55 border-neutral-200/60 hover:bg-white/75
           dark:bg-neutral-950/25 dark:border-white/10 dark:hover:bg-neutral-950/35 hover:border-black dark:hover:border-white`,
                            ].join(" ")}
                          >
                            <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.10),transparent_55%)]" />
                            <span className="relative">
                              <Image
                                alt="modifica"
                                width={16}
                                height={16}
                                src={`/icons/white-edit-alt-outline.svg`}
                                className="hidden dark:block"
                              />
                              <Image
                                alt="modifica"
                                width={16}
                                height={16}
                                src={`/icons/edit-alt-outline.svg`}
                                className="block dark:hidden"
                              />
                            </span>
                          </Link>
                          {paid ? (
                            <form action={markSessionUnpaid}>
                              <input
                                type="hidden"
                                name="sessionId"
                                value={s.id}
                              />
                              <button
                                type="submit"
                                className="group relative inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium border cf-soft backdrop-blur-xl cf-text shadow-sm transition-all duration-200hover:shadow-md"
                                title="Imposta come non pagata"
                              >
                                <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100 " />
                                <span className="relative">
                                  <Image
                                    alt="modifica"
                                    width={16}
                                    height={16}
                                    src="/icons/pay-now.svg"
                                    className="block dark:hidden"
                                  />
                                  <Image
                                    alt="modifica"
                                    width={16}
                                    height={16}
                                    src="/icons/white-pay-now.svg"
                                    className="hidden dark:block"
                                  />
                                </span>
                              </button>
                            </form>
                          ) : (
                            <form action={markSessionPaid}>
                              <input
                                type="hidden"
                                name="sessionId"
                                value={s.id}
                              />
                              <button
                                type="submit"
                                className="group relative inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium border cf-soft backdrop-blur-xl text-emerald-700 shadow-sm transition-all duration-200  hover:border-emerald-300/70 hover:shadow-md active:scale-[0.98]"
                                title="Segna come pagata"
                              >
                                <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100 " />
                                <span className="relative">
                                  {" "}
                                  <Image
                                    alt="modifica"
                                    width={16}
                                    height={16}
                                    src="/icons/pay-now.svg"
                                    className="block dark:hidden"
                                  />
                                  <Image
                                    alt="modifica"
                                    width={16}
                                    height={16}
                                    src="/icons/white-pay-now.svg"
                                    className="hidden dark:block"
                                  />
                                </span>
                              </button>
                            </form>
                          )}
                          <DeleteSessionButton
                            sessionId={s.id}
                            action={deleteSession}
                          />
                        </div>
                      </div>
                    </li>
                    <div
                      className={`${
                        sessions.length === index + 1 ? "hidden" : ""
                      } w-5 bg-black dark:bg-white h-0.5 m-3`}
                    />
                  </span>
                );
              })}
            </ul>
          )}
        </div>
      ) : activeTab === "progress" ? (
        <div className="rounded-3xl border cf-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold cf-text">
                Nuovo check-in
              </div>
              <div className="mt-1 mb-4 text-sm cf-muted">
                Peso, circonferenze e BIA (se disponibili).
              </div>
            </div>
          </div>
          <div className="rounded-3xl border cf-surface overflow-hidden">
            <div className="p-6">
              <div className="text-lg font-semibold cf-text">Storico</div>
              <div className="mt-1 text-sm cf-muted">Ultimi 25 check-in.</div>
            </div>

            {entries.length === 0 ? (
              <div className="px-6 pb-8">
                <div className="rounded-3xl border cf-surface p-6">
                  <div className="text-sm font-medium cf-text">
                    Nessun check-in
                  </div>
                  <p className="mt-1 text-sm cf-muted">
                    Aggiungi il primo check-in per iniziare a tracciare
                    progressi e BIA.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/10">
                {entries.map((e) => (
                  <li key={e.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold cf-text">
                          {new Date(e.measuredAt).toLocaleString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <Pill label="Peso" value={gToKg(e.weightG)} />
                          <Pill label="BF" value={bpToPct(e.bodyFatBp)} />
                          <Pill label="Vita" value={mmToCm(e.waistMm)} />
                          <Pill label="Fianchi" value={mmToCm(e.hipsMm)} />

                          {/* Braccio DX/SX */}
                          <Pill label="Braccio DX" value={mmToCm(e.armRmm)} />
                          <Pill label="Braccio SX" value={mmToCm(e.armLmm)} />

                          {/* Avambraccio DX/SX */}
                          <Pill
                            label="Avambr. DX"
                            value={mmToCm(e.forearmRmm)}
                          />
                          <Pill
                            label="Avambr. SX"
                            value={mmToCm(e.forearmLmm)}
                          />

                          {/* Coscia DX/SX */}
                          <Pill label="Coscia DX" value={mmToCm(e.thighRmm)} />
                          <Pill label="Coscia SX" value={mmToCm(e.thighLmm)} />

                          {/* Polpaccio DX/SX */}
                          <Pill label="Polp. DX" value={mmToCm(e.calfRmm)} />
                          <Pill label="Polp. SX" value={mmToCm(e.calfLmm)} />
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <Pill label="TBW" value={bpToPct(e.tbwBp)} />
                          <Pill label="ICW" value={bpToPct(e.icwBp)} />
                          <Pill label="ECW" value={bpToPct(e.ecwBp)} />
                          <Pill label="Phase" value={bpToPct(e.phaseAngleBp)} />
                          <Pill
                            label="BMR"
                            value={
                              e.bmrKcal != null ? `${e.bmrKcal} kcal` : "—"
                            }
                          />
                          <Pill label="Muscolo" value={gToKg(e.muscleMassG)} />
                          <Pill label="Grasso" value={gToKg(e.fatMassG)} />
                          <Pill label="FFM" value={gToKg(e.ffmG)} />
                          <Pill label="Visc." value={e.visceralFat ?? "—"} />
                          <Pill label="Età" value={e.metabolicAge ?? "—"} />
                        </div>

                        {e.notes ? (
                          <div className="mt-3 text-sm cf-muted whitespace-pre-wrap">
                            {e.notes}
                          </div>
                        ) : null}
                      </div>

                      {/* (Step successivo) azioni edit/delete */}
                      <div className="flex items-center gap-2">
                        <span className="rounded-2xl border cf-surface px-3 py-2 text-xs cf-faint">
                          Check-in
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
         
        <MetricsForm clientId={client.id} />
        </div>
      ) : (
        <>
          <OverviewStatsCards clientId={client.id} />
          <div>
            <BodyMapCard clientId={client.id} clientSlug={client.slug} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Notes */}
            <div className="lg:col-span-2 cf-surface cf-hairline p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Note</div>
                <span className="text-xs cf-faint">
                  Creato il{" "}
                  {new Date(client.createdAt).toLocaleDateString("it-IT")}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed cf-text">
                {client.notes?.trim() ? client.notes : "—"}
              </p>

              <div className="mt-6 flex items-center gap-2">
                <button className="rounded-2xl bg-black px-4 py-2 text-sm text-white hover:opacity-90">
                  Modifica note
                </button>
                <button className="rounded-2xl border bg-white px-4 py-2 text-sm hover:bg-neutral-50">
                  Archivia
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- UI bits ---------- */

function StatusPill({ status }: { status: string }) {
  const isActive = status.toUpperCase() === "ACTIVE";
  return (
    <span className={["cf-chip", isActive ? "" : "opacity-80"].join(" ")}>
      {status}
    </span>
  );
}

function ActionCard({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="p-4 group block rounded-3xl border backdrop-blur-xl shadow-sm transition hover:-translate-y-[1px]
           bg-white/55 border-neutral-200/60 hover:bg-white/75
           dark:bg-neutral-950/25 dark:border-white/10 dark:hover:bg-neutral-950/35 hover:border-black dark:hover:border-white"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold cf-text">{title}</div>
        <div className="cf-faint transition group-hover:translate-x-0.5">→</div>
      </div>
      <div className="mt-1 text-xs cf-muted">{subtitle}</div>
    </Link>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={[
        "rounded-2xl px-4 py-2 text-sm transition cf-surface cf-text hover:border-black hover:dark:border-white",
        active ? "border-1 border-black dark:border-white" : "",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function StatRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-xs cf-faint">{label}</div>
      <div
        className={[
          "text-xs cf-text text-right break-all",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
function Field({
  label,
  name,
  placeholder,
  type = "text",
  textarea,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs cf-faint">{label}</div>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          className="w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text outline-none"
          rows={3}
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          className="w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text outline-none"
        />
      )}
    </label>
  );
}
function Pill({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const v =
    value === null || value === undefined || value === "" ? "—" : String(value);

  return (
    <span className="inline-flex items-center gap-2 rounded-full border cf-surface px-2.5 py-1 text-[11px] leading-none">
      <span className="cf-faint">{label}</span>
      <span className="cf-text font-medium">{v}</span>
    </span>
  );
}
