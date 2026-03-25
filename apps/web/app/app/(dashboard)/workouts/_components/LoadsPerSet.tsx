"use client";

import { useEffect, useMemo, useState } from "react";

function toNum(v: string): number | null {
  const n = Number(v.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return Math.round(n * 100) / 100;
}

function fmt(n: number | null) {
  if (n == null) return "";
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

export default function LoadsPerSet({
  sets,
  name = "loadsKg",
  defaultLoadsKg,
  hint = "Inserisci i kg per ogni serie (facoltativo).",
}: {
  sets: number | null;
  name?: string;
  defaultLoadsKg?: number[];
  hint?: string;
}) {
  const target = sets && sets > 0 ? Math.min(sets, 50) : 0;

  const [loads, setLoads] = useState<(number | null)[]>(() => {
    const base = (defaultLoadsKg ?? []).map((x) =>
      Number.isFinite(x) && x >= 0 ? x : null
    );
    if (!target) return base;
    const out = base.slice(0, target);
    while (out.length < target) out.push(out[out.length - 1] ?? null);
    return out;
  });

  useEffect(() => {
    if (!target) return;
    setLoads((prev) => {
      const out = prev.slice(0, target);
      while (out.length < target) out.push(out[out.length - 1] ?? null);
      return out;
    });
  }, [target]);

  const csv = useMemo(() => {
    const nums = loads.map((x) => (x == null ? "" : String(x)));

    return nums.join(", ");
  }, [loads]);

  const filledCount = useMemo(
    () => loads.filter((x) => x != null).length,
    [loads]
  );

  if (!target) {
    return (
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium cf-text">Kg (per set)</div>
          <span className="text-xs cf-faint">CSV</span>
        </div>
        <input
          name={name}
          defaultValue={(defaultLoadsKg ?? []).join(", ")}
          className="cf-input"
          placeholder="40, 50, 50"
        />
        <div className="text-xs cf-faint">{hint}</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border cf-surface p-3">

      <input type="hidden" name={name} value={csv} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium cf-text">Carichi per serie</div>
          <div className="mt-0.5 text-xs cf-faint">
            {filledCount}/{target} compilati · {hint}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLoads((prev) => {
                const out = prev.slice();
                const last = out.findLast((x) => x != null) ?? null;
                if (last == null) return out;
                return out.map((x) => (x == null ? last : x));
              });
            }}
            className="rounded-2xl border cf-surface px-3 py-2 text-xs cf-text hover:opacity-90"
            title="Replica l’ultimo valore sui campi vuoti"
          >
            Replica
          </button>

          <button
            type="button"
            onClick={() => setLoads(Array.from({ length: target }, () => null))}
            className="rounded-2xl border cf-surface px-3 py-2 text-xs cf-text hover:opacity-90"
            title="Svuota tutti i carichi"
          >
            Svuota
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: target }).map((_, i) => {
          const v = loads[i];

          return (
            <div
              key={i}
              className={[
                "group rounded-2xl border cf-surface px-3 py-2",
                "bg-white/45 dark:bg-neutral-950/25",
                "transition hover:bg-white/60 dark:hover:bg-neutral-950/35",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] cf-faint">Serie {i + 1}</div>
                {v != null ? (
                  <button
                    type="button"
                    onClick={() =>
                      setLoads((prev) => {
                        const out = prev.slice();
                        out[i] = null;
                        return out;
                      })
                    }
                    className="text-[11px] cf-faint opacity-0 transition group-hover:opacity-100 hover:opacity-80"
                    title="Svuota questa serie"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              <div className="mt-1 flex items-baseline gap-2">
                <input
                  inputMode="decimal"
                  className="w-full bg-transparent text-sm outline-none cf-text"
                  placeholder="kg"
                  value={fmt(v)}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    setLoads((prev) => {
                      const out = prev.slice();
                      out[i] = raw ? toNum(raw) : null;
                      return out;
                    });
                  }}
                />
                <span className="text-xs cf-faint">kg</span>
              </div>

              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-black/15 dark:bg-white/15"
                  style={{
                    width: `${Math.round(((i + 1) / target) * 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
