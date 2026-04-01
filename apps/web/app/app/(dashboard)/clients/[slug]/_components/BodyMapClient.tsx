"use client";

import { useMemo, useState, useTransition } from "react";
import { upsertClientBodyIssue, toggleActive } from "@/actions/bodyIssues";
import type { ZoneKey, BodySideKey, IssueTypeKey } from "@/lib/bodyIssues";

type Issue = {
  id: string;
  zoneKey: string;
  side: BodySideKey;
  type: IssueTypeKey;
  severity: number | null;
  notes: string | null;
  active: boolean;
};

type Props = {
  clientId: string;
  clientSlug: string;
  initialIssues: Issue[];
};

const SIDE_LABEL: Record<BodySideKey, string> = {
  LEFT: "Sinistra",
  RIGHT: "Destra",
  MIDLINE: "Centro",
};

function keyOf(zoneKey: string, side: BodySideKey) {
  return `${zoneKey}:${side}`;
}

function intensityClass(sev: number | null | undefined, active: boolean) {
  if (!active) return "bg-neutral-200/70 dark:bg-white/10";
  const s = typeof sev === "number" ? sev : 0;

  if (s <= 0) return "bg-neutral-200/70 dark:bg-white/10";
  if (s <= 2) return "bg-emerald-200/80 dark:bg-emerald-500/20";
  if (s <= 4) return "bg-emerald-300/90 dark:bg-emerald-500/30";
  if (s <= 7) return "bg-emerald-400/90 dark:bg-emerald-500/45";
  return "bg-emerald-500/90 dark:bg-emerald-500/70";
}

function maxActiveSeverity(issues: Issue[]) {
  let m = 0;
  for (const i of issues) {
    if (!i.active) continue;
    const s = i.severity ?? 0;
    if (s > m) m = s;
  }
  return m;
}

function inactiveZoneFill() {
  return "var(--body-map-zone-inactive-fill)";
}

function inactiveZoneStroke() {
  return "var(--body-map-zone-inactive-stroke)";
}

