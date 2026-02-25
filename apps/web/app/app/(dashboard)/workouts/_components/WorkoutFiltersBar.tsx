"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

type State = "active" | "archived" | "all";

function clampState(v: string | null): State {
  if (v === "archived" || v === "all") return v;
  return "active";
}

function buildUrl(pathname: string, params: URLSearchParams) {
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function WorkoutsFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const spString = sp.toString();
  const urlQ = sp.get("q") ?? "";
  const urlState = clampState(sp.get("state"));

  const [q, setQ] = React.useState(urlQ);
  const [state, setState] = React.useState<State>(urlState);

  const didInit = React.useRef(false);
  // ultimo valore che abbiamo “spedito” all’URL
  const lastSentQ = React.useRef<string | null>(null);
  const lastSentState = React.useRef<State | null>(null);

  const locked = React.useRef(false);

  React.useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    setQ(urlQ);
    setState(urlState);
  }, [urlQ, urlState]);

  React.useEffect(() => {
    const normalizedUrlQ = (urlQ ?? "").trim();
    const normalizedSentQ = (lastSentQ.current ?? "").trim();

    const stateOk =
      lastSentState.current == null || lastSentState.current === urlState;

    const qOk = lastSentQ.current == null || normalizedUrlQ === normalizedSentQ;

    if (locked.current && qOk && stateOk) {
      locked.current = false;
      lastSentQ.current = null;
      lastSentState.current = null;
    }
  }, [urlQ, urlState]);

  React.useEffect(() => {
    // se non inizializzato, non fare push
    if (!didInit.current) return;

    const t = setTimeout(() => {
      locked.current = true;

      const next = new URLSearchParams(spString);

      const qq = q.trim();
      if (qq) next.set("q", qq);
      else next.delete("q");

      if (state !== "active") next.set("state", state);
      else next.delete("state");

      next.delete("page");

      const nextUrl = buildUrl(pathname, next);
      const currentUrl = buildUrl(pathname, new URLSearchParams(spString));

      lastSentQ.current = qq;
      lastSentState.current = state;

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl, { scroll: false });
      } else {
        locked.current = false;
        lastSentQ.current = null;
        lastSentState.current = null;
      }
    }, 350);

    return () => clearTimeout(t);
  }, [q, state, spString, pathname, router]);

  const onStateChange = (v: State) => {
    setState(v);
  };

  React.useEffect(() => {
    if (!didInit.current) return;
    if (locked.current) return;

    setQ(urlQ);
    setState(urlState);
  }, [urlQ, urlState]);

  return (
    <div className="rounded-3xl border cf-surface p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-2xl border cf-surface px-3 py-2.5">
            <span className="text-xs cf-faint">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca scheda…"
              className="w-full bg-transparent text-sm outline-none cf-text placeholder:cf-faint"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value as State)}
            className="appearance-none rounded-2xl border cf-surface px-3 py-2 text-sm cf-text outline-none"
          >
            <option value="active">Attive</option>
            <option value="archived">Archiviate</option>
            <option value="all">Tutte</option>
          </select>

          <Link
            href={pathname}
            className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90"
          >
            Reset
          </Link>
        </div>
      </div>
    </div>
  );
}
