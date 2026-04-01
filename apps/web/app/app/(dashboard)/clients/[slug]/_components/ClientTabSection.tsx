import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

import {
  deleteSession,
  markSessionPaid,
  markSessionUnpaid,
} from "../../../../../../actions/sessions";

import { listMetricsEntries } from "../../../../../../actions/metrics";
import { getClientProfile } from "../../../../../../actions/profile";

import BodyMapCard from "./BodyMapCard";
import OverviewStatsCards from "./OverviewStatsCards";
import MetricsForm from "./MetricsForm";

import {
  assignPackageToClient,
  deactivatePackagePurchase,
  reactivatePackagePurchase,
} from "../../../../../../actions/packagePurchase";
import DeleteSessionButton from "@/app/app/_components/DeleteSessionButton";
import ClientWorkoutsTab from "./ClientWorkoutsTab";

type TabKey = "overview" | "packages" | "sessions" | "progress" | "workouts";

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

function TabShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border cf-surface cf-hairline">
      <div className="border-b border-black/5 p-6 dark:border-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
              {eyebrow}
            </div>
            <div className="mt-2 text-xl font-semibold cf-text">{title}</div>
            <div className="mt-1 text-sm cf-muted">{description}</div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default async function ClientTabSection({
  tenantId,
  client,
  activeTab,
  flash,
  sid,
}: {
  tenantId: string;
  client: {
    id: string;
    slug: string;
    createdAt: Date;
    notes?: string | null;
  };
  activeTab: TabKey;
  flash?: string;
  sid?: string;
}) {
  if (activeTab === "packages") {
    const [packages, purchases] = await Promise.all([
      prisma.package.findMany({
        where: { tenantId },
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
      }),

      prisma.packagePurchase.findMany({
        where: { tenantId, clientId: client.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          active: true,
          remainingSessions: true,
          startedAt: true,
          expiresAt: true,
          package: {
            select: {
              name: true,
              type: true,
              sessionCount: true,
              bundlePrice: true,
              monthlyPrice: true,
              monthlySessionCount: true,
            },
          },
        },
      }),
    ]);

    return (
      <TabShell
        eyebrow="Packages"
        title="Pacchetti"
        description="Assegna bundle o abbonamenti mensili e monitora il loro stato."
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="cf-card rounded-[28px]">
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
                          ? `• ${p.sessionCount ?? 0} sessioni${
                              p.bundlePrice != null ? ` • € ${p.bundlePrice}` : ""
                            }`
                          : `• ${p.monthlySessionCount ?? 0} crediti${
                              p.monthlyPrice != null
                                ? ` • € ${p.monthlyPrice}/mese`
                                : ""
                            }`}
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
                    className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
                  >
                    Assegna
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="cf-card rounded-[28px]">
            <div className="text-sm font-semibold cf-text">Pacchetti assegnati</div>
            <div className="mt-1 text-xs cf-muted">
              Bundle mostra crediti residui. Mensile mostra stato e periodo.
            </div>

            {purchases.length === 0 ? (
              <div className="mt-4 text-sm cf-muted">Nessun pacchetto assegnato.</div>
            ) : (
              <ul className="mt-4 divide-y divide-black/5 dark:divide-white/10">
                {purchases.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold cf-text">
                        {p.package.name}
                      </div>
                      <div className="mt-1 text-xs cf-muted">
                        {p.package.type === "SESSION_BUNDLE" ? (
                          <>
                            Residue:{" "}
                            <span className="font-medium cf-text">
                              {p.remainingSessions ?? 0}
                            </span>{" "}
                            / {p.package.sessionCount ?? 0}
                            {p.package.bundlePrice != null
                              ? ` • € ${p.package.bundlePrice}`
                              : ""}
                          </>
                        ) : (
                          <>
                            Mensile • Residui:{" "}
                            <span className="font-medium cf-text">
                              {p.remainingSessions ?? 0}
                            </span>{" "}
                            / {p.package.monthlySessionCount ?? 0}
                            {p.package.monthlyPrice != null
                              ? ` • € ${p.package.monthlyPrice}/mese`
                              : ""}
                          </>
                        )}
                        {p.expiresAt ? (
                          <>
                            {" "}
                            • Scade:{" "}
                            {new Date(p.expiresAt).toLocaleDateString("it-IT")}
                          </>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="cf-chip">{p.active ? "Attivo" : "Disattivato"}</span>
                        <span className="cf-chip">
                          Avviato {new Date(p.startedAt).toLocaleDateString("it-IT")}
                        </span>
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
      </TabShell>
    );
  }

  if (activeTab === "workouts") {
    return <ClientWorkoutsTab tenantId={tenantId} client={client} />;
  }

  if (activeTab === "sessions") {
    const sessions = await prisma.appointment.findMany({
      where: {
        tenantId,
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
    });

    const workoutIds = Array.from(
      new Set(sessions.map((s) => s.workoutTemplateId).filter(Boolean))
    ) as string[];

    const templates =
      workoutIds.length > 0
        ? await prisma.workoutTemplate.findMany({
            where: { tenantId, id: { in: workoutIds } },
            select: { id: true, title: true },
          })
        : [];

    const workoutTitleById = new Map(templates.map((t) => [t.id, t.title]));

    return (
      <TabShell
        eyebrow="Sessions"
        title="Sessioni"
        description="Storico appuntamenti, stato pagamento e collegamento workout."
        action={
          <Link
            href={`/app/booking/new?client=${client.slug}`}
            className="inline-flex items-center justify-center rounded-2xl border cf-surface px-4 py-2 cf-text hover:border-black dark:hover:border-white"
          >
            Nuova sessione
          </Link>
        }
      >
        {sessions.length === 0 ? (
          <div className="cf-soft cf-hairline rounded-[28px] p-8">
            <div className="text-sm font-medium">Nessuna sessione</div>
            <p className="mt-1 text-sm cf-muted">
              Crea la prima sessione per questo cliente.
            </p>
            <Link
              href={`/app/booking/new?client=${client.slug}`}
              className="mt-6 inline-flex items-center justify-center rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:border-black dark:hover:border-white"
            >
              Crea prima sessione
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {sessions.map((s) => {
              const paid = !!s.paidAt;
              const start = new Date(s.startsAt);
              const end = new Date(s.endsAt);
              const isFlash = sid === s.id && (flash === "paid" || flash === "unpaid");
              const title = s.workoutTemplateId
                ? workoutTitleById.get(s.workoutTemplateId) ?? null
                : null;

              return (
                <li
                  key={s.id}
                  className="rounded-[28px] border cf-surface px-5 py-5 transition hover:-translate-y-[1px] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold cf-text">{formatDate(start)}</div>
                        <div className="text-sm cf-faint">
                          {formatTime(start)}–{formatTime(end)}
                        </div>
                        <span className="cf-chip">
                          {labelLocationType(String(s.locationType))}
                          {s.location ? ` · ${s.location}` : ""}
                        </span>
                      </div>

                      {s.notes ? (
                        <div className="mt-2 text-sm cf-text line-clamp-2">{s.notes}</div>
                      ) : (
                        <div className="mt-2 text-sm cf-faint">—</div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs cf-faint">
                        <span className="cf-chip">{formatMoneyEUR(s.priceCents)}</span>
                        <span
                          className={[
                            "cf-chip relative overflow-hidden",
                            isFlash ? "cf-wow" : "",
                          ].join(" ")}
                        >
                          <span className="relative z-10">{paid ? "Pagata" : "Da pagare"}</span>
                          {isFlash ? <span className="cf-wow-glow" /> : null}
                        </span>
                        {s.paymentMethod ? <span className="cf-chip">{s.paymentMethod}</span> : null}
                        {title ? <span className="cf-chip">{title}</span> : null}
                      </div>
                    </div>

                    <div className="cf-soft cf-hairline flex flex-wrap items-center gap-2 rounded-[24px] p-2">
                      <Link
                        href={`/app/sessions/${s.id}/${title ? "change-workout" : "add-workout"}`}
                        className="group inline-flex items-center justify-center rounded-2xl border cf-soft px-3 py-2 text-sm font-medium cf-text shadow-sm transition-all duration-200 hover:border-black hover:shadow-md active:scale-[0.98] dark:hover:border-white"
                        title="Assegna una scheda a questa sessione"
                      >
                        <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.08),transparent_60%)]" />
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
                            className="hidden dark:block"
                          />
                        </span>
                      </Link>

                      <Link
                        href={`/app/sessions/${s.id}/edit`}
                        className="group block rounded-3xl border bg-white/55 p-2 shadow-sm transition hover:border-black hover:bg-white/75 dark:border-white/10 dark:bg-neutral-950/25 dark:hover:border-white dark:hover:bg-neutral-950/35"
                      >
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
                          <input type="hidden" name="sessionId" value={s.id} />
                          <button
                            type="submit"
                            className="group relative inline-flex items-center justify-center rounded-2xl border cf-soft px-3 py-2 text-sm font-medium cf-text shadow-sm transition-all duration-200 hover:shadow-md"
                            title="Imposta come non pagata"
                          >
                            <span className="relative">
                              <Image
                                alt="pay"
                                width={16}
                                height={16}
                                src="/icons/pay-now.svg"
                                className="block dark:hidden"
                              />
                              <Image
                                alt="pay"
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
                          <input type="hidden" name="sessionId" value={s.id} />
                          <button
                            type="submit"
                            className="group relative inline-flex items-center justify-center rounded-2xl border cf-soft px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-all duration-200 hover:border-emerald-300/70 hover:shadow-md active:scale-[0.98]"
                            title="Segna come pagata"
                          >
                            <span className="relative">
                              <Image
                                alt="pay"
                                width={16}
                                height={16}
                                src="/icons/pay-now.svg"
                                className="block dark:hidden"
                              />
                              <Image
                                alt="pay"
                                width={16}
                                height={16}
                                src="/icons/white-pay-now.svg"
                                className="hidden dark:block"
                              />
                            </span>
                          </button>
                        </form>
                      )}

                      <DeleteSessionButton sessionId={s.id} action={deleteSession} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </TabShell>
    );
  }

  if (activeTab === "progress") {
    const [profile, entries] = await Promise.all([
      getClientProfile(client.id),
      listMetricsEntries(client.id),
    ]);

    void profile;

    return (
      <TabShell
        eyebrow="Progress"
        title="Check-in e progressi"
        description="Peso, circonferenze e BIA con storico consultabile."
      >
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[28px] border cf-surface">
            <div className="p-6">
              <div className="text-lg font-semibold cf-text">Storico</div>
              <div className="mt-1 text-sm cf-muted">Ultimi 25 check-in.</div>
            </div>

            {entries.length === 0 ? (
              <div className="px-6 pb-8">
                <div className="rounded-[26px] border cf-surface p-6">
                  <div className="text-sm font-medium cf-text">Nessun check-in</div>
                  <p className="mt-1 text-sm cf-muted">
                    Aggiungi il primo check-in per iniziare a tracciare progressi e BIA.
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
                          <Pill label="Braccio DX" value={mmToCm(e.armRmm)} />
                          <Pill label="Braccio SX" value={mmToCm(e.armLmm)} />
                          <Pill label="Avambr. DX" value={mmToCm(e.forearmRmm)} />
                          <Pill label="Avambr. SX" value={mmToCm(e.forearmLmm)} />
                          <Pill label="Coscia DX" value={mmToCm(e.thighRmm)} />
                          <Pill label="Coscia SX" value={mmToCm(e.thighLmm)} />
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
                            value={e.bmrKcal != null ? `${e.bmrKcal} kcal` : "—"}
                          />
                          <Pill label="Muscolo" value={gToKg(e.muscleMassG)} />
                          <Pill label="Grasso" value={gToKg(e.fatMassG)} />
                          <Pill label="FFM" value={gToKg(e.ffmG)} />
                          <Pill label="Visc." value={e.visceralFat ?? "—"} />
                          <Pill label="Età" value={e.metabolicAge ?? "—"} />
                        </div>

                        {e.notes ? (
                          <div className="mt-3 whitespace-pre-wrap text-sm cf-muted">
                            {e.notes}
                          </div>
                        ) : null}
                      </div>

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

          <div className="rounded-[28px] border cf-surface p-6">
            <div className="mb-4">
              <div className="text-sm font-semibold cf-text">Nuovo check-in</div>
              <div className="mt-1 text-sm cf-muted">
                Inserisci dati antropometrici e BIA se disponibili.
              </div>
            </div>
            <MetricsForm clientId={client.id} />
          </div>
        </div>
      </TabShell>
    );
  }

  return (
    <div className="space-y-6">
      <OverviewStatsCards clientId={client.id} />

      <div className="rounded-[30px] border cf-surface cf-hairline p-5 sm:p-6">
        <BodyMapCard clientId={client.id} clientSlug={client.slug} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[30px] border cf-surface cf-hairline p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
                Notes
              </div>
              <div className="mt-2 text-sm font-medium cf-text">Note cliente</div>
            </div>
            <span className="text-xs cf-faint">
              Creato il {new Date(client.createdAt).toLocaleDateString("it-IT")}
            </span>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed cf-text">
            {client.notes?.trim() ? client.notes : "—"}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button className="rounded-2xl bg-black px-4 py-2 text-sm text-white hover:opacity-90 dark:bg-white dark:text-black">
              Modifica note
            </button>
            <button className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:border-black dark:hover:border-white">
              Archivia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
