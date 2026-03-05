export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getClientOverviewStats } from "@/actions/clientOverview";

function eur(cents: number) {
  const v = (cents / 100).toFixed(2).replace(".", ",");
  return `€ ${v}`;
}

function fmtDayTime(d: Date) {
  return d.toLocaleString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sparklinePath(values: number[], w = 220, h = 46, pad = 4) {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const xs = values.map(
    (_, i) => pad + (i * (w - pad * 2)) / (values.length - 1)
  );
  const ys = values.map((v) => pad + (1 - (v - min) / span) * (h - pad * 2));

  return xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${ys[i].toFixed(2)}`)
    .join(" ");
}

function pillClass(rate: number) {
  if (rate >= 80)
    return "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-200";
  if (rate >= 60)
    return "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-200";
  return "bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-200";
}

export default async function OverviewStatsCards({
  clientId,
}: {
  clientId: string;
}) {
  const stats = await getClientOverviewStats(clientId);
  if (!stats) return null;

  const { performance, business } = stats;

  const points = performance.weight.points;
  const values = points.map((p) => p.weightKg);
  const path = sparklinePath(values);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Compliance */}
      <div className="cf-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold cf-text">
              Compliance (28g)
            </div>
            <div className="mt-1 text-xs cf-muted">Completate vs totali</div>
          </div>

          <span
            className={[
              "rounded-full border px-3 py-1 text-xs font-semibold",
              pillClass(performance.compliance.rate),
            ].join(" ")}
          >
            {performance.compliance.rate}%
          </span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <MiniStat
            label="Totali"
            value={String(performance.compliance.total28)}
          />
          <MiniStat
            label="Completate"
            value={String(performance.compliance.completed)}
          />
          <MiniStat
            label="Cancellate"
            value={String(performance.compliance.canceled)}
          />
        </div>
      </div>

      {/* Revenue */}
      <div className="cf-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold cf-text">Revenue (30g)</div>
            <div className="mt-1 text-xs cf-muted">Solo sessioni pagate</div>
          </div>

          <span className="rounded-full border cf-surface px-3 py-1 text-xs font-semibold cf-text">
            Paid {business.paidRate30d}%
          </span>
        </div>

        <div className="mt-4 text-2xl font-semibold cf-text">
          {eur(business.revenue30dCents)}
        </div>

        <div className="mt-2 text-xs cf-muted">
          Consiglio: punta a{" "}
          {business.paidRate30d < 90
            ? "pagare in giornata"
            : "mantenere il flusso"}
          .
        </div>
      </div>

      {/* Next session */}
      <div className="cf-card">
        <div className="text-sm font-semibold cf-text">Prossima sessione</div>
        <div className="mt-1 text-xs cf-muted">Pianificata</div>

        {performance.nextSession ? (
          <div className="mt-4">
            <div className="text-base font-semibold cf-text">
              {fmtDayTime(new Date(performance.nextSession.startsAt))}
            </div>
            <div className="mt-1 text-xs cf-muted">
              {String(performance.nextSession.locationType)}
              {performance.nextSession.location
                ? ` • ${performance.nextSession.location}`
                : ""}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="cf-chip">
                {performance.nextSession.priceCents != null
                  ? eur(performance.nextSession.priceCents)
                  : "—"}
              </span>
              <span className="cf-chip">
                {performance.nextSession.paidAt ? "Pagata" : "Da pagare"}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm cf-muted">
            Nessuna sessione pianificata.
          </div>
        )}
      </div>

      {/* Package */}
      <div className="cf-card">
        <div className="text-sm font-semibold cf-text">Pacchetto / Crediti</div>
        <div className="mt-1 text-xs cf-muted">Stato attuale</div>

        {business.activePackage ? (
          <div className="mt-4">
            <div className="text-base font-semibold cf-text">
              {business.activePackage.name}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="cf-chip">
                Rimanenti:{" "}
                <span className="font-semibold">
                  {business.activePackage.remainingSessions ?? "—"}
                </span>
              </span>
              {business.activePackage.expiresAt ? (
                <span className="cf-chip">
                  Scade:{" "}
                  {new Date(
                    business.activePackage.expiresAt
                  ).toLocaleDateString("it-IT")}
                  {typeof business.activePackage.expiresInDays === "number"
                    ? ` • ${business.activePackage.expiresInDays}g`
                    : ""}
                </span>
              ) : (
                <span className="cf-chip">Nessuna scadenza</span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm cf-muted">Nessun pacchetto attivo.</div>
        )}
      </div>

      {/* Sessions this week */}
      <div className="cf-card">
        <div className="text-sm font-semibold cf-text">Allenamenti (7g)</div>
        <div className="mt-1 text-xs cf-muted">Sessioni completate</div>

        <div className="mt-4 text-2xl font-semibold cf-text">
          {performance.completed7}
        </div>
        <div className="mt-2 text-xs cf-muted">
          Target tipico: 2–4 / settimana (dipende dal programma).
        </div>
      </div>

      {/* Weight trend */}
      <div className="cf-card lg:col-span-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold cf-text">
              Trend peso (90g)
            </div>
            <div className="mt-1 text-xs cf-muted">
              Da check-in / misurazioni
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold cf-text">
              {performance.weight.last != null
                ? `${performance.weight.last.toFixed(1).replace(".", ",")} kg`
                : "—"}
            </div>
            <div className="text-xs cf-muted">
              Δ30g:{" "}
              {performance.weight.delta30 == null
                ? "—"
                : `${
                    performance.weight.delta30 > 0 ? "+" : ""
                  }${performance.weight.delta30
                    .toFixed(1)
                    .replace(".", ",")} kg`}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border cf-surface p-3">
          {values.length >= 2 ? (
            <svg viewBox="0 0 220 46" className="w-full h-[56px]">
              <path
                d={path}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.85"
              />
            </svg>
          ) : (
            <div className="text-sm cf-muted">
              Inserisci almeno 2 check-in per vedere il grafico.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border cf-surface p-3">
      <div className="text-[11px] cf-faint">{label}</div>
      <div className="mt-1 text-lg font-semibold cf-text">{value}</div>
    </div>
  );
}
