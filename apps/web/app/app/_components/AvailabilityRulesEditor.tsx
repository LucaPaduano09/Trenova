"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveTenantAvailability } from "@/actions/availability";

type Rule = {
  id?: string;
  weekday: number;
  startMin: number;
  endMin: number;
  isActive?: boolean;
};

const WEEKDAYS = [
  { value: 1, label: "Lunedi" },
  { value: 2, label: "Martedi" },
  { value: 3, label: "Mercoledi" },
  { value: 4, label: "Giovedi" },
  { value: 5, label: "Venerdi" },
  { value: 6, label: "Sabato" },
  { value: 0, label: "Domenica" },
] as const;

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function minutesToCompactHour(minutes: number) {
  return String(Math.floor(minutes / 60)).padStart(2, "0");
}

function timeToMinutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

export default function AvailabilityRulesEditor({
  initialRules,
}: {
  initialRules: Rule[];
}) {
  const [rules, setRules] = React.useState<Rule[]>(initialRules);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function addRule(weekday: number) {
    setRules((prev) => [
      ...prev,
      {
        weekday,
        startMin: 9 * 60,
        endMin: 18 * 60,
        isActive: true,
      },
    ]);
  }

  function updateRule(index: number, next: Partial<Rule>) {
    setRules((prev) => prev.map((rule, idx) => (idx === index ? { ...rule, ...next } : rule)));
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function onSave() {
    try {
      setIsSaving(true);
      setSaved(false);
      setError(null);

      await saveTenantAvailability({
        rules: rules.map((rule) => ({
          weekday: rule.weekday,
          startMin: rule.startMin,
          endMin: rule.endMin,
          isActive: rule.isActive ?? true,
        })),
      });

      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      setError("Non siamo riusciti a salvare la disponibilita ricorrente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="cf-card cf-hairline p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold cf-text">Routine settimanale</h2>
            <p className="mt-1 max-w-2xl text-sm cf-muted">
              Imposta le tue finestre ricorrenti. Queste generano in automatico gli
              orari prenotabili per i clienti, mentre il calendario sotto ti serve
              per fare eccezioni su giorni specifici.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
              {isSaving ? "Salvataggio..." : "Salva routine"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {WEEKDAYS.map((weekday) => {
          const dayRules = rules
            .map((rule, index) => ({ rule, index }))
            .filter(({ rule }) => rule.weekday === weekday.value);

          return (
            <div key={weekday.value} className="cf-card space-y-4 rounded-[28px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] cf-muted">
                    Ricorrente
                  </div>
                  <div className="mt-2 text-2xl font-semibold cf-text">
                    {weekday.label}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => addRule(weekday.value)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border cf-surface transition hover:-translate-y-[1px]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {dayRules.length === 0 ? (
                <div className="rounded-2xl border border-dashed cf-surface p-4 text-sm cf-muted">
                  Nessuna fascia attiva.
                </div>
              ) : (
                <div className="space-y-3">
                  {dayRules.map(({ rule, index }) => (
                    <div key={`${weekday.value}-${index}`} className="rounded-2xl border cf-surface p-4">
                      <div className="grid gap-3 min-[520px]:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] cf-muted">
                            Inizio
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              value={minutesToTime(rule.startMin)}
                              onChange={(event) =>
                                updateRule(index, {
                                  startMin: timeToMinutes(event.target.value),
                                })
                              }
                              className="peer h-[62px] w-full min-w-0 rounded-2xl border cf-surface bg-transparent px-4 pr-10 text-[13px] font-medium tracking-[0.04em] text-transparent caret-transparent outline-none [color-scheme:dark]"
                            />
                            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[28px] font-semibold tracking-[0.08em] [font-variant-numeric:tabular-nums] cf-text">
                              {minutesToCompactHour(rule.startMin)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] cf-muted">
                            Fine
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              value={minutesToTime(rule.endMin)}
                              onChange={(event) =>
                                updateRule(index, {
                                  endMin: timeToMinutes(event.target.value),
                                })
                              }
                              className="peer h-[62px] w-full min-w-0 rounded-2xl border cf-surface bg-transparent px-4 pr-10 text-[13px] font-medium tracking-[0.04em] text-transparent caret-transparent outline-none [color-scheme:dark]"
                            />
                            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[28px] font-semibold tracking-[0.08em] [font-variant-numeric:tabular-nums] cf-text">
                              {minutesToCompactHour(rule.endMin)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeRule(index)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border cf-surface transition hover:-translate-y-[1px]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
