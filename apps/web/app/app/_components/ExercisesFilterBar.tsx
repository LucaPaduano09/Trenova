"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type State = "active" | "archived" | "all";
type Sort = "updated" | "name" | "newest" | "oldest";
type Image = "any" | "with" | "without";

export default function ExercisesFiltersBar({
  initialQ,
  initialState,
  initialSort,
  initialImage,
  initialTag,
  resultsCount,
}: {
  initialQ: string;
  initialState: State;
  initialSort: Sort;
  initialImage: Image;
  initialTag: string;
  resultsCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [state, setState] = useState<State>(initialState);
  const [sort, setSort] = useState<Sort>(initialSort);
  const [image, setImage] = useState<Image>(initialImage);
  const [tag, setTag] = useState(initialTag);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  useEffect(() => setQ(initialQ), [initialQ]);
  useEffect(() => setState(initialState), [initialState]);
  useEffect(() => setSort(initialSort), [initialSort]);
  useEffect(() => setImage(initialImage), [initialImage]);
  useEffect(() => setTag(initialTag), [initialTag]);

  useEffect(() => setMounted(true), []);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (state !== "active") n++;
    if (sort !== "updated") n++;
    if (image !== "any") n++;
    if (tag.trim()) n++;
    return n;
  }, [state, sort, image, tag]);

  const hasActive = useMemo(() => {
    return (
      q.trim().length > 0 ||
      state !== "active" ||
      sort !== "updated" ||
      image !== "any" ||
      tag.trim().length > 0
    );
  }, [q, state, sort, image, tag]);

  function apply(
    next?: Partial<{
      q: string;
      state: State;
      sort: Sort;
      image: Image;
      tag: string;
    }>
  ) {
    const nq = (next?.q ?? q).trim();
    const ns = (next?.state ?? state) as State;
    const nso = (next?.sort ?? sort) as Sort;
    const ni = (next?.image ?? image) as Image;
    const nt = (next?.tag ?? tag).trim();

    const p = new URLSearchParams(sp.toString());

    if (nq) p.set("q", nq);
    else p.delete("q");

    if (ns !== "active") p.set("state", ns);
    else p.delete("state");

    if (nso !== "updated") p.set("sort", nso);
    else p.delete("sort");

    if (ni !== "any") p.set("image", ni);
    else p.delete("image");

    if (nt) p.set("tag", nt);
    else p.delete("tag");

    p.delete("page");

    router.replace(`${pathname}${p.toString() ? `?${p.toString()}` : ""}`, {
      scroll: false,
    });
  }

  const tRef = useRef<number | null>(null);
  function applyDebounced(next?: Partial<{ q: string; tag: string }>) {
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => apply(next), 250);
  }

  function reset() {
    setQ("");
    setState("active");
    setSort("updated");
    setImage("any");
    setTag("");
    setOpen(false);
    router.replace(pathname, { scroll: false });
  }

  function recomputePos() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 8;
    setPos({
      top: Math.round(r.bottom + gap),
      left: Math.round(r.left),
      width: 360,
    });
  }

  useEffect(() => {
    if (!open) return;
    recomputePos();
    const onScroll = () => recomputePos();
    const onResize = () => recomputePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="rounded-3xl border cf-surface p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-2xl border cf-surface px-3 py-2.5">
            <span className="text-xs cf-faint">⌕</span>
            <input
              value={q}
              onChange={(e) => {
                const v = e.target.value;
                setQ(v);
                applyDebounced({ q: v });
              }}
              placeholder="Cerca per nome o tag…"
              className="w-full bg-transparent text-sm outline-none cf-text placeholder:cf-faint"
            />
            {q.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  apply({ q: "" });
                }}
                className="rounded-xl border cf-surface px-2 py-1 text-xs cf-text hover:opacity-90"
                title="Svuota"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            ref={btnRef}
            type="button"
            onClick={() => {
              if (!open) recomputePos();
              setOpen((v) => !v);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90"
          >
            Filtri
            {activeFiltersCount > 0 ? (
              <span className="inline-flex items-center rounded-full border cf-surface px-2 py-0.5 text-xs cf-faint">
                {activeFiltersCount}
              </span>
            ) : null}
            <span className="text-xs cf-faint">▾</span>
          </button>

          <button
            type="button"
            onClick={reset}
            disabled={!hasActive}
            className={[
              "rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90",
              !hasActive ? "opacity-40 cursor-not-allowed" : "",
            ].join(" ")}
          >
            Reset
          </button>

          <span className="hidden sm:inline-flex items-center gap-2 text-xs cf-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
            {resultsCount} risultati
          </span>
        </div>
      </div>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[9999]">

              <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
              />

              <div
                className="absolute"
                style={{ top: pos.top, left: pos.left, width: pos.width }}
              >
                <div
                  className="rounded-3xl border cf-surface shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3">
                    <div className="px-2 pb-2 text-sm font-semibold cf-text">
                      Filtri esercizi
                    </div>

                    <div className="grid gap-2">
                      <Row label="Stato">
                        <Select
                          value={state}
                          onChange={(v) => {
                            const ns = v as State;
                            setState(ns);
                            apply({ state: ns });
                          }}
                          options={[
                            ["active", "Attivi"],
                            ["archived", "Archiviati"],
                            ["all", "Tutti"],
                          ]}
                        />
                      </Row>

                      <Row label="Ordina">
                        <Select
                          value={sort}
                          onChange={(v) => {
                            const ns = v as Sort;
                            setSort(ns);
                            apply({ sort: ns });
                          }}
                          options={[
                            ["updated", "Ultima modifica"],
                            ["name", "Nome A–Z"],
                            ["newest", "Più nuovi"],
                            ["oldest", "Più vecchi"],
                          ]}
                        />
                      </Row>

                      <Row label="Immagine">
                        <Select
                          value={image}
                          onChange={(v) => {
                            const ni = v as Image;
                            setImage(ni);
                            apply({ image: ni });
                          }}
                          options={[
                            ["any", "Tutte"],
                            ["with", "Solo con immagine"],
                            ["without", "Solo senza immagine"],
                          ]}
                        />
                      </Row>

                      <Row label="Tag">
                        <input
                          value={tag}
                          onChange={(e) => {
                            const v = e.target.value;
                            setTag(v);
                            applyDebounced({ tag: v });
                          }}
                          placeholder="es. petto"
                          className="w-[180px] bg-transparent text-sm outline-none cf-text placeholder:cf-faint"
                        />
                      </Row>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={reset}
                        disabled={!hasActive}
                        className={[
                          "rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90",
                          !hasActive ? "opacity-40 cursor-not-allowed" : "",
                        ].join(" ")}
                      >
                        Reset
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90"
                      >
                        Chiudi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border cf-surface px-3 py-2">
      <div className="text-xs cf-faint">{label}</div>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-sm cf-text outline-none pr-6"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs cf-faint">
        ▾
      </span>
    </div>
  );
}
