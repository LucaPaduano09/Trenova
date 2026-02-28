"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type NotificationItem = {
  id: string;
  title: string;
  body?: string | null;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
};

function timeAgo(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "ora";
  if (sec < 60) return `${sec}s fa`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h fa`;
  const days = Math.floor(h / 24);
  return `${days}g fa`;
}

function badgeText(n: number) {
  if (n <= 0) return "";
  return n > 9 ? "9+" : String(n);
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export default function NotificationsBell() {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      setErr(null);
      setLoading(true);

      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");

      const json = await res.json();
      setUnreadCount(Number(json.unreadCount ?? 0));
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch {
      setErr("Impossibile caricare le notifiche.");
    } finally {
      setLoading(false);
    }
  }, []);

  // polling leggero
  React.useEffect(() => {
    fetchNotifications();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifications();
    }, 25_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchNotifications]);

  // refresh quando apri
  React.useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // click outside + esc
  React.useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = React.useCallback(async (id: string) => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // silent
    }
  }, []);

  const markAllRead = React.useCallback(async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });

      // ottimistico
      setUnreadCount(0);
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        }))
      );
    } catch {
      // silent
    }
  }, []);

  const onClickNotification = async (n: NotificationItem) => {
    // ottimistico
    if (!n.readAt) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x
        )
      );
      void markRead(n.id);
    }

    setOpen(false);

    if (n.href) router.push(n.href);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border cf-surface cf-text hover:opacity-90"
        aria-label="Notifiche"
      >
        <BellIcon className="h-5 w-5" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
            {badgeText(unreadCount)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 mt-2 w-[360px] overflow-hidden rounded-3xl border cf-surface shadow-lg"
          role="dialog"
          aria-label="Pannello notifiche"
        >
          {/* header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-black/5 dark:border-white/10">
            <div className="min-w-0">
              <div className="text-sm font-semibold cf-text">Notifiche</div>
              <div className="text-xs cf-muted">
                {unreadCount > 0
                  ? `${unreadCount} non lette`
                  : "Nessuna nuova notifica"}
              </div>
            </div>

            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className={[
                "rounded-2xl px-3 py-2 text-xs border cf-surface",
                "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              Segna tutte lette
            </button>
          </div>

          {/* body */}
          <div className="max-h-[420px] overflow-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm cf-muted">Caricamento…</div>
            ) : err ? (
              <div className="px-4 py-6 text-sm text-rose-600">{err}</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-sm cf-muted">
                Nessuna notifica al momento.
              </div>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/10">
                {items.map((n) => {
                  const unread = !n.readAt;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onClickNotification(n)}
                        className="w-full text-left px-4 py-3 transition hover:bg-white/70 dark:hover:bg-white/10"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <span
                              className={[
                                "block h-2.5 w-2.5 rounded-full",
                                unread ? "bg-blue-500" : "bg-transparent",
                              ].join(" ")}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate text-sm font-semibold cf-text">
                                {n.title}
                              </div>
                              <div className="shrink-0 text-[11px] cf-faint">
                                {timeAgo(n.createdAt)}
                              </div>
                            </div>

                            {n.body ? (
                              <div className="mt-0.5 line-clamp-2 text-xs cf-muted">
                                {n.body}
                              </div>
                            ) : null}

                            {n.href ? (
                              <div className="mt-1 text-[11px] cf-faint">
                                Apri →
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={fetchNotifications}
              className="text-xs cf-faint hover:underline"
            >
              Aggiorna
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/app/notifications");
              }}
              className="text-xs cf-faint hover:underline"
            >
              Vedi tutte →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
