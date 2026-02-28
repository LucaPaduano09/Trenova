"use client";

import * as React from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { createSessionFromDashboard } from "../../../actions/booking";

type Status = "SCHEDULED" | "COMPLETED" | "CANCELED";

type CalItem = {
  id: string;
  startsAt: string | Date;
  endsAt?: string | Date | null;
  status: Status;
  client: { fullName: string; slug: string };
};

type CalDay = {
  date: string; // YYYY-MM-DD
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
  // Monday grid
  const x = new Date(monthStart);
  const day = x.getDay(); // 0=Sun
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

export default function DashboardCalendar({
  monthStartISO,
  days,
  clients,
  workoutTemplates,
}: {
  monthStartISO?: string;
  days: CalDay[];
  clients: { id: string; fullName: string }[];
  workoutTemplates: { id: string; title: string }[];
}) {
  const today = useMemo(() => new Date(), []);

  const [openCreate, setOpenCreate] = useState(false);

  const [cursor, setCursor] = useState(() => {
    if (monthStartISO) return new Date(monthStartISO + "T00:00:00");
    return startOfMonth(new Date());
  });

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
    // quando cambi mese seleziono il 1° del mese
    setSelectedISO(toISODate(startOfMonth(cursor)));
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
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      {/* ===================== CALENDAR (LEFT) ===================== */}
      <div className="cf-card p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold cf-text capitalize">
              {monthLabel}
            </div>
            <div className="text-xs cf-muted">
              Click su un giorno per vedere dettagli
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCursor((c) => addMonths(c, -1))}
              className="h-9 w-9 rounded-2xl border cf-surface cf-text hover:opacity-90"
              aria-label="Mese precedente"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={() => setCursor(startOfMonth(new Date()))}
              className="rounded-2xl border cf-surface px-3 py-2 text-xs cf-text hover:opacity-90"
            >
              Oggi
            </button>

            <button
              type="button"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="h-9 w-9 rounded-2xl border cf-surface cf-text hover:opacity-90"
              aria-label="Mese successivo"
            >
              ›
            </button>
          </div>
        </div>

        {/* Week header */}
        <div className="mt-4 grid grid-cols-7 gap-2 text-[11px] cf-faint">
          {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((w) => (
            <div key={w} className="px-1">
              {w}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-2 grid grid-cols-7 gap-2">
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
                  "relative rounded-2xl border px-2 py-2 text-left transition",
                  "cf-surface",
                  inMonth ? "opacity-100" : "opacity-50",
                  isSelected ? "ring-2 ring-black/60 dark:ring-white/60" : "",
                  isToday ? "border-black/40 dark:border-white/30" : "",
                  "hover:opacity-90",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold cf-text">
                    {d.getDate()}
                  </div>

                  {hasAny ? (
                    <div className="flex items-center gap-1">
                      {info?.scheduled ? <Dot className="bg-blue-500" /> : null}
                      {info?.completed ? (
                        <Dot className="bg-emerald-500" />
                      ) : null}
                      {info?.canceled ? <Dot className="bg-rose-500" /> : null}
                    </div>
                  ) : null}
                </div>

                {hasAny ? (
                  <div className="mt-2 text-[11px] cf-faint">
                    {info?.scheduled ? <span>{info.scheduled} S</span> : null}
                    {info?.completed ? (
                      <span className="ml-2">{info.completed} C</span>
                    ) : null}
                    {info?.canceled ? (
                      <span className="ml-2">{info.canceled} X</span>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] cf-faint">—</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
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

      {/* ===================== DETAILS (RIGHT) ===================== */}
      <div className="cf-card p-4">
        {/* Top row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold cf-text">
              {fmtDayLabel(selectedDate)}
            </div>
            <div className="text-xs cf-muted">
              {selectedSessions.length
                ? `${selectedSessions.length} sessioni`
                : "Nessuna sessione"}
              {selectedDay ? (
                <span className="ml-2 opacity-70">
                  • {selectedDay.scheduled} sched • {selectedDay.completed} comp
                  • {selectedDay.canceled} canc
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/app/booking?range=all`}
              className="text-xs cf-faint hover:underline"
            >
              Vai al booking →
            </a>

            <button
              type="button"
              onClick={() => setOpenCreate(true)}
              className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90"
            >
              + Aggiungi sessione
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-4">
          {selectedSessions.length === 0 ? (
            <div className="rounded-3xl border cf-surface p-6 text-sm cf-muted">
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold cf-text">
                        {fmtTime(s)}
                        {e ? `–${fmtTime(e)}` : ""} • {it.client.fullName}
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${chip}`}
                      >
                        {label}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs cf-muted">
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

      {/* ===================== MODAL CREATE ===================== */}
      {openCreate ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpenCreate(false)}
            aria-label="Chiudi"
          />

          {/* Modal */}
          <div className="relative w-full max-w-xl rounded-3xl border cf-surface p-6 shadow-2xl">
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

/* ===================== QUICK CREATE FORM ===================== */

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
    onCreated?.();
  }, [state, onCreated]);

  return (
    <form
      id="quick-session-form"
      action={formAction}
      className="mt-5 grid gap-4"
    >
      <input type="hidden" name="date" value={dateISO} />

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Cliente */}
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

        {/* Ora */}
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

        {/* Durata */}
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

        {/* Location */}
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
