export const revalidate = 100;

import Link from "next/link";
import { cancelScheduledSession } from "@/actions/booking";
import { prisma } from "@/lib/db";
import { isRealtimeEnabled } from "@/lib/realtime";
import { requireTenantFromSession } from "@/lib/tenant";
import { AppointmentStatus } from "@prisma/client";
import BookingRealtimeBridge from "./BookingRealtimeBridge";
import {
  acceptBookingRequest,
  rejectBookingRequest,
} from "@/actions/booking-requests";

type RangeKey = "today" | "week" | "month" | "all";
const PAGE_SIZE = 8;

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
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function getMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(month: string) {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1, 1);
}

function changeMonth(month: string, delta: number) {
  const base = parseMonthKey(month);
  const next = new Date(base.getFullYear(), base.getMonth() + delta, 1);
  return getMonthKey(next);
}

function formatMonthLabel(month: string) {
  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
  }).format(parseMonthKey(month));
}

function formatMonthHeading(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
  }).format(date);
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
  if (s === "PENDING") return "In attesa";
  if (s === "SCHEDULED") return "Pianificata";
  if (s === "COMPLETED") return "Completata";
  return "Cancellata";
}

function statusChipClass(s: AppointmentStatus) {
  if (s === "PENDING")
    return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200";
  if (s === "COMPLETED")
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
  if (s === "CANCELED")
    return "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200";
  return "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-200";
}

function rangeLabel(r: RangeKey) {
  return r === "today"
    ? "Oggi"
    : r === "week"
      ? "Settimana"
      : r === "month"
        ? "Mese"
        : "Tutte";
}

function formatRangeDescription(range: RangeKey, month: string) {
  if (range === "today") return "Solo le sessioni di oggi";
  if (range === "week") return "Panoramica della settimana corrente";
  if (range === "month") return `Sessioni previste in ${formatMonthLabel(month)}`;
  return "Archivio completo raggruppato per mese";
}

function parsePositivePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: RangeKey;
    status?: AppointmentStatus;
    month?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const { tenant } = await requireTenantFromSession();
  const realtimeEnabled = isRealtimeEnabled();

  const sp = await searchParams;
  const range: RangeKey = sp.range ?? "month";
  const status: AppointmentStatus | undefined = sp.status;
  const q = (sp.q ?? "").trim();
  const requestedPage = parsePositivePage(sp.page);
  const selectedMonth =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : getMonthKey(new Date());

  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const weekStart = startOfWeekMonday(now);
  const nextWeekStart = addDays(weekStart, 7);
  const monthDate = parseMonthKey(selectedMonth);
  const monthStart = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
  const nextMonthStart = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  );

  const dateFilter =
    range === "today"
      ? { gte: today, lt: tomorrow }
      : range === "week"
        ? { gte: weekStart, lt: nextWeekStart }
        : range === "month"
          ? { gte: monthStart, lt: nextMonthStart }
          : undefined;

  const baseWhere = {
    tenantId: tenant.id,
    OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    ...(dateFilter ? { startsAt: dateFilter } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          client: {
            fullName: {
              contains: q,
              mode: "insensitive" as const,
            },
          },
        }
      : {}),
  };

  const [metricsAppointments, total, pageAppointments] = await Promise.all([
    prisma.appointment.findMany({
      where: baseWhere,
      select: {
        paidAt: true,
        priceCents: true,
      },
    }),
    prisma.appointment.count({
      where: baseWhere,
    }),
    prisma.appointment.findMany({
      where: baseWhere,
      orderBy: { startsAt: "asc" },
      skip: (requestedPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
    }),
  ]);

  const paidCount = metricsAppointments.filter((a) => !!a.paidAt).length;
  const revenueCents = metricsAppointments.reduce(
    (sum, a) => sum + (a.paidAt ? a.priceCents ?? 0 : 0),
    0
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const visibleFrom = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const visibleTo = total === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, total);

  const monthGroups = pageAppointments.reduce<
    Array<{
      key: string;
      label: string;
      items: typeof pageAppointments;
    }>
  >((groups, appointment) => {
    const key = getMonthKey(appointment.startsAt);
    const existingGroup = groups.at(-1);

    if (existingGroup && existingGroup.key === key) {
      existingGroup.items.push(appointment);
      return groups;
    }

    groups.push({
      key,
      label: formatMonthHeading(appointment.startsAt),
      items: [appointment],
    });

    return groups;
  }, []);

  const makeHref = (next: {
    range?: RangeKey | null;
    status?: AppointmentStatus | null;
    month?: string | null;
    q?: string | null;
    page?: number | null;
  }) => {
    const r = next.range === undefined ? range : next.range;
    const s = next.status === undefined ? status : next.status;
    const m = next.month === undefined ? selectedMonth : next.month;
    const nq = next.q === undefined ? q : next.q;
    const np = next.page === undefined ? currentPage : next.page;

    const qs = new URLSearchParams();
    if (r && r !== "month") qs.set("range", r);
    if (s) qs.set("status", s);
    if (m) qs.set("month", m);
    if (nq?.trim()) qs.set("q", nq.trim());
    if (np && np > 1) qs.set("page", String(np));

    const str = qs.toString();
    return `/app/booking${str ? `?${str}` : ""}`;
  };

  const searchResetHref = makeHref({ q: null, page: 1 });

  return (
    <div className="space-y-6 p-6 cf-text">
      <BookingRealtimeBridge tenantId={tenant.id} enabled={realtimeEnabled} />

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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-[30px] border cf-card">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%)]" />
          <div className="relative p-6">
            <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
              Sessions
            </div>
            <div className="mt-2 text-sm cf-muted">
              {rangeLabel(range)} • {formatMonthLabel(selectedMonth)}
            </div>
            <div className="mt-5 text-4xl font-semibold tracking-tight cf-text">
              {total}
            </div>
            <div className="mt-2 text-sm cf-muted">Sessioni nel periodo attivo</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[30px] border cf-card">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%)]" />
          <div className="relative p-6">
            <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
              Payments
            </div>
            <div className="mt-2 text-sm cf-muted">Pagate</div>
            <div className="mt-5 text-4xl font-semibold tracking-tight cf-text">
              {paidCount}
            </div>
            <div className="mt-2 text-sm cf-muted">
              {total ? `${Math.round((paidCount / total) * 100)}%` : "0%"} del totale
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[30px] border cf-card">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_30%)]" />
          <div className="relative p-6">
            <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
              Revenue
            </div>
            <div className="mt-2 text-sm cf-muted">Sessioni pagate</div>
            <div className="mt-5 text-4xl font-semibold tracking-tight cf-text">
              {fmtMoneyEUR(revenueCents)}
            </div>
            <div className="mt-2 text-sm cf-muted">nel range selezionato</div>
          </div>
        </div>
      </div>

      <div className="sticky top-6 z-1 cf-card space-y-4 p-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="rounded-[26px] border cf-surface p-4 dark:bg-[rgba(12,20,38,0.9)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] cf-muted">
                  Vista calendario
                </div>
                <div className="mt-2 text-lg font-semibold cf-text">
                  {formatMonthLabel(selectedMonth)}
                </div>
                <div className="mt-1 text-sm cf-muted">
                  {formatRangeDescription(range, selectedMonth)}
                </div>
              </div>

              <Link
                href={makeHref({
                  range: "month",
                  status: null,
                  month: getMonthKey(new Date()),
                  page: 1,
                })}
                className="rounded-2xl border cf-soft px-3.5 py-2 text-sm cf-text transition hover:bg-white/70 dark:hover:bg-white/12"
                title="Reset filtri"
              >
                Oggi
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href={makeHref({ month: changeMonth(selectedMonth, -1), page: 1 })}
                className="rounded-2xl border cf-soft px-3 py-2 text-sm cf-text transition hover:bg-white/70 dark:hover:bg-white/12"
              >
                Mese prec.
              </Link>
              <div className="min-w-[220px] rounded-2xl border cf-soft px-4 py-2 text-center text-sm font-medium capitalize cf-text dark:bg-[rgba(25,37,64,0.92)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                {formatMonthLabel(selectedMonth)}
              </div>
              <Link
                href={makeHref({ month: changeMonth(selectedMonth, 1), page: 1 })}
                className="rounded-2xl border cf-soft px-3 py-2 text-sm cf-text transition hover:bg-white/70 dark:hover:bg-white/12"
              >
                Mese succ.
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[26px] border cf-surface p-4 dark:bg-[rgba(12,20,38,0.9)]">
              <div className="mb-2 text-[11px] uppercase tracking-[0.14em] cf-muted">
                Periodo
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["today", "week", "month", "all"] as const).map((r) => (
                  <Link
                    key={r}
                    href={makeHref({ range: r, page: 1 })}
                    className={[
                      "flex min-h-[52px] items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium transition",
                      range === r
                        ? "border border-sky-300/25 bg-gradient-to-r from-[#18355f] via-[#1d4377] to-[#18355f] text-white shadow-[0_16px_34px_rgba(17,54,100,0.24)]"
                        : "border border-black/5 bg-black/[0.02] cf-text hover:border-black/5 hover:bg-white/70 dark:border-white/10 dark:bg-[rgba(28,42,72,0.72)] dark:text-slate-100 dark:hover:border-white/18 dark:hover:bg-[rgba(38,56,93,0.82)]",
                    ].join(" ")}
                  >
                    {rangeLabel(r)}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border cf-surface p-4 dark:bg-[rgba(12,20,38,0.9)]">
              <div className="mb-2 text-[11px] uppercase tracking-[0.14em] cf-muted">
                Stato sessione
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={makeHref({ status: null, page: 1 })}
                  className={[
                    "flex min-h-[52px] items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium transition",
                    !status
                      ? "border border-sky-300/25 bg-gradient-to-r from-[#18355f] via-[#1d4377] to-[#18355f] text-white shadow-[0_16px_34px_rgba(17,54,100,0.24)]"
                      : "border border-black/5 bg-black/[0.02] cf-text hover:border-black/5 hover:bg-white/70 dark:border-white/10 dark:bg-[rgba(28,42,72,0.72)] dark:text-slate-100 dark:hover:border-white/18 dark:hover:bg-[rgba(38,56,93,0.82)]",
                  ].join(" ")}
                >
                  Tutti
                </Link>
                {(
                  ["PENDING", "SCHEDULED", "COMPLETED", "CANCELED"] as AppointmentStatus[]
                ).map((s) => (
                  <Link
                    key={s}
                    href={makeHref({ status: s, page: 1 })}
                    className={[
                      "flex min-h-[52px] items-center justify-center rounded-2xl px-3 py-2 text-center text-sm font-medium transition",
                      s === "COMPLETED" || s === "CANCELED" ? "col-span-2" : "",
                      status === s
                        ? "border border-sky-300/25 bg-gradient-to-r from-[#18355f] via-[#1d4377] to-[#18355f] text-white shadow-[0_16px_34px_rgba(17,54,100,0.24)]"
                        : "border border-black/5 bg-black/[0.02] cf-text hover:border-black/5 hover:bg-white/70 dark:border-white/10 dark:bg-[rgba(28,42,72,0.72)] dark:text-slate-100 dark:hover:border-white/18 dark:hover:bg-[rgba(38,56,93,0.82)]",
                    ].join(" ")}
                  >
                    {s === "SCHEDULED"
                      ? "Pianificate"
                      : s === "PENDING"
                        ? "In attesa"
                        : s === "COMPLETED"
                          ? "Completate"
                          : "Cancellate"}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* <div className="grid gap-3 lg:grid-cols-3">
          {[
            {
              label: "Mese precedente",
              href: makeHref({
                month: changeMonth(selectedMonth, -1),
                range: "month",
                page: 1,
              }),
              value: formatMonthLabel(changeMonth(selectedMonth, -1)),
            },
            {
              label: "Mese attuale",
              href: makeHref({
                month: getMonthKey(new Date()),
                range: "month",
                page: 1,
              }),
              value: formatMonthLabel(getMonthKey(new Date())),
            },
            {
              label: "Mese successivo",
              href: makeHref({
                month: changeMonth(selectedMonth, 1),
                range: "month",
                page: 1,
              }),
              value: formatMonthLabel(changeMonth(selectedMonth, 1)),
            },
          ].map((monthCard) => (
            <Link
              key={monthCard.label}
              href={monthCard.href}
              className="rounded-[22px] border cf-surface px-4 py-3 transition hover:bg-white/70 dark:hover:bg-white/10"
            >
              <div className="text-[11px] uppercase tracking-[0.14em] cf-muted">
                {monthCard.label}
              </div>
              <div className="mt-1 text-sm font-medium capitalize cf-text">
                {monthCard.value}
              </div>
            </Link>
          ))}
        </div> */}

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form action="/app/booking" method="get" className="rounded-[24px] border cf-surface p-3">
            {range !== "month" ? <input type="hidden" name="range" value={range} /> : null}
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <input type="hidden" name="month" value={selectedMonth} />

            <div className="mb-2 text-[11px] uppercase tracking-[0.14em] cf-muted">
              Ricerca cliente
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cerca per nome cliente…"
                className="cf-input h-11"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:bg-white/70 dark:hover:bg-white/10"
                >
                  Cerca
                </button>
                {q ? (
                  <Link
                    href={searchResetHref}
                    className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:bg-white/70 dark:hover:bg-white/10 flex items-center justify-center"
                  >
                    Reset
                  </Link>
                ) : null}
              </div>
            </div>
          </form>

          <div className="rounded-[24px] border cf-surface px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] cf-muted">
              Paginazione
            </div>
            <div className="mt-1 text-sm font-medium cf-text">
              Pagina {currentPage} di {totalPages}
            </div>
            <div className="mt-1 text-xs cf-muted">
              {visibleFrom}-{visibleTo} di {total} sessioni
            </div>
          </div>
        </div>
      </div>

      <div className="cf-card overflow-hidden p-0">
        <div className="border-b border-black/5 px-6 py-4 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold cf-text">{total} sessioni</div>
              <div className="mt-1 text-xs cf-muted">
                {status
                  ? `Filtro attivo: ${statusLabel(status)}`
                  : "Tutti gli stati"}
                {q ? ` • Cliente: ${q}` : ""}
              </div>
            </div>

            <div className="rounded-full border cf-surface px-3 py-1.5 text-xs capitalize cf-muted">
              {range === "all"
                ? "Archivio multi-mese"
                : `${rangeLabel(range)} • ${formatMonthLabel(selectedMonth)}`}
            </div>
          </div>
        </div>

        {pageAppointments.length === 0 ? (
          <div className="px-6 py-10 text-sm cf-muted">
            Nessuna sessione per i filtri selezionati.
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {monthGroups.map((group) => (
              <section key={group.key}>
                <div className="border-b border-black/5 bg-neutral-50/90 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold capitalize cf-text">
                      {group.label}
                    </div>
                    <div className="rounded-full border cf-surface px-3 py-1 text-xs cf-muted">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "sessione" : "sessioni"}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-black/5 dark:divide-white/10">
                  {group.items.map((a) => {
                    const paid = !!a.paidAt;

                    return (
                      <div
                        key={a.id}
                        className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="min-w-0 flex-1">
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
                              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-200">
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

                        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                          {a.status === "PENDING" ? (
                            <>
                              <form action={acceptBookingRequest}>
                                <input type="hidden" name="appointmentId" value={a.id} />
                                <button
                                  type="submit"
                                  className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-200"
                                >
                                  Accetta
                                </button>
                              </form>

                              <form action={rejectBookingRequest}>
                                <input type="hidden" name="appointmentId" value={a.id} />
                                <button
                                  type="submit"
                                  className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-500/15 dark:text-rose-200"
                                >
                                  Rifiuta
                                </button>
                              </form>
                            </>
                          ) : (
                            <>
                              <Link
                                href={`/app/booking/edit?id=${a.id}`}
                                className="rounded-xl border cf-surface px-3 py-2 text-sm cf-text hover:border-black dark:hover:border-white"
                              >
                                Modifica
                              </Link>

                              {a.status === "SCHEDULED" ? (
                                <form action={cancelScheduledSession}>
                                  <input type="hidden" name="appointmentId" value={a.id} />
                                  <button
                                    type="submit"
                                    className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-500/15 dark:text-rose-200"
                                  >
                                    Cancella
                                  </button>
                                </form>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="border-t border-black/5 px-6 py-4 dark:border-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm cf-muted">
                Pagina {currentPage} di {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={makeHref({ page: Math.max(1, currentPage - 1) })}
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
                  href={makeHref({ page: Math.min(totalPages, currentPage + 1) })}
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
      </div>
    </div>
  );
}
