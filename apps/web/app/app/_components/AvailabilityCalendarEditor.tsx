"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { saveTenantAvailabilityCalendar } from "@/actions/availability-calendar";

type Slot = {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
};

type DayCell = {
  key: string;
  date: Date;
  dayNumber: number;
  weekdayLabel: string;
  slots: Slot[];
  isToday: boolean;
};

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

function getMonthDays(month: string, slots: Slot[]): DayCell[] {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 0);

  const days: DayCell[] = [];

  for (let day = 1; day <= end.getDate(); day++) {
    const date = new Date(year, mon - 1, day);
    const dayKey = date.toISOString().slice(0, 10);

    days.push({
      key: dayKey,
      date,
      dayNumber: day,
      weekdayLabel: weekdayLabel(date),
      isToday: isToday(date),
      slots: slots
        .filter((slot) => slot.date === dayKey)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    });
  }

  return days;
}

function combineDateAndTime(date: string, time: string) {

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  const d = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return d.toISOString();
}

export default function AvailabilityCalendarEditor({
  month,
  initialSlots,
}: {
  month: string;
  initialSlots: Array<{
    id?: string;
    date: string;
    startAt: string;
    endAt: string;
    isAvailable?: boolean;
  }>;
}) {
  const [slots, setSlots] = React.useState<Slot[]>(
    initialSlots.map((slot) => ({
      id: slot.id,
      date: slot.date,
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

  const days = React.useMemo(() => getMonthDays(month, slots), [month, slots]);

  function addSlot(dateKey: string) {
    setSlots((prev) => [
      ...prev,
      {
        date: dateKey,
        startTime: "09:00",
        endTime: "10:00",
        isAvailable: true,
      },
    ]);
  }

  function updateSlot(index: number, next: Partial<Slot>) {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, ...next } : slot))
    );
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSave() {
    try {
      setIsSaving(true);
      setSaved(false);
      setError(null);

      await saveTenantAvailabilityCalendar({
        month,
        slots: slots.map((slot) => ({
          date: slot.date,
          startAt: combineDateAndTime(slot.date, slot.startTime),
          endAt: combineDateAndTime(slot.date, slot.endTime),
          isAvailable: slot.isAvailable ?? true,
        })),
      });

      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      setError("Non è stato possibile salvare la disponibilità.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="cf-card cf-hairline p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold cf-text">{monthLabel(month)}</h2>
            <p className="mt-1 text-sm cf-muted">
              Imposta gli slot in cui vuoi ricevere richieste di prenotazione.
            </p>
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

            {saved && (
              <div className="rounded-full border cf-surface px-3 py-1 text-xs cf-muted">
                Salvato
              </div>
            )}

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95 disabled:opacity-60 dark:bg-white dark:text-neutral-900"
            >
              {isSaving ? "Salvataggio..." : "Salva calendario"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => (
          <div
            key={day.key}
            className={[
              "rounded-[28px] border p-5",
              day.isToday ? "cf-card ring-1 ring-white/10" : "cf-card",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] cf-muted">
                  {day.weekdayLabel}
                </div>

                <div className="mt-2 text-2xl font-semibold cf-text">
                  {day.dayNumber}
                </div>
              </div>

              {day.isToday && (
                <div className="rounded-full border cf-surface px-3 py-1 text-[11px] cf-muted">
                  Oggi
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => addSlot(day.key)}
                className="inline-flex items-center gap-2 rounded-2xl border cf-surface px-3 py-2 text-sm cf-text transition hover:-translate-y-[1px]"
              >
                <Plus className="h-4 w-4" />
                <span>Aggiungi slot</span>
              </button>
            </div>

            {day.slots.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed cf-surface p-4 text-sm cf-muted">
                Nessuno slot impostato.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {slots.map((slot, index) => {
                  if (slot.date !== day.key) return null;

                  return (
                    <div
                      key={`${day.key}-${index}`}
                      className="rounded-2xl border cf-surface p-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] cf-muted">
                            Inizio
                          </label>

                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              updateSlot(index, {
                                startTime: e.target.value,
                              })
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
                            onChange={(e) =>
                              updateSlot(index, {
                                endTime: e.target.value,
                              })
                            }
                            className="w-full rounded-2xl border cf-surface bg-transparent px-4 py-3 text-sm cf-text outline-none"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeSlot(index)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border cf-surface transition hover:-translate-y-[1px]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}