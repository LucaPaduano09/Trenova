"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type SessionCalendarSlot = {
  key: string;
  startsAt: Date;
  endsAt: Date;
  dayKey: string;
  label: string;
  isPast: boolean;
  isBusy: boolean;
  isAvailable: boolean;
};

type SessionsViewProps = {
  month: string;
  slots: SessionCalendarSlot[];
};

type CalendarDay = {
  dayKey: string;
  date: Date;
  dayNumber: number;
  weekdayLabel: string;
  fullLabel: string;
  isToday: boolean;
  slots: SessionCalendarSlot[];
};

function formatMonthLabel(month: string) {
  const [year, mon] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, mon - 1, 1));
}

function formatWeekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
  }).format(date);
}

function formatFullDayLabel(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
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

function buildMonthDays(month: string, slots: SessionCalendarSlot[]) {
  const [year, mon] = month.split("-").map(Number);
  const monthStart = new Date(year, mon - 1, 1);
  const monthEnd = new Date(year, mon, 0);

  const result: CalendarDay[] = [];

  for (let day = 1; day <= monthEnd.getDate(); day++) {
    const date = new Date(year, mon - 1, day);
    const dayKey = date.toISOString().slice(0, 10);

    result.push({
      dayKey,
      date,
      dayNumber: day,
      weekdayLabel: formatWeekdayLabel(date),
      fullLabel: formatFullDayLabel(date),
      isToday: isToday(date),
      slots: slots
        .filter((slot) => slot.dayKey === dayKey)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    });
  }

  return result;
}

export default function SessionsView({ month, slots }: SessionsViewProps) {
  const days = React.useMemo(() => buildMonthDays(month, slots), [month, slots]);

  const firstOpenDay =
    days.find((day) => day.slots.length > 0)?.dayKey ?? days[0]?.dayKey ?? null;

  const [openDayKey, setOpenDayKey] = React.useState<string | null>(firstOpenDay);

  const availableCount = slots.filter((slot) => slot.isAvailable).length;
  const busyCount = slots.filter((slot) => slot.isBusy).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Prenotazione sessioni</span>
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Disponibilità {formatMonthLabel(month)}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              Consulta la disponibilità del tuo coach per il mese corrente e
              scegli uno slot libero per inviare una richiesta di prenotazione.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Slot disponibili"
              value={String(availableCount)}
            />
            <MetricCard
              icon={<Lock className="h-4 w-4" />}
              label="Slot occupati"
              value={String(busyCount)}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href={`/c/sessions?month=${changeMonth(month, -1)}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Mese prec.</span>
          </Link>

          <Link
            href={`/c/sessions?month=${changeMonth(month, 1)}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]"
          >
            <span>Mese succ.</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="space-y-4">
        {days.map((day) => {
          const isOpen = openDayKey === day.dayKey;
          const freeSlots = day.slots.filter((slot) => slot.isAvailable).length;
          const busySlots = day.slots.filter((slot) => slot.isBusy).length;

          return (
            <DayAccordionCard
              key={day.dayKey}
              day={day}
              isOpen={isOpen}
              freeSlots={freeSlots}
              busySlots={busySlots}
              onToggle={() => {
                setOpenDayKey((prev) => (prev === day.dayKey ? null : day.dayKey));
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayAccordionCard({
  day,
  isOpen,
  freeSlots,
  busySlots,
  onToggle,
}: {
  day: CalendarDay;
  isOpen: boolean;
  freeSlots: number;
  busySlots: number;
  onToggle: () => void;
}) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    if (!contentRef.current) return;
    setHeight(isOpen ? contentRef.current.scrollHeight : 0);
  }, [isOpen, day.slots.length]);

  return (
    <section
      className={[
        "rounded-[28px] border backdrop-blur-xl transition-all duration-300",
        isOpen
          ? "border-white/14 bg-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
          : "border-white/10 bg-white/[0.04]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-white/40">
            {day.weekdayLabel}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-2xl font-semibold text-white">{day.dayNumber}</div>
            {day.isToday ? (
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-white/70">
                Oggi
              </div>
            ) : null}
          </div>

          <p className="mt-2 text-sm text-white/55">{day.fullLabel}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65">
              Liberi: {freeSlots}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65">
              Occupati: {busySlots}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={[
              "hidden rounded-full border px-3 py-1 text-xs transition sm:block",
              isOpen
                ? "border-white/20 bg-white/[0.08] text-white"
                : "border-white/10 bg-white/[0.03] text-white/60",
            ].join(" ")}
          >
            {isOpen ? "Aperto" : "Apri"}
          </div>

          <div
            className={[
              "grid h-10 w-10 place-items-center rounded-full border transition-all duration-300",
              isOpen
                ? "border-white/20 bg-white/[0.08]"
                : "border-white/10 bg-white/[0.03]",
            ].join(" ")}
          >
            <ChevronDown
              className={[
                "h-4 w-4 text-white/70 transition-transform duration-300",
                isOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </div>
        </div>
      </button>

      <div
        style={{ maxHeight: `${height}px` }}
        className="overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <div
          ref={contentRef}
          className="border-t border-white/10 px-5 pb-5 pt-4"
        >
          {day.slots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/40">
              Nessuna disponibilità impostata.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {day.slots.map((slot, index) => (
                <div
                  key={slot.key}
                  className={[
                    "transition-all duration-500 ease-out",
                    isOpen
                      ? "translate-y-0 opacity-100"
                      : "translate-y-2 opacity-0",
                  ].join(" ")}
                  style={{
                    transitionDelay: isOpen ? `${index * 35}ms` : "0ms",
                  }}
                >
                  <SlotCard slot={slot} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SlotCard({ slot }: { slot: SessionCalendarSlot }) {
  const state = slot.isPast
    ? "past"
    : slot.isBusy
    ? "busy"
    : slot.isAvailable
    ? "available"
    : "default";

  const classes =
    state === "available"
      ? "border-white/12 bg-white/[0.05] text-white hover:-translate-y-[1px] hover:bg-white/[0.08]"
      : state === "busy"
      ? "border-red-400/15 bg-red-400/10 text-red-200 opacity-90"
      : state === "past"
      ? "border-white/8 bg-white/[0.02] text-white/35"
      : "border-white/10 bg-white/[0.03] text-white/55";

  const label =
    state === "available"
      ? "Disponibile"
      : state === "busy"
      ? "Occupato"
      : state === "past"
      ? "Passato"
      : "Non disponibile";

  return (
    <button
      type="button"
      disabled={!slot.isAvailable}
      className={[
        "w-full rounded-2xl border p-4 text-left transition-all duration-200",
        slot.isAvailable ? "cursor-pointer" : "cursor-not-allowed",
        classes,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] opacity-70">
            <Clock3 className="h-3.5 w-3.5" />
            <span>Slot</span>
          </div>

          <div className="mt-2 text-base font-semibold">{slot.label}</div>
        </div>

        <div
          className={[
            "rounded-full px-3 py-1 text-[11px] font-medium",
            state === "available"
              ? "bg-white/10 text-white"
              : state === "busy"
              ? "bg-red-500/10 text-red-200"
              : "bg-white/5 text-white/50",
          ].join(" ")}
        >
          {label}
        </div>
      </div>
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}