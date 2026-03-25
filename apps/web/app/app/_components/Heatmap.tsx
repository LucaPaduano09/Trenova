"use client";

import { useMemo, useRef, useState } from "react";

type Day = { date: string; count: number };

function monthLabel(d: Date) {
  return d.toLocaleDateString("it-IT", { month: "short" });
}
function parseISODate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function intensityClass(count: number) {
  if (count <= 0) return "bg-neutral-200/60 dark:bg-white/5";
  if (count === 1) return "bg-emerald-200/80 dark:bg-emerald-500/20";
  if (count === 2) return "bg-emerald-300/90 dark:bg-emerald-500/35";
  if (count === 3) return "bg-emerald-400/90 dark:bg-emerald-500/55";
  return "bg-emerald-500/90 dark:bg-emerald-500/75";
}

export default function Heatmap({ days }: { days: Day[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [hover, setHover] = useState<{
    day: Day;
    x: number;
    y: number;
  } | null>(null);

  const [openMobile, setOpenMobile] = useState<Day | null>(null);

  const isCoarsePointer =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)").matches;

  const hoverLabel = (d: Day) => {
    const dt = parseISODate(d.date);
    const pretty = dt.toLocaleDateString("it-IT", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    const n = d.count;
    return `${n} session${n === 1 ? "e" : "i"} • ${pretty}`;
  };

  const showTooltip = (e: React.MouseEvent, day: Day) => {
    const host = scrollRef.current;
    if (!host) return;
    const r = host.getBoundingClientRect();

    const x = e.clientX - r.left + host.scrollLeft;
    const y = e.clientY - r.top + host.scrollTop;

    setHover({ day, x, y });
  };

  const { columns, monthTicks, maxCount } = useMemo(() => {
    const max = days.reduce((m, d) => Math.max(m, d.count), 0);

    const start = parseISODate(days[0]?.date ?? "2026-01-01");
    const startDow = start.getDay();
    const mondayBasedOffset = (startDow + 6) % 7;

    const padded: (Day | null)[] = Array(mondayBasedOffset)
      .fill(null)
      .concat(days);

    const cols: (Day | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));

    const ticks: { col: number; label: string }[] = [];
    let lastMonth = -1;
    cols.forEach((col, idx) => {
      const firstReal = col.find((c) => c !== null) as Day | undefined;
      if (!firstReal) return;
      const dt = parseISODate(firstReal.date);
      const m = dt.getMonth();
      if (m !== lastMonth) {
        ticks.push({ col: idx, label: monthLabel(dt) });
        lastMonth = m;
      }
    });

    return { columns: cols, monthTicks: ticks, maxCount: max };
  }, [days]);

  return (
    <div className="cf-card overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold cf-text">Heatmap allenamenti</h2>
          <p className="mt-1 text-xs cf-muted">
            Sessioni <span className="font-medium">completate</span> negli ultimi{" "}
            {days.length} giorni
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs cf-muted">Max/die</div>
          <div className="text-sm font-semibold cf-text">{maxCount}</div>
        </div>
      </div>

      <div className="mt-4 mx-0 px-0 sm:-mx-4 sm:px-4">
        <div
          ref={scrollRef}
          className="relative w-full max-w-full overflow-x-auto overscroll-x-contain min-w-0"
        >

          {hover ? (
            <div
              className="pointer-events-none absolute z-10 hidden sm:block rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-xs text-neutral-900 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/70 dark:text-neutral-100"
              style={{
                left: hover.x + 12,
                top: hover.y + 12,
                maxWidth: 220,
              }}
            >
              <div className="font-medium">{hoverLabel(hover.day)}</div>
              <div className="mt-0.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                {hover.day.date}
              </div>
            </div>
          ) : null}

          <div className="min-w-max">

            <div className="mb-2 flex items-center gap-1 pl-10">
              {columns.map((_, idx) => {
                const tick = monthTicks.find((t) => t.col === idx);
                return (
                  <div key={idx} className="w-3">
                    {tick ? (
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {tick.label}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 min-w-0">

              <div className="w-8 pt-[2px] shrink-0">
                {["lun", "", "mer", "", "ven", "", ""].map((l, i) => (
                  <div
                    key={i}
                    className="h-3 mb-1 text-[10px] text-neutral-500 dark:text-neutral-400"
                  >
                    {l}
                  </div>
                ))}
              </div>

              <div className="flex gap-1">
                {columns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1">
                    {col.map((cell, rowIdx) => {
                      if (!cell) {
                        return (
                          <div
                            key={rowIdx}
                            className="h-3 w-3 rounded-[4px] bg-transparent"
                          />
                        );
                      }

                      return (
                        <button
                          key={rowIdx}
                          type="button"
                          onMouseEnter={(e) => {
                            if (!isCoarsePointer) showTooltip(e, cell);
                          }}
                          onMouseMove={(e) => {
                            if (!isCoarsePointer) showTooltip(e, cell);
                          }}
                          onMouseLeave={() => setHover(null)}
                          onClick={() => {

                            setOpenMobile(cell);
                          }}
                          className={[
                            "h-3 w-3 rounded-[4px] border border-black/5 dark:border-white/10 transition",
                            intensityClass(cell.count),
                          ].join(" ")}
                          aria-label={`${cell.date}: ${cell.count} completate`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {openMobile ? (
          <>

            <button
              type="button"
              onClick={() => setOpenMobile(null)}
              className="fixed inset-0 z-40 bg-black/0"
              aria-label="Chiudi tooltip"
            />
            <div className="fixed left-1/2 top-4 z-50 w-[calc(70vw-2rem)] lg:w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-black/10 bg-white/95 px-4 py-3 text-sm text-neutral-900 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/80 dark:text-neutral-100">
              <div className="font-semibold">{hoverLabel(openMobile)}</div>
              <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                {openMobile.date}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpenMobile(null)}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}