"use client";

import * as React from "react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSessionFromDashboard } from "../../../actions/booking";

type Status = "SCHEDULED" | "COMPLETED" | "CANCELED";

type CalItem = {
  id: string;
  startsAt: string | Date;
  endsAt?: string | Date | null;
  status: Status;
  client: { fullName: string; slug: string };
};

export type CalDay = {
  date: string;
  scheduled: number;
  completed: number;
  canceled: number;
  items: CalItem[];
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function startOfGrid(monthStart: Date) {

  const x = new Date(monthStart);
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  return x;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
function fmtDayLabel(d: Date) {
  return d.toLocaleDateString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function Dot({ className }: { className: string }) {
  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} />
  );
}

function CalendarSkeleton() {
  return (
    <div className="w-full">

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-neutral-200/70 dark:bg-white/10 animate-pulse" />
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className={[
              "rounded-2xl border cf-surface",
              "aspect-square p-2",
              "lg:aspect-auto lg:h-[72px] lg:p-2",
              "animate-pulse",
            ].join(" ")}
          >
            <div className="flex h-full flex-col">
              <div className="h-3 w-6 rounded bg-neutral-200/70 dark:bg-white/10" />
              <div className="mt-auto h-4 w-10 rounded-full bg-neutral-200/70 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardCalendar({
  monthStartISO,
  days,
  clients,
  workoutTemplates,
}: {
  monthStartISO: string;
  days: CalDay[];
  clients: { id: string; fullName: string }[];
  workoutTemplates: { id: string; title: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const pendingISORef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const today = useMemo(() => new Date(), []);

  function pushMonth(d: Date) {
    const ms = startOfMonth(d);
    const iso = toISODate(ms);

    if (loading) return;
    if (iso === monthStartISO) return;

    pendingISORef.current = iso;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setLoading(true);
    }, 150);

    const sp = new URLSearchParams(searchParams?.toString());
    sp.set("month", iso);
    router.push(`?${sp.toString()}`);
  }

  const [openCreate, setOpenCreate] = useState(false);

  const [cursor, setCursor] = useState(
    () => new Date(monthStartISO + "T00:00:00")
  );

  useEffect(() => {
    setCursor(new Date(monthStartISO + "T00:00:00"));

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingISORef.current = null;
    setLoading(false);
  }, [monthStartISO]);

  const map = useMemo(() => {
    const m = new Map<string, CalDay>();
    for (const d of days) m.set(d.date, d);
    return m;
  }, [days]);

  const monthLabel = cursor.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  const gridStart = useMemo(() => startOfGrid(startOfMonth(cursor)), [cursor]);

  const grid = useMemo(() => {
    const arr: Date[] = [];
    const x = new Date(gridStart);
    for (let i = 0; i < 42; i++) {
      arr.push(new Date(x));
      x.setDate(x.getDate() + 1);
    }
    return arr;
  }, [gridStart]);

  const [selectedISO, setSelectedISO] = useState(() => {
    const now = new Date();
    const inThisMonth =
      now.getFullYear() === cursor.getFullYear() &&
      now.getMonth() === cursor.getMonth();
    return inThisMonth ? toISODate(now) : toISODate(startOfMonth(cursor));
  });

  useEffect(() => {
    const now = new Date();
    const inThisMonth =
      now.getFullYear() === cursor.getFullYear() &&
      now.getMonth() === cursor.getMonth();

    setSelectedISO(
      inThisMonth ? toISODate(now) : toISODate(startOfMonth(cursor))
    );
  }, [cursor]);

  const selectedDay = map.get(selectedISO) ?? null;
  const selectedDate = useMemo(
    () => new Date(`${selectedISO}T00:00:00`),
    [selectedISO]
  );
  const selectedSessions = selectedDay?.items ?? [];

  const selectedLabel = useMemo(
    () =>
      new Date(`${selectedISO}T00:00:00`).toLocaleDateString("it-IT", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
    [selectedISO]
  );

  useEffect(() => {
    if (!openCreate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenCreate(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCreate]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-[360px_1fr]">

      <div className="cf-card p-4 sm:p-5 overflow-hidden min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between min-w-0">
          <div className="min-w-0">
            <div className="text-sm font-semibold cf-text capitalize truncate">
              {monthLabel}
            </div>
            <div className="text-xs cf-muted truncate">
              Click su un giorno per vedere dettagli
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              disabled={loading}
              onClick={() => pushMonth(addMonths(cursor, -1))}
              className={[
                "h-9 w-9 shrink-0 rounded-2xl border cf-surface cf-text",
                loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90",
              ].join(" ")}
              aria-label="Mese precedente"
            >
              ‹
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => pushMonth(new Date())}
              className={[
                "flex-1 sm:flex-none min-w-0 rounded-2xl border cf-surface px-3 py-2 text-xs cf-text truncate",
                loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90",
              ].join(" ")}
            >
              Oggi
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => pushMonth(addMonths(cursor, 1))}
              className={[
                "h-9 w-9 shrink-0 rounded-2xl border cf-surface cf-text",
                loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90",
              ].join(" ")}
              aria-label="Mese successivo"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-4 w-full max-w-full relative">
          {loading ? (
            <div className="absolute inset-0 z-10 rounded-3xl bg-white/50 dark:bg-black/30 backdrop-blur-sm p-2 sm:p-0">
              <CalendarSkeleton />
            </div>
          ) : null}

          <div className={loading ? "opacity-40 pointer-events-none" : ""}>
            <div className="w-full">
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] cf-faint">
                {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((w) => (
                  <div key={w} className="px-1 truncate">
                    {w}
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
                {grid.map((d) => {
                  const iso = toISODate(d);
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const isToday = sameDay(d, today);
                  const isSelected = iso === selectedISO;

                  const info = map.get(iso);
                  const total =
                    (info?.scheduled ?? 0) +
                    (info?.completed ?? 0) +
                    (info?.canceled ?? 0);

                  const hasAny = total > 0;

                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelectedISO(iso)}
                      className={[
                        "relative w-full rounded-2xl border text-left transition",
                        "cf-surface",
                        inMonth ? "opacity-100" : "opacity-50",
                        isSelected
                          ? "ring-2 ring-black/60 dark:ring-white/60"
                          : "",
                        isToday ? "border-black/40 dark:border-white/30" : "",
                        "hover:opacity-90",
                        "aspect-square p-2",
                        "lg:aspect-auto lg:h-[72px] lg:p-2",
                      ].join(" ")}
                    >
                      <div className="flex h-full flex-col">
                        <div className="flex items-start justify-between">
                          <div className="text-[11px] sm:text-xs font-semibold cf-text leading-none">
                            {d.getDate()}
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-start">
                          {hasAny ? (
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold cf-text">
                              {total}
                            </span>
                          ) : (
                            <span className="text-[10px] cf-faint">—</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs cf-muted">
          <div className="flex items-center gap-2">
            <Dot className="bg-blue-500" /> Pianificate
          </div>
          <div className="flex items-center gap-2">
            <Dot className="bg-emerald-500" /> Completate
          </div>
          <div className="flex items-center gap-2">
            <Dot className="bg-rose-500" /> Cancellate
          </div>
        </div>
      </div>

      <div className="cf-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold cf-text">
              {fmtDayLabel(selectedDate)}
            </div>
            <div className="text-xs cf-muted">
              {selectedSessions.length
                ? `${selectedSessions.length} sessioni`
                : "Nessuna sessione"}
              {selectedDay ? (
                <span className="hidden sm:inline ml-2 opacity-70">
                  • {selectedDay.scheduled} sched • {selectedDay.completed} comp
                  • {selectedDay.canceled} canc
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/app/booking?range=all`}
              className="text-xs cf-faint hover:underline"
            >
              Vai al booking →
            </a>

            <button
              type="button"
              onClick={() => setOpenCreate(true)}
              className="w-full sm:w-auto rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90"
            >
              + Aggiungi sessione
            </button>
          </div>
        </div>

        <div className="mt-4">
          {selectedSessions.length === 0 ? (
            <div className="rounded-3xl border cf-surface p-5 sm:p-6 text-sm cf-muted">
              Nessuna sessione in questa data.
            </div>
          ) : (
            <ul className="space-y-2">
              {selectedSessions.map((it) => {
                const s = new Date(it.startsAt);
                const e = it.endsAt ? new Date(it.endsAt) : null;

                const chip =
                  it.status === "COMPLETED"
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                    : it.status === "CANCELED"
                    ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200"
                    : "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-200";

                const label =
                  it.status === "COMPLETED"
                    ? "Completata"
                    : it.status === "CANCELED"
                    ? "Cancellata"
                    : "Pianificata";

                return (
                  <li key={it.id} className="rounded-3xl border cf-surface p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold cf-text break-words">
                        {fmtTime(s)}
                        {e ? `–${fmtTime(e)}` : ""} • {it.client.fullName}
                      </div>

                      <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${chip}`}
                      >
                        {label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs cf-muted">
                      <a
                        href={`/app/clients/${it.client.slug}?tab=sessions`}
                        className="hover:underline"
                      >
                        Apri cliente →
                      </a>
                      <span className="opacity-30">•</span>
                      <a
                        href={`/app/booking/edit?id=${it.id}`}
                        className="hover:underline"
                      >
                        Modifica sessione →
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {openCreate ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpenCreate(false)}
            aria-label="Chiudi"
          />

          <div className="relative w-full max-w-xl rounded-3xl border cf-surface p-4 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold cf-text">
                  Nuova sessione
                </div>
                <div className="mt-1 text-sm cf-muted">
                  Crea una sessione per{" "}
                  <span className="font-medium cf-text">{selectedLabel}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenCreate(false)}
                className="rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90"
              >
                ✕
              </button>
            </div>

            <QuickCreateSession
              dateISO={selectedISO}
              clients={clients}
              workoutTemplates={workoutTemplates}
              onCreated={() => setOpenCreate(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QuickCreateSession({
  dateISO,
  clients,
  workoutTemplates,
  onCreated,
}: {
  dateISO: string;
  clients: { id: string; fullName: string }[];
  workoutTemplates: { id: string; title: string }[];
  onCreated?: () => void;
}) {
  const router = useRouter();

  const [state, formAction] = useActionState(createSessionFromDashboard, {
    ok: false,
    error: {},
  });

  useEffect(() => {
    if (!state?.ok) return;

    const form = document.getElementById(
      "quick-session-form"
    ) as HTMLFormElement | null;
    form?.reset();

    router.refresh();
    onCreated?.();
  }, [state, onCreated, router]);

  return (
    <form
      id="quick-session-form"
      action={formAction}
      className="mt-5 grid gap-4"
    >
      <input type="hidden" name="date" value={dateISO} />

      <div className="grid gap-3 sm:grid-cols-2">

        <div>
          <label className="text-xs cf-muted">Cliente</label>
          <select
            name="clientId"
            required
            className="mt-1 w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text"
          >
            <option value="">Seleziona…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
          {state?.error?.clientId?.[0] ? (
            <div className="mt-1 text-xs text-rose-500">
              {state.error.clientId[0]}
            </div>
          ) : null}
        </div>

        <div>
          <label className="text-xs cf-muted">Ora</label>
          <input
            type="time"
            name="time"
            required
            className="mt-1 w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text"
          />
          {state?.error?.time?.[0] ? (
            <div className="mt-1 text-xs text-rose-500">
              {state.error.time[0]}
            </div>
          ) : null}
        </div>

        <div>
          <label className="text-xs cf-muted">Durata (min)</label>
          <input
            type="number"
            name="durationMin"
            defaultValue={60}
            min={15}
            step={15}
            required
            className="mt-1 w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text"
          />
        </div>

        <div>
          <label className="text-xs cf-muted">Luogo</label>
          <select
            name="locationType"
            defaultValue="GYM"
            className="mt-1 w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text"
          >
            <option value="GYM">Palestra</option>
            <option value="HOME">Casa</option>
            <option value="OUTDOOR">Outdoor</option>
            <option value="ONLINE">Online</option>
            <option value="OTHER">Altro</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs cf-muted">Prezzo (€)</label>
          <input
            type="text"
            name="price"
            placeholder="es. 45"
            className="mt-1 w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text"
          />
        </div>

        <div className="flex items-end gap-2">
          <input type="checkbox" name="isPaid" id="paid" className="h-4 w-4" />
          <label htmlFor="paid" className="text-sm cf-text">
            Pagata
          </label>
        </div>

        <div>
          <label className="text-xs cf-muted">Metodo</label>
          <select
            name="paymentMethod"
            defaultValue=""
            className="mt-1 w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text"
          >
            <option value="">—</option>
            <option value="Contanti">Contanti</option>
            <option value="Carta">Carta</option>
            <option value="Bonifico">Bonifico</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs cf-muted">Workout (opzionale)</label>
        <select
          name="workoutTemplateId"
          defaultValue=""
          className="mt-1 w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text"
        >
          <option value="">— Nessuno</option>
          {workoutTemplates.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title}
            </option>
          ))}
        </select>

        {state?.error?.workoutTemplateId && (
          <div className="text-xs text-rose-500 mt-1">
            {state.error.workoutTemplateId[0]}
          </div>
        )}
      </div>
      <div>
        <label className="text-xs cf-muted">Note</label>
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-2xl border cf-surface px-3 py-2 text-sm cf-text"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs">
          {state?.ok ? (
            <span className="text-emerald-500">Sessione creata ✔</span>
          ) : state?.error?.form?.[0] ? (
            <span className="text-rose-500">{state.error.form[0]}</span>
          ) : null}
        </div>

        <button
          type="submit"
          className="rounded-2xl border cf-surface px-5 py-2 text-sm font-semibold cf-text hover:opacity-90 transition"
        >
          + Crea sessione
        </button>
      </div>
    </form>
  );
}
