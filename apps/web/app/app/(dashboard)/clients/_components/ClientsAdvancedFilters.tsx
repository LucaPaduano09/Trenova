"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type State = "active" | "archived" | "all";
type Created = "all" | "7d" | "30d" | "90d";
type Sort = "new" | "old" | "name";
type Presence = "any" | "with" | "without";

function get(
  sp: ReturnType<typeof useSearchParams>,
  key: string,
  fallback = ""
) {
  return sp.get(key) ?? fallback;
}

function normalizeParams(p: URLSearchParams) {
  const delIf = (k: string, v: string, def: string) => {
    if (!v || v === def) p.delete(k);
    else p.set(k, v);
  };
  delIf("state", p.get("state") ?? "", "active");
  delIf("created", p.get("created") ?? "", "all");
  delIf("sort", p.get("sort") ?? "", "new");
  delIf("email", p.get("email") ?? "", "any");
  delIf("phone", p.get("phone") ?? "", "any");
  const q = (p.get("q") ?? "").trim();
  if (!q) p.delete("q");
  else p.set("q", q);
  return p;
}

export default function ClientsAdvancedFilters({
  resultsCount,
}: {
  resultsCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);

  const [q, setQ] = useState(get(sp, "q", ""));
  const [state, setState] = useState<State>(
    (get(sp, "state", "active") as State) || "active"
  );
  const [created, setCreated] = useState<Created>(
    (get(sp, "created", "all") as Created) || "all"
  );
  const [sort, setSort] = useState<Sort>(
    (get(sp, "sort", "new") as Sort) || "new"
  );
  const [email, setEmail] = useState<Presence>(
    (get(sp, "email", "any") as Presence) || "any"
  );
  const [phone, setPhone] = useState<Presence>(
    (get(sp, "phone", "any") as Presence) || "any"
  );

  useEffect(() => {
    setQ(get(sp, "q", ""));
    setState((get(sp, "state", "active") as State) || "active");
    setCreated((get(sp, "created", "all") as Created) || "all");
    setSort((get(sp, "sort", "new") as Sort) || "new");
    setEmail((get(sp, "email", "any") as Presence) || "any");
    setPhone((get(sp, "phone", "any") as Presence) || "any");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (state !== "active") n++;
    if (created !== "all") n++;
    if (sort !== "new") n++;
    if (email !== "any") n++;
    if (phone !== "any") n++;
    return n;
  }, [state, created, sort, email, phone]);

  const lastQsRef = useRef<string>("");

  function pushUrl(
    next: Partial<
      Record<"q" | "state" | "created" | "sort" | "email" | "phone", string>
    >
  ) {
    const p = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v == null) return;
      p.set(k, v);
    });
    normalizeParams(p);

    const qs = p.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;

    if (qs === lastQsRef.current) return;
    lastQsRef.current = qs;

    startTransition(() => {
      router.replace(url, { scroll: false });
      router.refresh();
    });
  }

  useEffect(() => {
    const t = setTimeout(() => {
      pushUrl({ q });
    }, 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function resetAll() {
    lastQsRef.current = "";
    startTransition(() => {
      router.replace(pathname, { scroll: false });
      router.refresh();
    });
    setOpen(false);
  }

  return (
    <div className="rounded-3xl border cf-surface p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-2xl border cf-surface px-3 py-2.5">
            <span className="text-xs cf-faint">⌕</span>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca per nome, email o telefono…"
              className="w-full bg-transparent text-sm outline-none cf-text placeholder:cf-faint"
            />

            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
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
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90"
          >
            Filtri
            {activeFiltersCount > 0 ? (
              <span className="ml-2 inline-flex items-center rounded-full border cf-surface px-2 py-0.5 text-xs cf-faint">
                {activeFiltersCount}
              </span>
            ) : null}
          </button>

          <span className="hidden sm:inline-flex items-center gap-2 text-xs cf-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
            {resultsCount} risultati
          </span>

          {open ? (
            <>
              {/* overlay sopra TUTTO */}
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setOpen(false)}
              />

              {/* popover FIXED così non “va dietro” ai container */}
              <div className="fixed right-6 top-28 z-[9999] w-[340px] rounded-3xl border cf-surface p-3 shadow-xl">
                <div className="px-2 pb-2 text-sm font-semibold cf-text">
                  Filtri avanzati
                </div>

                <div className="grid gap-2">
                  <Row label="Stato">
                    <Select
                      value={state}
                      onChange={(v) => {
                        const vv = v as State;
                        setState(vv);
                        pushUrl({ state: vv });
                      }}
                      options={[
                        ["active", "Attivi"],
                        ["archived", "Archiviati"],
                        ["all", "Tutti"],
                      ]}
                    />
                  </Row>

                  <Row label="Creati">
                    <Select
                      value={created}
                      onChange={(v) => {
                        const vv = v as Created;
                        setCreated(vv);
                        pushUrl({ created: vv });
                      }}
                      options={[
                        ["all", "Sempre"],
                        ["7d", "Ultimi 7 giorni"],
                        ["30d", "Ultimi 30 giorni"],
                        ["90d", "Ultimi 90 giorni"],
                      ]}
                    />
                  </Row>

                  <Row label="Ordina">
                    <Select
                      value={sort}
                      onChange={(v) => {
                        const vv = v as Sort;
                        setSort(vv);
                        pushUrl({ sort: vv });
                      }}
                      options={[
                        ["new", "Più recenti"],
                        ["old", "Meno recenti"],
                        ["name", "Nome"],
                      ]}
                    />
                  </Row>

                  <Row label="Email">
                    <Select
                      value={email}
                      onChange={(v) => {
                        const vv = v as Presence;
                        setEmail(vv);
                        pushUrl({ email: vv });
                      }}
                      options={[
                        ["any", "Tutte"],
                        ["with", "Presenti"],
                        ["without", "Assenti"],
                      ]}
                    />
                  </Row>

                  <Row label="Telefono">
                    <Select
                      value={phone}
                      onChange={(v) => {
                        const vv = v as Presence;
                        setPhone(vv);
                        pushUrl({ phone: vv });
                      }}
                      options={[
                        ["any", "Tutti"],
                        ["with", "Presenti"],
                        ["without", "Assenti"],
                      ]}
                    />
                  </Row>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90"
                    disabled={isPending}
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
            </>
          ) : null}
        </div>

        <div className="sm:hidden text-xs cf-faint flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
          {resultsCount} risultati
        </div>
      </div>
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
