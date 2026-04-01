function fmtMoneyEUR(cents?: number | null) {
  if (!cents) return "€ 0";
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}
function fmtDateShort(d: Date) {
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}
function fmtTimeShort(d: Date) {
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
function dayKeyTZ(d: Date, tz = "Europe/Rome") {

  return d.toLocaleDateString("it-IT", { timeZone: tz });
}

function recencyLabel(now: Date, d?: Date | null, tz = "Europe/Rome") {
  if (!d) return "—";

  const nowKey = dayKeyTZ(now, tz);
  const dKey = dayKeyTZ(d, tz);

  if (dKey === nowKey) return "Oggi";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const yKey = dayKeyTZ(yesterday, tz);
  if (dKey === yKey) return "Ieri";

  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return "—";

  const diffD = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return `${diffD}g fa`;
}

type MiniKpi = {
  lastAt: Date | null;
  nextAt: Date | null;
  revenue30: number;
  paidRate30: number;
};

export function MiniOverviewCard({
  client,
  kpi,
}: {
  client: { status: string; createdAt: Date };
  kpi: MiniKpi | null;
}) {
  const now = new Date();

  const nextLabel = kpi?.nextAt
    ? `${fmtDateShort(kpi.nextAt)} • ${fmtTimeShort(kpi.nextAt)}`
    : "—";

  const lastLabel = recencyLabel(now, kpi?.lastAt ?? null);

  return (
    <div className="relative overflow-hidden rounded-[28px] border cf-surface cf-hairline p-5">

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
            Snapshot
          </div>
          <div className="mt-2 text-sm font-semibold cf-text">Panoramica</div>
          <div className="mt-1 text-xs cf-muted">
            Performance & business (ultimi 30g)
          </div>
        </div>

        <span className="rounded-full border cf-surface px-3 py-1 text-[11px] font-semibold cf-text">
          {client.status}
        </span>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-3">
        <KpiTile label="Ultima sessione" value={lastLabel} hint="Recency" />
        <KpiTile label="Prossima sessione" value={nextLabel} hint="Planning" />
        <KpiTile
          label="Revenue (30g)"
          value={fmtMoneyEUR(kpi?.revenue30 ?? 0)}
          hint="Pagate"
        />
        <KpiTile
          label="Paid rate"
          value={`${kpi?.paidRate30 ?? 0}%`}
          hint="Pagate/totali"
        />
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border cf-soft p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] cf-faint">{label}</div>
        {hint ? (
          <span className="rounded-full border cf-surface px-2 py-0.5 text-[10px] cf-faint">
            {hint}
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-sm font-semibold cf-text">{value}</div>
    </div>
  );
}

function StepItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "h-2 w-2 rounded-full",
          done ? "bg-emerald-500" : "bg-black/20 dark:bg-white/20",
        ].join(" ")}
      />
      <span className={done ? "line-through opacity-60" : ""}>{text}</span>
    </div>
  );
}
