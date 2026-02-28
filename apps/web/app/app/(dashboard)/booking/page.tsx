export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireTenantFromSession } from "@/lib/tenant";
import { AppointmentStatus } from "@prisma/client";

type RangeKey = "today" | "week" | "all";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  x.setDate(x.getDate() + diff);
  return x;
}

function fmtMoneyEUR(cents?: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

function fmtDateLine(startsAt: Date, endsAt?: Date | null) {
  const d = new Date(startsAt);
  const e = endsAt ? new Date(endsAt) : null;

  const day = d.toLocaleDateString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const time = d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endTime = e
    ? e.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    : null;

  return `${day} • ${time}${endTime ? `–${endTime}` : ""}`;
}

function statusLabel(s: AppointmentStatus) {
  if (s === "SCHEDULED") return "Pianificata";
  if (s === "COMPLETED") return "Completata";
  return "Cancellata";
}

function statusChipClass(s: AppointmentStatus) {
  if (s === "COMPLETED")
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
  if (s === "CANCELED")
    return "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200";
  return "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-200";
}

function rangeLabel(r: RangeKey) {
  return r === "today" ? "Oggi" : r === "week" ? "Settimana" : "Tutte";
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: RangeKey;
    status?: AppointmentStatus;
  }>;
}) {
  const { tenant } = await requireTenantFromSession();

  // ✅ IMPORTANT: searchParams is a Promise in recent Next
  const sp = await searchParams;
  const range: RangeKey = sp.range ?? "week";
  const status: AppointmentStatus | undefined = sp.status;

  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  const weekStart = startOfWeekMonday(now);
  const nextWeekStart = addDays(weekStart, 7);

  const dateFilter =
    range === "today"
      ? { gte: today, lt: tomorrow }
      : range === "week"
      ? { gte: weekStart, lt: nextWeekStart }
      : undefined; // "all" => no filter

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      ...(dateFilter ? { startsAt: dateFilter } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      locationType: true,
      location: true,
      priceCents: true,
      paidAt: true,
      client: { select: { slug: true, fullName: true } },
    },
  });

  const total = appointments.length;
  const paidCount = appointments.filter((a) => !!a.paidAt).length;
  const revenueCents = appointments.reduce(
    (sum, a) => sum + (a.paidAt ? a.priceCents ?? 0 : 0),
    0
  );

  const makeHref = (next: {
    range?: RangeKey | null;
    status?: AppointmentStatus | null;
  }) => {
    const r = next.range === undefined ? range : next.range; // undefined = keep
    const s = next.status === undefined ? status : next.status; // undefined = keep

    const qs = new URLSearchParams();
    if (r && r !== "week") qs.set("range", r); // opzionale: non scrivere default
    if (s) qs.set("status", s);

    const str = qs.toString();
    return `/app/booking${str ? `?${str}` : ""}`;
  };

  return (
    <div className="space-y-6 p-6 cf-text">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold cf-text">Booking</h1>
          <p className="mt-1 text-sm cf-muted">
            Gestisci sessioni, stato e pagamenti.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/clients"
            className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:border-black dark:hover:border-white"
          >
            Vai ai clienti
          </Link>
        </div>
      </header>

      {/* KPI mini row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="cf-card">
          <div className="text-xs cf-muted">Sessioni ({rangeLabel(range)})</div>
          <div className="mt-1 text-2xl font-semibold cf-text">{total}</div>
        </div>

        <div className="cf-card">
          <div className="text-xs cf-muted">Pagate</div>
          <div className="mt-1 text-2xl font-semibold cf-text">{paidCount}</div>
          <div className="mt-1 text-xs cf-muted">
            {total ? `${Math.round((paidCount / total) * 100)}%` : "0%"} del
            totale
          </div>
        </div>

        <div className="cf-card">
          <div className="text-xs cf-muted">Revenue (pagate)</div>
          <div className="mt-1 text-2xl font-semibold cf-text">
            {fmtMoneyEUR(revenueCents)}
          </div>
          <div className="mt-1 text-xs cf-muted">nel range selezionato</div>
        </div>
      </div>

      {/* Filters sticky */}
      <div className="sticky top-6 z-10 cf-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Range segmented */}
          <div className="flex rounded-2xl border cf-surface p-1">
            {(["today", "week", "all"] as const).map((r) => (
              <Link
                key={r}
                href={makeHref({ range: r, status })}
                className={[
                  "rounded-xl px-3 py-2 text-sm transition",
                  range === r
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "cf-text hover:bg-white/70 dark:hover:bg-white/10",
                ].join(" ")}
              >
                {rangeLabel(r)}
              </Link>
            ))}
          </div>

          <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />

          {/* Status segmented */}
          <div className="flex rounded-2xl border cf-surface p-1">
            <Link
              href={makeHref({ range, status: null })}
              className={[
                "rounded-xl px-3 py-2 text-sm transition",
                !status
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "cf-text hover:bg-white/70 dark:hover:bg-white/10",
              ].join(" ")}
            >
              Tutti
            </Link>
            {(
              ["SCHEDULED", "COMPLETED", "CANCELED"] as AppointmentStatus[]
            ).map((s) => (
              <Link
                key={s}
                href={makeHref({ range, status: s })}
                className={[
                  "rounded-xl px-3 py-2 text-sm transition",
                  status === s
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "cf-text hover:bg-white/70 dark:hover:bg-white/10",
                ].join(" ")}
              >
                {s === "SCHEDULED"
                  ? "Pianificate"
                  : s === "COMPLETED"
                  ? "Completate"
                  : "Cancellate"}
              </Link>
            ))}
          </div>

          <Link
            href={makeHref({ range: "week", status: null })}
            className="ml-auto text-sm cf-faint hover:underline"
            title="Reset filtri"
          >
            Reset filtri
          </Link>
        </div>
      </div>

      {/* List */}
      <div className="cf-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="text-sm font-semibold cf-text">{total} sessioni</div>
          <div className="text-xs cf-muted">
            {status ? `Filtro: ${statusLabel(status)}` : "Tutti gli stati"}
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="px-6 py-10 text-sm cf-muted">
            Nessuna sessione per i filtri selezionati.
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {appointments.map((a) => {
              const paid = !!a.paidAt;

              return (
                <div
                  key={a.id}
                  className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold cf-text">
                        {fmtDateLine(a.startsAt, a.endsAt)}
                      </div>

                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          statusChipClass(a.status),
                        ].join(" ")}
                      >
                        {statusLabel(a.status)}
                      </span>

                      {paid ? (
                        <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                          Pagata
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs cf-muted">
                      <span className="truncate">
                        {a.locationType}
                        {a.location ? ` • ${a.location}` : ""}
                      </span>
                      <span className="opacity-30">•</span>
                      <Link
                        href={`/app/clients/${a.client.slug}`}
                        className="font-medium cf-text hover:underline"
                      >
                        {a.client.fullName}
                      </Link>
                      <span className="opacity-30">•</span>
                      <span>{fmtMoneyEUR(a.priceCents)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      href={`/app/booking/edit?id=${a.id}`}
                      className="rounded-xl border cf-surface px-3 py-2 text-sm cf-text hover:border-black dark:hover:border-white"
                    >
                      Modifica
                    </Link>

                    <Link
                      href={`/app/booking/duplicate?id=${a.id}`}
                      className="rounded-xl border cf-surface px-3 py-2 text-sm cf-text hover:border-black dark:hover:border-white"
                    >
                      Duplica
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
