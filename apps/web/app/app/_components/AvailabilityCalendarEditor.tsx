"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, RotateCcw, Trash2 } from "lucide-react";
import { saveTenantAvailabilityCalendar } from "@/actions/availability-calendar";

type Slot = {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
};

type RecurringRule = {
  weekday: number;
  startMin: number;
  endMin: number;
  isActive?: boolean;
};

type DayCell = {
  key: string;
  date: Date;
  dayNumber: number;
  weekdayLabel: string;
  fullLabel: string;
  isToday: boolean;
};

const SLOT_STEP_MINUTES = 60;

function monthLabel(month: string) {
  const [year, mon] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, mon - 1, 1));
}

function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
  }).format(date);
}

function fullDayLabel(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

function formatDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isToday(date: Date) {
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function changeMonth(month: string, delta: number) {
  const [year, mon] = month.split("-").map(Number);
  const d = new Date(year, mon - 1 + delta, 1);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

function getMonthDays(month: string): DayCell[] {
  const [year, mon] = month.split("-").map(Number);
  const end = new Date(year, mon, 0);
  const days: DayCell[] = [];

  for (let day = 1; day <= end.getDate(); day++) {
    const date = new Date(year, mon - 1, day);

    days.push({
      key: formatDayKey(date),
      date,
      dayNumber: day,
      weekdayLabel: weekdayLabel(date),
      fullLabel: fullDayLabel(date),
      isToday: isToday(date),
    });
  }

  return days;
}

function combineDateAndTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

function deriveSlotsForDay(day: DayCell, recurringRules: RecurringRule[]) {
  const rules = recurringRules
    .filter((rule) => (rule.isActive ?? true) && rule.weekday === day.date.getDay())
    .sort((a, b) => a.startMin - b.startMin);

  const slots: Slot[] = [];

  for (const rule of rules) {
    for (
      let slotStart = rule.startMin;
      slotStart < rule.endMin;
      slotStart += SLOT_STEP_MINUTES
    ) {
      const slotEnd = Math.min(slotStart + SLOT_STEP_MINUTES, rule.endMin);

      if (slotEnd <= slotStart) {
        continue;
      }

      slots.push({
        date: day.key,
        startTime: minutesToTime(slotStart),
        endTime: minutesToTime(slotEnd),
        isAvailable: true,
      });
    }
  }

  return slots;
}

function sortSlots(slots: Slot[]) {
  return [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function getActiveSlotsCount(slots: Slot[]) {
  return slots.filter((slot) => slot.isAvailable !== false).length;
}

function getDisabledSlotsCount(slots: Slot[]) {
  return slots.filter((slot) => slot.isAvailable === false).length;
}

export default function AvailabilityCalendarEditor({
  month,
  initialSlots,
  recurringRules,
}: {
  month: string;
  initialSlots: Array<{
    id?: string;
    date: string;
    startAt: string;
    endAt: string;
    isAvailable?: boolean;
  }>;
  recurringRules: RecurringRule[];
}) {
  const [overrideSlots, setOverrideSlots] = React.useState<Slot[]>(
    initialSlots.map((slot) => ({
      id: slot.id,
      date: formatDayKey(new Date(slot.date)),
      startTime: new Date(slot.startAt).toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      endTime: new Date(slot.endAt).toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      isAvailable: slot.isAvailable ?? true,
    }))
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const days = React.useMemo(() => getMonthDays(month), [month]);
  const firstActiveDay = React.useMemo(() => {
    return (
      days.find((day) => {
        const explicit = overrideSlots.filter((slot) => slot.date === day.key);
        if (explicit.length > 0) return true;
        return deriveSlotsForDay(day, recurringRules).length > 0;
      })?.key ?? days[0]?.key ?? null
    );
  }, [days, overrideSlots, recurringRules]);
  const [selectedDayKey, setSelectedDayKey] = React.useState<string | null>(firstActiveDay);

  React.useEffect(() => {
    setSelectedDayKey((current) => {
      if (current && days.some((day) => day.key === current)) {
        return current;
      }

      return firstActiveDay;
    });
  }, [days, firstActiveDay]);

  const selectedDay = days.find((day) => day.key === selectedDayKey) ?? null;

  function getEffectiveSlots(day: DayCell) {
    const explicit = sortSlots(overrideSlots.filter((slot) => slot.date === day.key));

    if (explicit.length > 0) {
      return {
        slots: explicit,
        hasOverride: true,
      };
    }

    return {
      slots: deriveSlotsForDay(day, recurringRules),
      hasOverride: false,
    };
  }

  function replaceDaySlots(dayKey: string, nextSlots: Slot[]) {
    setOverrideSlots((prev) => [
      ...prev.filter((slot) => slot.date !== dayKey),
      ...sortSlots(
        nextSlots.map((slot) => ({
          ...slot,
          date: dayKey,
        }))
      ),
    ]);
  }

  function updateSelectedDaySlots(updater: (slots: Slot[]) => Slot[]) {
    if (!selectedDay) {
      return;
    }

    const current = getEffectiveSlots(selectedDay).slots.map((slot) => ({ ...slot }));
    replaceDaySlots(selectedDay.key, updater(current));
  }

  async function onSave() {
    try {
      setIsSaving(true);
      setSaved(false);
      setError(null);

      await saveTenantAvailabilityCalendar({
        month,
        slots: overrideSlots.map((slot) => ({
          date: slot.date,
          startAt: combineDateAndTime(slot.date, slot.startTime),
          endAt: combineDateAndTime(slot.date, slot.endTime),
          isAvailable: slot.isAvailable ?? true,
        })),
      });

      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      setError("Non è stato possibile salvare le eccezioni del calendario.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedDayState = selectedDay ? getEffectiveSlots(selectedDay) : null;
  const overrideDaysCount = React.useMemo(() => {
    return new Set(overrideSlots.map((slot) => slot.date)).size;
  }, [overrideSlots]);
  const routineDaysCount = React.useMemo(() => {
    return days.filter((day) => !getEffectiveSlots(day).hasOverride && getEffectiveSlots(day).slots.length > 0).length;
  }, [days, overrideSlots, recurringRules]);
  const totalVisibleSlots = React.useMemo(() => {
    return days.reduce((total, day) => total + getActiveSlotsCount(getEffectiveSlots(day).slots), 0);
  }, [days, overrideSlots, recurringRules]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[36px] border border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.88))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.84))]">
        <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/15" />
        <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/15" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
              Override Studio
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] cf-text">
              {monthLabel(month)}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 cf-muted">
              Qui gestisci le eccezioni giornaliere. Seleziona un giorno per
              disattivare una fascia oraria, ritoccare gli orari ereditati dalla
              routine o creare una disponibilita personalizzata solo per quella data.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-3 dark:border-emerald-400/15 dark:bg-emerald-400/10">
                <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-700/70 dark:text-emerald-200/60">
                  Giorni standard
                </div>
                <div className="mt-1 text-2xl font-semibold text-emerald-950 dark:text-emerald-100">
                  {routineDaysCount}
                </div>
              </div>
              <div className="rounded-2xl border border-sky-200/60 bg-sky-50/80 px-4 py-3 dark:border-sky-400/15 dark:bg-sky-400/10">
                <div className="text-[11px] uppercase tracking-[0.18em] text-sky-700/70 dark:text-sky-200/60">
                  Giorni con override
                </div>
                <div className="mt-1 text-2xl font-semibold text-sky-950 dark:text-sky-100">
                  {overrideDaysCount}
                </div>
              </div>
              <div className="rounded-2xl border border-violet-200/60 bg-violet-50/80 px-4 py-3 dark:border-violet-400/15 dark:bg-violet-400/10">
                <div className="text-[11px] uppercase tracking-[0.18em] text-violet-700/70 dark:text-violet-200/60">
                  Slot visibili
                </div>
                <div className="mt-1 text-2xl font-semibold text-violet-950 dark:text-violet-100">
                  {totalVisibleSlots}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/settings/availability?month=${changeMonth(month, -1)}`}
              className="inline-flex items-center gap-2 rounded-2xl border cf-surface px-4 py-2 text-sm cf-text transition hover:-translate-y-[1px]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Mese prec.</span>
            </Link>

            <Link
              href={`/app/settings/availability?month=${changeMonth(month, 1)}`}
              className="inline-flex items-center gap-2 rounded-2xl border cf-surface px-4 py-2 text-sm cf-text transition hover:-translate-y-[1px]"
            >
              <span>Mese succ.</span>
              <ChevronRight className="h-4 w-4" />
            </Link>

            {saved ? (
              <div className="rounded-full border cf-surface px-3 py-1 text-xs cf-muted">
                Salvato
              </div>
            ) : null}

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95 disabled:opacity-60 dark:bg-white dark:text-neutral-900"
            >
              {isSaving ? "Salvataggio..." : "Salva eccezioni"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[32px] border border-black/5 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.045]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="relative flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] cf-muted">
                Calendario override
              </p>
              <h3 className="mt-2 text-xl font-semibold cf-text">Seleziona un giorno</h3>
            </div>
            <p className="text-sm cf-muted">
              I giorni con override salvato hanno priorita sulla routine settimanale.
            </p>
          </div>

          <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {days.map((day) => {
                const state = getEffectiveSlots(day);
                const activeCount = getActiveSlotsCount(state.slots);
                const disabledCount = getDisabledSlotsCount(state.slots);
                const isSelected = day.key === selectedDayKey;
                const isEmpty = state.slots.length === 0;

                return (
                  <button
                    key={day.key}
                  type="button"
                  onClick={() => setSelectedDayKey(day.key)}
                  className={[
                    "group relative overflow-hidden rounded-[28px] border p-5 text-left transition-all duration-200",
                    isSelected
                      ? "border-black/20 bg-black text-white shadow-[0_20px_60px_rgba(15,23,42,0.24)] dark:border-white/15 dark:bg-white/10"
                      : "border-black/5 bg-white/80 text-neutral-950 hover:-translate-y-[2px] hover:border-black/10 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.035] dark:text-white",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "pointer-events-none absolute inset-0 opacity-0 transition duration-300",
                      isSelected
                        ? "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_38%)] opacity-100"
                        : "bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_36%)] group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_36%)]",
                    ].join(" ")}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={isSelected ? "text-xs uppercase tracking-[0.14em] text-white/60" : "text-xs uppercase tracking-[0.14em] text-neutral-400 dark:text-white/45"}>
                        {day.weekdayLabel}
                      </div>
                      <div className="mt-2 text-2xl font-semibold">{day.dayNumber}</div>
                    </div>

                    {day.isToday ? (
                      <div
                        className={[
                          "rounded-full px-3 py-1 text-[11px]",
                          isSelected ? "border border-white/10 bg-white/10 text-white/80" : "border cf-surface cf-muted",
                        ].join(" ")}
                      >
                        Oggi
                      </div>
                    ) : null}
                  </div>

                  <p className={["mt-3 text-sm", isSelected ? "text-white/75" : "text-neutral-500 dark:text-white/55"].join(" ")}>
                    {state.hasOverride
                      ? "Override manuale attivo"
                      : isEmpty
                        ? "Nessuna disponibilita"
                        : "Segue routine settimanale"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px]",
                        isSelected ? "border border-emerald-300/30 bg-emerald-400/10 text-emerald-100" : "border cf-surface text-emerald-700 dark:text-emerald-300",
                      ].join(" ")}
                    >
                      Attivi: {activeCount}
                    </span>
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px]",
                        isSelected ? "border border-amber-300/30 bg-amber-400/10 text-amber-100" : "border cf-surface text-amber-700 dark:text-amber-300",
                      ].join(" ")}
                    >
                      Disattivati: {disabledCount}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className={[
                        "h-2 w-2 rounded-full",
                        state.hasOverride
                          ? "bg-sky-400"
                          : activeCount > 0
                            ? "bg-emerald-400"
                            : "bg-neutral-300 dark:bg-white/20",
                      ].join(" ")}
                    />
                    <span className={["text-xs", isSelected ? "text-white/65" : "text-neutral-500 dark:text-white/45"].join(" ")}>
                      {state.hasOverride
                        ? "Priorita a eccezione manuale"
                        : activeCount > 0
                          ? "Disponibilita automatica attiva"
                          : "Giorno non prenotabile"}
                    </span>
                  </div>
                </button>
                );
              })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1.5 text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Routine attiva
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1.5 text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              Override manuale
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1.5 text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
              <span className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-white/20" />
              Nessuna fascia
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-28 xl:self-start">
          <div className="relative overflow-hidden rounded-[32px] border border-black/5 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.045]">
          <div className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/12" />
          {selectedDay && selectedDayState ? (
            <>
              <div className="relative flex flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] cf-muted">
                      Giorno selezionato
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em] cf-text">
                      {selectedDay.fullLabel}
                    </h3>
                  </div>

                  {selectedDayState.hasOverride ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOverrideSlots((prev) =>
                          prev.filter((slot) => slot.date !== selectedDay.key)
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-2xl border cf-surface px-3 py-2 text-sm cf-text transition hover:-translate-y-[1px]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Ripristina routine</span>
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-4 dark:border-emerald-400/15 dark:bg-emerald-400/10">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-700/70 dark:text-emerald-200/60">
                      Slot attivi
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-emerald-950 dark:text-emerald-100">
                      {getActiveSlotsCount(selectedDayState.slots)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 p-4 dark:border-amber-400/15 dark:bg-amber-400/10">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-amber-700/70 dark:text-amber-200/60">
                      Slot off
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-amber-950 dark:text-amber-100">
                      {getDisabledSlotsCount(selectedDayState.slots)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-sky-200/60 bg-sky-50/80 p-4 dark:border-sky-400/15 dark:bg-sky-400/10">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-sky-700/70 dark:text-sky-200/60">
                      Modalita
                    </div>
                    <div className="mt-2 text-base font-semibold text-sky-950 dark:text-sky-100">
                      {selectedDayState.hasOverride ? "Override" : "Routine"}
                    </div>
                  </div>
                </div>

                <p className="text-sm leading-7 cf-muted">
                  {selectedDayState.hasOverride
                    ? "Stai modificando un override manuale salvato per questo giorno."
                    : "Questi orari arrivano dalla routine settimanale. Appena modifichi qualcosa, il giorno passa in override manuale."}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {selectedDayState.slots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed cf-surface p-4 text-sm cf-muted">
                    Nessuna fascia presente per questo giorno.
                  </div>
                ) : (
                  selectedDayState.slots.map((slot, index) => (
                    <div
                      key={`${selectedDay.key}-${index}`}
                      className={[
                        "rounded-[26px] border p-4 transition",
                        slot.isAvailable === false
                          ? "border-amber-200/70 bg-amber-50/70 dark:border-amber-400/15 dark:bg-amber-400/10"
                          : "border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-400/15 dark:bg-emerald-400/10",
                      ].join(" ")}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-white/45">
                            Fascia {index + 1}
                          </div>
                          <div className="mt-1 text-lg font-semibold cf-text">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </div>
                        <div
                          className={[
                            "rounded-full px-3 py-1 text-xs font-medium",
                            slot.isAvailable === false
                              ? "border border-amber-300/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "border border-emerald-300/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                          ].join(" ")}
                        >
                          {slot.isAvailable === false ? "Disattivata" : "Prenotabile"}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                        <div>
                          <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] cf-muted">
                            Inizio
                          </label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(event) =>
                              updateSelectedDaySlots((current) =>
                                current.map((item, idx) =>
                                  idx === index
                                    ? { ...item, startTime: event.target.value }
                                    : item
                                )
                              )
                            }
                            className="w-full rounded-2xl border cf-surface bg-transparent px-4 py-3 text-sm cf-text outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] cf-muted">
                            Fine
                          </label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(event) =>
                              updateSelectedDaySlots((current) =>
                                current.map((item, idx) =>
                                  idx === index
                                    ? { ...item, endTime: event.target.value }
                                    : item
                                )
                              )
                            }
                            className="w-full rounded-2xl border cf-surface bg-transparent px-4 py-3 text-sm cf-text outline-none"
                          />
                        </div>

                        <div className="flex items-end justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedDaySlots((current) =>
                                current.map((item, idx) =>
                                  idx === index
                                    ? {
                                        ...item,
                                        isAvailable: !(item.isAvailable ?? true),
                                      }
                                    : item
                                )
                              )
                            }
                            className={[
                              "rounded-2xl px-3 py-3 text-sm font-medium transition",
                              slot.isAvailable === false
                                ? "border border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                : "border border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                            ].join(" ")}
                          >
                            {slot.isAvailable === false ? "Disattivata" : "Attiva"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedDaySlots((current) =>
                                current.filter((_, idx) => idx !== index)
                              )
                            }
                            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border cf-surface transition hover:-translate-y-[1px]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  updateSelectedDaySlots((current) => [
                    ...current,
                    {
                      date: selectedDay.key,
                      startTime: "09:00",
                      endTime: "10:00",
                      isAvailable: true,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 rounded-2xl border cf-surface px-4 py-2.5 text-sm cf-text transition hover:-translate-y-[1px]"
              >
                <Plus className="h-4 w-4" />
                <span>Aggiungi fascia oraria</span>
              </button>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed cf-surface p-5 text-sm cf-muted">
              Seleziona un giorno dal calendario per modificarne le disponibilita.
            </div>
          )}
          </div>
        </div>
      </section>
    </div>
  );
}
