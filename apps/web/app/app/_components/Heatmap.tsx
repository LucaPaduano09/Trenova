"use client";

import { useMemo, useState } from "react";

type Day = { date: string; count: number };

function dayLabel(d: Date) {
  return d.toLocaleDateString("it-IT", { weekday: "short" });
}
function monthLabel(d: Date) {
  return d.toLocaleDateString("it-IT", { month: "short" });
}
function parseISODate(s: string) {
  // s = YYYY-MM-DD (local)
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function intensityClass(count: number) {
  // 0..4 livelli (neutro -> strong)
  if (count <= 0) return "bg-neutral-200/60 dark:bg-white/5";
  if (count === 1) return "bg-emerald-200/80 dark:bg-emerald-500/20";
  if (count === 2) return "bg-emerald-300/90 dark:bg-emerald-500/35";
  if (count === 3) return "bg-emerald-400/90 dark:bg-emerald-500/55";
  return "bg-emerald-500/90 dark:bg-emerald-500/75";
}

export default function Heatmap({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<Day | null>(null);

  const { columns, monthTicks, maxCount } = useMemo(() => {
    const max = days.reduce((m, d) => Math.max(m, d.count), 0);

    // GitHub-style: 7 righe (giorni settimana) x N colonne (settimane)
    const start = parseISODate(days[0]?.date ?? "2026-01-01");
    const startDow = start.getDay(); // 0 Sun..6 Sat
    const mondayBasedOffset = (startDow + 6) % 7; // Mon=0..Sun=6

    const padded: (Day | null)[] = Array(mondayBasedOffset)
      .fill(null)
      .concat(days);

    const cols: (Day | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7)
      cols.push(padded.slice(i, i + 7));

    // month labels: segna cambio mese sulla prima cella utile della colonna
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
    <div className="cf-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold cf-text">Heatmap allenamenti</h2>
          <p className="mt-1 text-xs cf-muted">
            Sessioni <span className="font-medium">completate</span> negli
            ultimi {days.length} giorni
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs cf-muted">Max/die</div>
          <div className="text-sm font-semibold cf-text">{maxCount}</div>
        </div>
      </div>

      {/* Month labels */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[760px]">
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

          <div className="flex gap-3">
            {/* Y labels */}
            <div className="w-8 pt-[2px]">
              {["lun", "", "mer", "", "ven", "", ""].map((l, i) => (
                <div
                  key={i}
                  className="h-3 mb-1 text-[10px] text-neutral-500 dark:text-neutral-400"
                >
                  {l}
                </div>
              ))}
            </div>

            {/* Grid */}
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
                        onMouseEnter={() => setHover(cell)}
                        onMouseLeave={() => setHover(null)}
                        className={[
                          "h-3 w-3 rounded-[4px] border border-black/5 dark:border-white/10 transition",
                          intensityClass(cell.count),
                        ].join(" ")}
                        aria-label={`${cell.date}: ${cell.count} completate`}
                        title={`${cell.date}: ${cell.count} completate`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend + hover */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs cf-muted">
              {hover ? (
                <span>
                  <span className="font-medium cf-text">{hover.count}</span>{" "}
                  completate • <span className="cf-text">{hover.date}</span>
                </span>
              ) : (
                <span>Passa col mouse per dettagli</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs cf-muted">
              <span>meno</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={[
                      "h-3 w-3 rounded-[4px] border border-black/5 dark:border-white/10",
                      intensityClass(n),
                    ].join(" ")}
                  />
                ))}
              </div>
              <span>più</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