export default function BodyMapClient({ clientId, initialIssues }: Props) {
  const [view, setView] = useState<"front" | "back">("front");
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [pending, start] = useTransition();
  function keyOf(zoneKey: string, side: Issue["side"]) {
    return `${zoneKey}:${side}`;
  }

  function intensityFill(sev: number, active: boolean) {
    if (!active) return inactiveZoneFill();
    if (sev <= 0) return inactiveZoneFill();

    if (sev <= 2) return "rgba(16,185,129,0.25)";
    if (sev <= 4) return "rgba(16,185,129,0.35)";
    if (sev <= 6) return "rgba(16,185,129,0.50)";
    if (sev <= 8) return "rgba(16,185,129,0.70)";
    return "rgba(16,185,129,0.90)";
  }

  function intensityStroke(sev: number, active: boolean) {
    if (!active && sev > 0) return inactiveZoneStroke();
    if (!active) return inactiveZoneStroke();
    return "rgba(15,23,42,0.14)";
  }
  const map = useMemo(() => {
    const m = new Map<string, Issue>();
    for (const i of issues) m.set(keyOf(i.zoneKey, i.side), i);
    return m;
  }, [issues]);

  const maxSev = useMemo(() => maxActiveSeverity(issues), [issues]);

  const [open, setOpen] = useState<null | {
    zoneKey: ZoneKey;
    side: BodySideKey;
  }>(null);
  const current = open ? map.get(keyOf(open.zoneKey, open.side)) : undefined;

  function onZoneClick(zoneKey: ZoneKey, side: BodySideKey) {
    setOpen({ zoneKey, side });
  }

  function close() {
    setOpen(null);
  }

  async function save(form: {
    type: IssueTypeKey;
    severity: number | null;
    notes: string;
    active: boolean;
  }) {
    if (!open) return;

    start(async () => {
      const res = await upsertClientBodyIssue({
        clientId,
        zoneKey: open.zoneKey,
        side: open.side,
        type: form.type,
        severity: form.severity,
        notes: form.notes,
        active: form.active,
      });

      if (!res.ok) return;

      setIssues((prev) => {
        const k = keyOf(open.zoneKey, open.side);
        const idx = prev.findIndex((x) => keyOf(x.zoneKey, x.side) === k);

        const next: Issue = {
          id: idx >= 0 ? prev[idx].id : `tmp-${Date.now()}`,
          zoneKey: open.zoneKey,
          side: open.side,
          type: form.type,
          severity: form.severity,
          notes: form.notes || null,
          active: form.active,
        };

        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...next };
          return copy;
        }
        return [next, ...prev];
      });

      close();
    });
  }

  async function flipActive(issueId: string) {
    start(async () => {
      const res = await toggleActive(issueId);
      if (!res.ok) return;

      setIssues((prev) =>
        prev.map((x) => (x.id === issueId ? { ...x, active: res.active } : x))
      );
    });
  }

  const zonesFront = [
    {
      zoneKey: "head" as const,
      side: "MIDLINE" as BodySideKey,
      x: 92,
      y: 10,
      w: 36,
      h: 36,
    },
    {
      zoneKey: "neck" as const,
      side: "MIDLINE" as BodySideKey,
      x: 98,
      y: 48,
      w: 24,
      h: 16,
    },
    {
      zoneKey: "shoulder" as const,
      side: "LEFT" as BodySideKey,
      x: 58,
      y: 66,
      w: 36,
      h: 22,
    },
    {
      zoneKey: "shoulder" as const,
      side: "RIGHT" as BodySideKey,
      x: 126,
      y: 66,
      w: 36,
      h: 22,
    },
    {
      zoneKey: "elbow" as const,
      side: "LEFT" as BodySideKey,
      x: 44,
      y: 100,
      w: 26,
      h: 18,
    },
    {
      zoneKey: "elbow" as const,
      side: "RIGHT" as BodySideKey,
      x: 150,
      y: 100,
      w: 26,
      h: 18,
    },
    {
      zoneKey: "wrist" as const,
      side: "LEFT" as BodySideKey,
      x: 34,
      y: 132,
      w: 26,
      h: 18,
    },
    {
      zoneKey: "wrist" as const,
      side: "RIGHT" as BodySideKey,
      x: 160,
      y: 132,
      w: 26,
      h: 18,
    },
    {
      zoneKey: "thoracic" as const,
      side: "MIDLINE" as BodySideKey,
      x: 88,
      y: 70,
      w: 44,
      h: 50,
    },
    {
      zoneKey: "lumbar" as const,
      side: "MIDLINE" as BodySideKey,
      x: 90,
      y: 122,
      w: 40,
      h: 34,
    },
    {
      zoneKey: "hip" as const,
      side: "LEFT" as BodySideKey,
      x: 78,
      y: 160,
      w: 26,
      h: 24,
    },
    {
      zoneKey: "hip" as const,
      side: "RIGHT" as BodySideKey,
      x: 116,
      y: 160,
      w: 26,
      h: 24,
    },
    {
      zoneKey: "knee" as const,
      side: "LEFT" as BodySideKey,
      x: 78,
      y: 228,
      w: 28,
      h: 24,
    },
    {
      zoneKey: "knee" as const,
      side: "RIGHT" as BodySideKey,
      x: 116,
      y: 228,
      w: 28,
      h: 24,
    },
    {
      zoneKey: "ankle" as const,
      side: "LEFT" as BodySideKey,
      x: 74,
      y: 296,
      w: 28,
      h: 22,
    },
    {
      zoneKey: "ankle" as const,
      side: "RIGHT" as BodySideKey,
      x: 120,
      y: 296,
      w: 28,
      h: 22,
    },
  ];

  const zonesBack = [
    {
      zoneKey: "head" as const,
      side: "MIDLINE" as BodySideKey,
      x: 92,
      y: 10,
      w: 36,
      h: 36,
    },
    {
      zoneKey: "neck" as const,
      side: "MIDLINE" as BodySideKey,
      x: 98,
      y: 48,
      w: 24,
      h: 16,
    },
    {
      zoneKey: "shoulder" as const,
      side: "LEFT" as BodySideKey,
      x: 58,
      y: 66,
      w: 36,
      h: 22,
    },
    {
      zoneKey: "shoulder" as const,
      side: "RIGHT" as BodySideKey,
      x: 126,
      y: 66,
      w: 36,
      h: 22,
    },
    {
      zoneKey: "elbow" as const,
      side: "LEFT" as BodySideKey,
      x: 44,
      y: 100,
      w: 26,
      h: 18,
    },
    {
      zoneKey: "elbow" as const,
      side: "RIGHT" as BodySideKey,
      x: 150,
      y: 100,
      w: 26,
      h: 18,
    },
    {
      zoneKey: "wrist" as const,
      side: "LEFT" as BodySideKey,
      x: 34,
      y: 132,
      w: 26,
      h: 18,
    },
    {
      zoneKey: "wrist" as const,
      side: "RIGHT" as BodySideKey,
      x: 160,
      y: 132,
      w: 26,
      h: 18,
    },
    {
      zoneKey: "thoracic" as const,
      side: "MIDLINE" as BodySideKey,
      x: 86,
      y: 74,
      w: 48,
      h: 54,
    },
    {
      zoneKey: "lumbar" as const,
      side: "MIDLINE" as BodySideKey,
      x: 90,
      y: 130,
      w: 40,
      h: 34,
    },
    {
      zoneKey: "hip" as const,
      side: "LEFT" as BodySideKey,
      x: 78,
      y: 164,
      w: 26,
      h: 24,
    },
    {
      zoneKey: "hip" as const,
      side: "RIGHT" as BodySideKey,
      x: 116,
      y: 164,
      w: 26,
      h: 24,
    },
    {
      zoneKey: "knee" as const,
      side: "LEFT" as BodySideKey,
      x: 78,
      y: 228,
      w: 28,
      h: 24,
    },
    {
      zoneKey: "knee" as const,
      side: "RIGHT" as BodySideKey,
      x: 116,
      y: 228,
      w: 28,
      h: 24,
    },
    {
      zoneKey: "ankle" as const,
      side: "LEFT" as BodySideKey,
      x: 74,
      y: 296,
      w: 28,
      h: 22,
    },
    {
      zoneKey: "ankle" as const,
      side: "RIGHT" as BodySideKey,
      x: 120,
      y: 296,
      w: 28,
      h: 22,
    },
  ];

  const activeList = useMemo(() => issues.filter((i) => i.active), [issues]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">

      <div
        className="rounded-3xl border cf-surface p-4"
        style={
          {
            "--body-map-zone-inactive-fill": "rgba(255,255,255,0.02)",
            "--body-map-zone-inactive-stroke": "rgba(15,23,42,0.28)",
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold cf-text">Mappa corpo</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("front")}
              className={[
                "rounded-xl px-3 py-1.5 text-xs border transition",
                view === "front"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "cf-surface hover:bg-white/70 dark:hover:bg-white/10",
              ].join(" ")}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setView("back")}
              className={[
                "rounded-xl px-3 py-1.5 text-xs border transition",
                view === "back"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "cf-surface hover:bg-white/70 dark:hover:bg-white/10",
              ].join(" ")}
            >
              Back
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative mx-auto w-full max-w-[280px]">

            <svg
              viewBox="0 0 220 340"
              className="h-auto w-full [--body-map-zone-inactive-fill:rgba(255,255,255,0.02)] [--body-map-zone-inactive-stroke:rgba(15,23,42,0.28)] dark:[--body-map-zone-inactive-fill:rgba(255,255,255,0.04)] dark:[--body-map-zone-inactive-stroke:rgba(226,232,240,0.32)]"
            >

              {(view === "front" ? zonesFront : zonesBack).map((z) => {
                const issue = map.get(keyOf(z.zoneKey, z.side));
                const sev = issue?.severity ?? 0;
                const active = issue?.active ?? false;

                const title = `${z.zoneKey} • ${SIDE_LABEL[z.side]} • ${
                  issue?.severity != null
                    ? `dolore ${issue.severity}/10`
                    : "nessun dato"
                }`;
                console.log("zone", z, "issue", issue);

                return (
                  <g key={`${z.zoneKey}:${z.side}`}>
                    <rect
                      x={z.x}
                      y={z.y}
                      width={z.w}
                      height={z.h}
                      rx={8}
                      ry={8}
                      fill={intensityFill(sev, active)}
                      stroke={active ? intensityStroke(sev, active) : inactiveZoneStroke()}
                      strokeWidth={active ? 1 : 1.5}
                      strokeDasharray={active ? undefined : "4 3"}
                      strokeLinecap="round"
                      opacity={0.95}
                      onClick={() => onZoneClick(z.zoneKey, z.side)}
                      style={{ cursor: "pointer" }}
                    >
                      <title>{title}</title>
                    </rect>
                  </g>
                );
              })}
            </svg>

            {open ? (
              <Popover
                pending={pending}
                zoneKey={open.zoneKey}
                side={open.side}
                initial={{
                  type: current?.type ?? "PAIN",
                  severity: current?.severity ?? 0,
                  notes: current?.notes ?? "",
                  active: current?.active ?? true,
                }}
                onClose={close}
                onSave={save}
              />
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border cf-surface p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold cf-text">Legenda</div>
              <div className="text-xs cf-muted">
                Max dolore:{" "}
                <span className="font-semibold cf-text">{maxSev}/10</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-neutral-200/70 dark:bg-white/10" />
              <span className="h-3 w-3 rounded bg-emerald-200/80 dark:bg-emerald-500/20" />
              <span className="h-3 w-3 rounded bg-emerald-300/90 dark:bg-emerald-500/30" />
              <span className="h-3 w-3 rounded bg-emerald-400/90 dark:bg-emerald-500/45" />
              <span className="h-3 w-3 rounded bg-emerald-500/90 dark:bg-emerald-500/70" />
              <span className="ml-2 text-xs cf-muted">0 → 10</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border cf-surface p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold cf-text">
            Problematiche attive
          </div>
          <div className="text-xs cf-muted">{activeList.length} attive</div>
        </div>

        {issues.length === 0 ? (
          <div className="mt-4 text-sm cf-muted">
            Nessuna problematica inserita. Clicca una zona sullo scheletro.
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {issues
              .slice()
              .sort((a, b) => Number(b.active) - Number(a.active))
              .map((i) => (
                <li
                  key={i.id}
                  className="rounded-2xl border cf-surface px-4 py-3 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold cf-text">
                      {i.zoneKey} • {SIDE_LABEL[i.side]}
                    </div>
                    <div className="mt-1 text-xs cf-muted">
                      {i.type}
                      {i.severity != null ? ` • ${i.severity}/10` : ""}
                      {i.notes ? ` • ${i.notes}` : ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => flipActive(i.id)}
                    className={[
                      "rounded-xl px-3 py-1.5 text-xs border transition",
                      i.active
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "cf-surface hover:bg-white/70 dark:hover:bg-white/10",
                    ].join(" ")}
                    title="Attiva/Disattiva"
                  >
                    {i.active ? "Attiva" : "Off"}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Popover({
  zoneKey,
  side,
  initial,
  pending,
  onClose,
  onSave,
}: {
  zoneKey: ZoneKey;
  side: BodySideKey;
  initial: {
    type: IssueTypeKey;
    severity: number;
    notes: string;
    active: boolean;
  };
  pending: boolean;
  onClose: () => void;
  onSave: (v: {
    type: IssueTypeKey;
    severity: number | null;
    notes: string;
    active: boolean;
  }) => void;
}) {
  const [type, setType] = useState<IssueTypeKey>(initial.type);
  const [severity, setSeverity] = useState<number>(initial.severity ?? 0);
  const [notes, setNotes] = useState<string>(initial.notes ?? "");
  const [active, setActive] = useState<boolean>(initial.active ?? true);

  return (
    <div className="absolute left-1/2 top-2 -translate-x-1/2 w-[260px] rounded-3xl border cf-surface p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold cf-text">
            {zoneKey} • {SIDE_LABEL[side]}
          </div>
          <div className="text-xs cf-muted">Inserisci dettagli (0–10).</div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border cf-surface px-2 py-1 text-xs hover:bg-white/70 dark:hover:bg-white/10"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium cf-text">Tipo</label>
          <select
            className="mt-2 w-full rounded-2xl border cf-surface px-3 py-2 text-sm outline-none"
            value={type}
            onChange={(e) => setType(e.target.value as IssueTypeKey)}
          >
            <option value="PAIN">Dolore</option>
            <option value="STIFFNESS">Rigidità</option>
            <option value="INJURY">Infortunio</option>
            <option value="POST_OP">Post-op</option>
            <option value="OTHER">Altro</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium cf-text">
            Severità: <span className="font-semibold">{severity}/10</span>
          </label>
          <input
            type="range"
            min={0}
            max={10}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </div>

        <div>
          <label className="text-xs font-medium cf-text">Note</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 min-h-[70px] w-full rounded-2xl border cf-surface px-3 py-2 text-sm outline-none"
            placeholder="Es. fastidio in accosciata, limitazione ROM..."
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs cf-text">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Attiva
          </label>

          <button
            type="button"
            disabled={pending}
            onClick={() => onSave({ type, severity, notes, active })}
            className="rounded-2xl bg-black px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "..." : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}
