"use client";

import * as React from "react";

function clampSets(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(30, Math.floor(n)));
}

function toCsv(vals: (number | null)[]) {
  return vals
    .map((v) => (v == null || !Number.isFinite(v) ? "" : String(v)))
    .filter((s) => s !== "")
    .join(", ");
}

function parseMaybeNumber(v: string) {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round(n));
}

function normalizeLen<T>(arr: T[], len: number, fill: T) {
  if (len <= 0) return [];
  if (arr.length === len) return arr.slice();
  if (arr.length > len) return arr.slice(0, len);
  return [...arr, ...Array.from({ length: len - arr.length }, () => fill)];
}

export default function RestPerSet({
  setsName = "sets",
  name = "restSecBySet",
  sets,
  defaultValue,
  label = "Recupero per serie",
  hint = "Inserisci i secondi di recupero per ogni serie (facoltativo).",
}: {
  setsName?: string;
  name?: string;
  sets: number;
  defaultValue?: number[] | null;
  label?: string;
  hint?: string;
}) {
  const setsN = clampSets(sets);
  const target = sets && sets > 0 ? Math.min(sets, 50) : 0;
  const [vals, setVals] = React.useState<(number | null)[]>(() =>
    normalizeLen(
      (defaultValue ?? []).map((x) =>
        Number.isFinite(x) ? Math.round(x) : null
      ),
      setsN,
      null
    )
  );

  React.useEffect(() => {
    setVals((prev) => normalizeLen(prev, setsN, null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setsN]);

  const filled = vals.filter((v) => v != null).length;

  const onChange = (idx: number, raw: string) => {
    const next = parseMaybeNumber(raw);
    setVals((prev) => {
      const copy = prev.slice();
      copy[idx] = next;
      return copy;
    });
  };

  const replicate = () => {
    setVals((prev) => {
      const first = prev.find((v) => v != null) ?? null;
      if (first == null) return prev;
      return prev.map(() => first);
    });
  };

  const clear = () => setVals(Array.from({ length: setsN }, () => null));

  const csv = vals
    .map((v) => (v == null ? "" : String(v)))
    .join(", ")
    .replace(/^(,\s*)+|(,\s*)+$/g, "")
    .trim();

  return (
    <div className="cf-card cf-hairline rounded-3xl p-3 sm:p-3 mb-4">

      <input type="hidden" name={name} value={csv} />

      <input type="hidden" name={`${name}__sets`} value={String(setsN)} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold cf-text">{label}</div>
          <div className="mt-1 text-xs cf-faint">
            {filled}/{setsN} compilati · {hint}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={replicate}
            disabled={setsN === 0}
            className="rounded-2xl border cf-surface px-4 py-2 text-xs cf-text hover:opacity-90 disabled:opacity-50"
          >
            Replica
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={setsN === 0}
            className="rounded-2xl border cf-surface px-4 py-2 text-xs cf-text hover:opacity-90 disabled:opacity-50"
          >
            Svuota
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: setsN }).map((_, i) => {
          const v = vals[i];
          return (
            <div
              key={i}
              className="rounded-2xl border cf-surface bg-white/40 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:bg-black/20"
            >
              <div className="text-xs font-medium cf-muted">{`Serie ${
                i + 1
              }`}</div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={v == null ? "" : String(v)}
                  onChange={(e) => onChange(i, e.target.value)}
                  placeholder="sec"
                  className="w-full bg-transparent text-sm font-semibold outline-none cf-text placeholder:cf-faint"
                />
                <div className="text-sm font-semibold cf-muted">s</div>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-2 rounded-full bg-black/20 dark:bg-white/20"
                  style={{
                    width: `${Math.round(((i + 1) / target) * 100)}%`,
                    transition: "width 140ms ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {setsN === 0 ? (
        <div className="mt-3 text-sm cf-faint">
          Imposta prima il numero di serie per abilitare recuperi per set.
        </div>
      ) : null}
    </div>
  );
}
