"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useDebouncedValue<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function ClientsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initialQ = sp.get("q") ?? "";
  const initialStatus = (sp.get("status") ?? "ACTIVE") as "ACTIVE" | "ARCHIVED";
  const initialSort = (sp.get("sort") ?? "new") as "new" | "old" | "name";

  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const [sort, setSort] = useState(initialSort);

  const debouncedQ = useDebouncedValue(q, 250);

  const nextUrl = useMemo(() => {
    const params = new URLSearchParams(sp.toString());

    const qq = debouncedQ.trim();
    if (qq) params.set("q", qq);
    else params.delete("q");

    params.set("status", status);
    params.set("sort", sort);

    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, sp, debouncedQ, status, sort]);

  useEffect(() => {
    router.replace(nextUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextUrl]);

  return (
    <section className="cf-card p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center cf-faint">
            ⌕
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca clienti per nome, email o telefono..."
            className="w-full rounded-2xl px-10 py-2.5 text-sm outline-none cf-input"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-2xl px-3 py-2.5 text-sm cf-input"
          >
            <option value="ACTIVE">Attivi</option>
            <option value="ARCHIVED">Archiviati</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-2xl px-3 py-2.5 text-sm cf-input"
          >
            <option value="new">Più recenti</option>
            <option value="old">Meno recenti</option>
            <option value="name">Nome (A→Z)</option>
          </select>

          <button
            type="button"
            className="cf-btn cf-btn-ghost"
            onClick={() => {
              setQ("");
              setStatus("ACTIVE");
              setSort("new");
            }}
            title="Reset filtri"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
