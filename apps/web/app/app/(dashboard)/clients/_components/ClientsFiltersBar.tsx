"use client";
import { createPortal } from "react-dom";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Model = {
  q: string;
  state: "active" | "archived" | "all";
  sort: "new" | "old" | "name";
  email: "any" | "with" | "without";
  phone: "any" | "with" | "without";
  created: "all" | "7d" | "30d" | "90d";
};

function buildQuery(nm: Model) {
  const p = new URLSearchParams();
  if (nm.q.trim()) p.set("q", nm.q.trim());
  if (nm.state !== "active") p.set("state", nm.state);
  if (nm.sort !== "new") p.set("sort", nm.sort);
  if (nm.email !== "any") p.set("email", nm.email);
  if (nm.phone !== "any") p.set("phone", nm.phone);
  if (nm.created !== "all") p.set("created", nm.created);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export default function ClientsFiltersBar({
  initial,
  resultsCount,
}: {
  initial: Model;
  resultsCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const selfNavUrlRef = useRef<string>("");
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(
    null
  );
  function currentUrl(pathname: string, sp: URLSearchParams) {
    const qs = sp.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }

  const [m, setM] = useState<Model>(initial);

  const [draftQ, setDraftQ] = useState(initial.q);

  const [open, setOpen] = useState(false);

  const didMount = useRef(false);
  const lastUrl = useRef<string>("");

  useEffect(() => {
    const urlNow = currentUrl(pathname, new URLSearchParams(sp.toString()));
    if (urlNow === selfNavUrlRef.current) {
      return;
    }

    const nextFromUrl: Model = {
      q: sp.get("q") ?? "",
      state: (sp.get("state") as any) ?? "active",
      sort: (sp.get("sort") as any) ?? "new",
      email: (sp.get("email") as any) ?? "any",
      phone: (sp.get("phone") as any) ?? "any",
      created: (sp.get("created") as any) ?? "all",
    };

    if (!["active", "archived", "all"].includes(nextFromUrl.state))
      nextFromUrl.state = "active";
    if (!["new", "old", "name"].includes(nextFromUrl.sort))
      nextFromUrl.sort = "new";
    if (!["any", "with", "without"].includes(nextFromUrl.email))
      nextFromUrl.email = "any";
    if (!["any", "with", "without"].includes(nextFromUrl.phone))
      nextFromUrl.phone = "any";
    if (!["all", "7d", "30d", "90d"].includes(nextFromUrl.created))
      nextFromUrl.created = "all";

    setM(nextFromUrl);
    setDraftQ(nextFromUrl.q);
  }, [sp, pathname]);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (m.state !== "active") n++;
    if (m.created !== "all") n++;
    if (m.sort !== "new") n++;
    if (m.email !== "any") n++;
    if (m.phone !== "any") n++;
    return n;
  }, [m]);

  const hasActiveFilters = useMemo(() => {
    return (
      (m.q?.trim() ?? "") ||
      m.state !== "active" ||
      m.sort !== "new" ||
      m.email !== "any" ||
      m.phone !== "any" ||
      m.created !== "all"
    );
  }, [m]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      lastUrl.current = pathname + buildQuery(m);
      return;
    }

    const delay = 250;
    const t = setTimeout(() => {
      const next = pathname + buildQuery(m);
      if (next === lastUrl.current) return;
      lastUrl.current = next;
      selfNavUrlRef.current = next;
      router.replace(next, { scroll: false });
    }, delay);

    return () => clearTimeout(t);
  }, [m, pathname, router]);

  function setModel(next: Partial<Model>) {
    setM((prev) => ({ ...prev, ...next }));
  }

  function reset() {
    const clean: Model = {
      q: "",
      state: "active",
      sort: "new",
      email: "any",
      phone: "any",
      created: "all",
    };
    setOpen(false);
    setM(clean);
    setDraftQ("");
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (draftQ !== m.q) setModel({ q: draftQ });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQ]);

  return (
    <div className="rounded-3xl border cf-surface p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-2xl border cf-surface px-3 py-2.5">
            <span className="text-xs cf-faint">⌕</span>
            <input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Cerca per nome, email o telefono…"
              className="w-full bg-transparent text-sm outline-none cf-text placeholder:cf-faint"
            />
            {draftQ.trim() ? (
              <button
                onClick={() => setDraftQ("")}
                className="rounded-xl border cf-surface px-2 py-1 text-xs cf-text hover:opacity-90"
                title="Svuota"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              ref={btnRef}
              onClick={() => {
                const r = btnRef.current?.getBoundingClientRect();
                if (r)
                  setAnchor({
                    top: r.bottom + 10,
                    right: window.innerWidth - r.right,
                  });
                setOpen((v) => !v);
              }}
              className="relative rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90"
            >
              Filtri
              {activeFiltersCount > 0 ? (
                <span className="ml-2 inline-flex items-center rounded-full border cf-surface px-2 py-0.5 text-xs cf-faint">
                  {activeFiltersCount}
                </span>
              ) : null}
            </button>
            {open && anchor
              ? createPortal(
                  <>

                    <div
                      className="fixed inset-0 z-[9998]"
                      onClick={() => setOpen(false)}
                    />

                    <div
                      className="fixed z-[9999] w-[320px] rounded-3xl border cf-surface p-3 shadow-xl"
                      style={{ top: anchor.top, right: anchor.right }}
                    >
                      <div className="px-2 pb-2 text-sm font-semibold cf-text">
                        Filtri avanzati
                      </div>

                      <div className="grid gap-2 ">
                        <Row label="Stato">
                          <Select
                            value={m.state}
                            onChange={(v) => setModel({ state: v as any })}
                            options={[
                              ["active", "Attivi"],
                              ["archived", "Archiviati"],
                              ["all", "Tutti"],
                            ]}
                          />
                        </Row>

                        <Row label="Creati">
                          <Select
                            value={m.created}
                            onChange={(v) => setModel({ created: v as any })}
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
                            value={m.sort}
                            onChange={(v) => setModel({ sort: v as any })}
                            options={[
                              ["new", "Più recenti"],
                              ["old", "Meno recenti"],
                              ["name", "Nome"],
                            ]}
                          />
                        </Row>

                        <Row label="Email">
                          <Select
                            value={m.email}
                            onChange={(v) => setModel({ email: v as any })}
                            options={[
                              ["any", "Tutte"],
                              ["with", "Presenti"],
                              ["without", "Assenti"],
                            ]}
                          />
                        </Row>

                        <Row label="Telefono">
                          <Select
                            value={m.phone}
                            onChange={(v) => setModel({ phone: v as any })}
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
                          onClick={reset}
                          disabled={!hasActiveFilters}
                          className={[
                            "rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90",
                            !hasActiveFilters
                              ? "opacity-40 cursor-not-allowed"
                              : "",
                          ].join(" ")}
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => setOpen(false)}
                          className="rounded-2xl border cf-surface px-3 py-2 text-sm cf-text hover:opacity-90"
                        >
                          Chiudi
                        </button>
                      </div>
                    </div>
                  </>,
                  document.body
                )
              : null}
          </div>

          <span className="hidden sm:inline-flex items-center gap-2 text-xs cf-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
            {resultsCount} risultati
          </span>
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
          <option key={v} value={v} className="text-end">
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
