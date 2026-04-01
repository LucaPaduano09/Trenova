"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useSearchParams } from "next/navigation";

import Heatmap from "./Heatmap";
import type { DashboardStats } from "../../../actions/dashboard";
import DashboardCalendar from "./DashboardCalendat";

type Props = {
  data: DashboardStats;
  workoutTemplates: { id: string; title: string }[];
  monthStartISO?: string;
};

function formatMoneyEUR(cents: number) {
  const eur = cents / 100;
  return eur.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

const COLORS = {
  completed: "#10B981",
  scheduled: "#3B82F6",
  canceled: "#F43F5E",
  neutral: "#94A3B8",
  revenue: "#10B981",
};

const COMPLIANCE_COLORS: Record<string, string> = {
  Completate: COLORS.completed,
  Schedulate: COLORS.scheduled,
  Cancellate: COLORS.canceled,
};

const MIX_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#A855F7",
  "#F43F5E",
  "#06B6D4",
  "#84CC16",
  "#64748B",
];

export default function DashboardCharts({
  data,
  workoutTemplates,
  monthStartISO,
}: Props) {
  const { kpi, charts } = data;
  const searchParams = useSearchParams();

  const monthISO =
    searchParams?.get("month") ??
    monthStartISO ??
    toISODate(startOfMonth(new Date()));

  const compliancePie = [
    { name: "Completate", value: charts.compliance.completed },
    { name: "Schedulate", value: charts.compliance.scheduled },
    { name: "Cancellate", value: charts.compliance.canceled },
  ];

  const complianceTotal = compliancePie.reduce((sum, item) => sum + item.value, 0);
  const complianceCompleted =
    compliancePie.find((item) => item.name === "Completate")?.value ?? 0;
  const complianceRate = complianceTotal
    ? Math.round((complianceCompleted / complianceTotal) * 100)
    : 0;

  const packageMixTotal = charts.packageMix.reduce(
    (sum, item) => sum + item.count,
    0
  );
  const packageMixData = charts.packageMix.map((item, index) => ({
    ...item,
    fill: MIX_COLORS[index % MIX_COLORS.length],
    percent: packageMixTotal ? Math.round((item.count / packageMixTotal) * 100) : 0,
  }));

  return (
    <div className="mt-4 grid gap-5 sm:mt-6 sm:gap-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <section className="relative overflow-hidden rounded-[30px] border cf-surface px-5 py-5 sm:px-6 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_75%_18%,rgba(16,185,129,0.12),transparent_26%)]" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
                  Snapshot
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight cf-text sm:text-[2rem]">
                  Operatività e performance del mese
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 cf-muted">
                  Una cabina di regia per capire cosa sta muovendo sessioni,
                  ricavi, carico attivo e continuità del business.
                </p>
              </div>

              <div className="rounded-[24px] border cf-surface bg-white/70 px-4 py-3 text-sm capitalize cf-text shadow-[0_14px_40px_rgba(15,23,42,0.06)] dark:bg-white/[0.04] dark:shadow-none">
                {new Intl.DateTimeFormat("it-IT", {
                  month: "long",
                  year: "numeric",
                }).format(new Date(monthISO))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <MetricShell
                label="Clienti attivi"
                value={String(kpi.clientsActive)}
                helper="Base attiva"
              />
              <MetricShell
                label="Sessioni oggi"
                value={String(kpi.sessionsToday)}
                helper={`Settimana ${kpi.sessionsWeek} • Mese ${kpi.sessionsMonth}`}
              />
              <MetricShell
                label="Revenue mese"
                value={formatMoneyEUR(kpi.revenueMonthCents)}
                helper="Sessioni pagate"
              />
              <MetricShell
                label="Crediti rimanenti"
                value={String(kpi.creditsRemaining)}
                helper="Bundle attivi"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border cf-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
                Quick pulse
              </div>
              <div className="mt-2 text-lg font-semibold cf-text">
                Traiettoria business
              </div>
            </div>
            <div className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-200">
              Live
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <PulseCard
              title="Volume settimanale"
              value={`${data.kpi.weeklyVolumeKg.toLocaleString()} kg`}
              tone="blue"
            />
            <PulseCard
              title="Abbonamenti"
              value={`€ ${data.kpi.mrr.toLocaleString()}`}
              tone="emerald"
            />
            <PulseCard
              title="LTV medio cliente"
              value={`€ ${(data.kpi.ltvAverage / 100).toFixed(2)}`}
              tone="slate"
            />
          </div>
        </section>
      </div>

      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain sm:overflow-visible">
        <div className="min-w-0 sm:min-w-0">
          <DashboardCalendar
            monthStartISO={monthISO}
            days={data.operational.calendar}
            clients={data.operational.clientsLite}
            workoutTemplates={workoutTemplates}
          />
        </div>
      </div>

      <section className="rounded-[30px] border cf-surface p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
              Heatmap
            </div>
            <div className="mt-1 text-lg font-semibold cf-text">
              Intensità operativa
            </div>
          </div>
          <div className="text-sm cf-muted">
            Distribuzione delle attività nel tempo
          </div>
        </div>
        <Heatmap days={data.charts.heatmap} />
      </section>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="cf-card p-4 sm:p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-sm font-semibold cf-text">
              Sessioni (ultimi 30 giorni)
            </h2>
            <div className="text-xs cf-muted">Totali + completate</div>
          </div>

          <div className="mt-4 h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.sessionsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  name="Totali"
                  stroke={COLORS.scheduled}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completate"
                  stroke={COLORS.completed}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cf-card p-4 sm:p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-sm font-semibold cf-text">
              Revenue (ultime 8 settimane)
            </h2>
            <div className="text-xs cf-muted">Somma pagamenti</div>
          </div>

          <div className="mt-4 h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueByWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekStart" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number | string | undefined) =>
                    formatMoneyEUR(Number(v ?? 0))
                  }
                />
                <Legend />
                <Bar
                  dataKey="revenueCents"
                  name="Revenue"
                  fill={COLORS.revenue}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="cf-card p-4 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold cf-text">Mix pacchetti (top)</h2>
              <p className="mt-1 text-xs cf-muted">
                Distribuzione degli acquisti per tipologia
              </p>
            </div>
            <div className="text-xs cf-muted">
              {packageMixTotal} acquisti tracciati
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.5fr)] lg:items-center">
            <div className="h-64 sm:h-72">
              {packageMixData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={packageMixData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={64}
                      outerRadius={92}
                      paddingAngle={3}
                      stroke="rgba(255,255,255,0.10)"
                      labelLine={false}
                      label={false}
                    >
                      {packageMixData.map((item) => (
                        <Cell key={item.name} fill={item.fill} />
                      ))}
                    </Pie>

                    <text
                      x="50%"
                      y="47%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="currentColor"
                      className="cf-text"
                      style={{ fontSize: 26, fontWeight: 700 }}
                    >
                      {packageMixData.length}
                    </text>
                    <text
                      x="50%"
                      y="57%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="currentColor"
                      className="cf-muted"
                      style={{ fontSize: 11, fontWeight: 500 }}
                    >
                      tipi top
                    </text>

                    <Tooltip
                      formatter={(value: number | string | undefined, _name, item: any) => [
                        `${Number(value ?? 0)} acquisti`,
                        `${item?.payload?.name ?? ""} • ${item?.payload?.percent ?? 0}%`,
                      ]}
                      contentStyle={{
                        borderRadius: 18,
                        border: "1px solid rgba(15,23,42,0.16)",
                        background: "rgba(15,23,42,0.92)",
                        color: "#F8FAFC",
                        boxShadow: "0 18px 40px rgba(15,23,42,0.20)",
                      }}
                      itemStyle={{ color: "#F8FAFC" }}
                      labelStyle={{ color: "#CBD5E1" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 text-sm cf-muted">
                  Nessun pacchetto da mostrare
                </div>
              )}
            </div>

            <div className="space-y-3 lg:max-w-[280px]">
              {packageMixData.length > 0 ? (
                packageMixData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white/30 px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium cf-text">
                        {item.name}
                      </div>
                      <div className="mt-0.5 text-xs cf-muted">
                        {item.count} acquisti
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold cf-text">
                        {item.percent}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm cf-muted">
                  Quando iniziano gli acquisti, qui vedremo la ripartizione dei
                  pacchetti più usati.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cf-card p-4 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold cf-text">
                Compliance (ultimi 30 giorni)
              </h2>
              <p className="mt-1 text-xs cf-muted">
                Incidenza delle sessioni completate sul totale pianificato
              </p>
            </div>
            <div className="text-xs cf-muted">
              {complianceTotal} sessioni monitorate
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.28fr)_minmax(200px,0.72fr)] lg:items-center">
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compliancePie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={66}
                    outerRadius={94}
                    paddingAngle={3}
                    stroke="rgba(255,255,255,0.10)"
                    labelLine={false}
                    label={false}
                  >
                    {compliancePie.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={COMPLIANCE_COLORS[entry.name] ?? COLORS.neutral}
                      />
                    ))}
                  </Pie>

                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="currentColor"
                    className="cf-text"
                    style={{ fontSize: 30, fontWeight: 700 }}
                  >
                    {complianceRate}%
                  </text>
                  <text
                    x="50%"
                    y="57%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="currentColor"
                    className="cf-muted"
                    style={{ fontSize: 11, fontWeight: 500 }}
                  >
                    completate
                  </text>

                  <Tooltip
                    formatter={(value: number | string | undefined, name) => [
                      `${Number(value ?? 0)} sessioni`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: 18,
                      border: "1px solid rgba(15,23,42,0.16)",
                      background: "rgba(15,23,42,0.92)",
                      color: "#F8FAFC",
                      boxShadow: "0 18px 40px rgba(15,23,42,0.20)",
                    }}
                    itemStyle={{ color: "#F8FAFC" }}
                    labelStyle={{ color: "#CBD5E1" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4 lg:max-w-[290px]">
              <div className="rounded-2xl border border-black/5 bg-white/30 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-xs uppercase tracking-[0.18em] cf-faint">
                  Tasso attuale
                </div>
                <div className="mt-2 text-3xl font-semibold cf-text">
                  {complianceRate}%
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(complianceRate, 4)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {compliancePie.map((item) => {
                  const percent = complianceTotal
                    ? Math.round((item.value / complianceTotal) * 100)
                    : 0;

                  return (
                    <div
                      key={item.name}
                      className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white/30 px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            COMPLIANCE_COLORS[item.name] ?? COLORS.neutral,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium cf-text">
                          {item.name}
                        </div>
                        <div className="mt-0.5 text-xs cf-muted">
                          {item.value} sessioni
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold cf-text">
                        {percent}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <section className="rounded-[30px] border cf-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
                Agenda
              </div>
              <h2 className="mt-2 text-lg font-semibold cf-text">
                Prossime sessioni
              </h2>
            </div>
            <div className="text-sm cf-muted">
              {data.operational.upcomingAppointments.length} in arrivo
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.operational.upcomingAppointments.length > 0 ? (
              data.operational.upcomingAppointments.map((a: any) => (
                <div
                  key={a.id}
                  className="rounded-[24px] border cf-surface px-4 py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold cf-text">
                        {a.client.fullName}
                      </div>
                      <div className="mt-1 text-sm cf-muted">
                        {new Date(a.startsAt).toLocaleString("it-IT")}
                      </div>
                    </div>
                    <div className="rounded-full border cf-surface px-3 py-1 text-xs cf-faint">
                      In calendario
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-black/10 px-4 py-8 text-sm cf-muted dark:border-white/10">
                Nessuna sessione imminente da mostrare.
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-[30px] border cf-surface p-5 sm:p-6">
            <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
              Rischio churn
            </div>
            <h2 className="mt-2 text-lg font-semibold cf-text">
              Clienti inattivi
            </h2>
            <div className="mt-3 text-4xl font-semibold cf-text">
              {data.operational.clientsInactive.length}
            </div>
            <div className="mt-2 text-sm leading-6 cf-muted">
              clienti senza sessioni negli ultimi 14 giorni.
            </div>
          </section>

          <section className="rounded-[30px] border cf-surface p-5 sm:p-6">
            <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
              Business mix
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricShell
                label="MRR"
                value={`€ ${data.kpi.mrr.toLocaleString()}`}
                helper="Abbonamenti"
                compact
              />
              <MetricShell
                label="LTV medio"
                value={`€ ${(data.kpi.ltvAverage / 100).toFixed(2)}`}
                helper="Per cliente"
                compact
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricShell({
  label,
  value,
  helper,
  compact = false,
}: {
  label: string;
  value: string;
  helper: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[24px] border cf-surface bg-white/70 shadow-[0_14px_40px_rgba(15,23,42,0.06)] dark:bg-white/[0.04] dark:shadow-none",
        compact ? "px-4 py-4" : "px-4 py-4 sm:px-5 sm:py-5",
      ].join(" ")}
    >
      <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight cf-text">
        {value}
      </div>
      <div className="mt-1 text-sm cf-muted">{helper}</div>
    </div>
  );
}

function PulseCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "blue" | "emerald" | "slate";
}) {
  const toneClass =
    tone === "blue"
      ? "from-[#1d4ed8]/12 to-transparent"
      : tone === "emerald"
        ? "from-emerald-500/12 to-transparent"
        : "from-slate-500/12 to-transparent";

  return (
    <div
      className={`rounded-[24px] border cf-surface bg-gradient-to-r ${toneClass} px-4 py-4`}
    >
      <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
        {title}
      </div>
      <div className="mt-2 text-xl font-semibold cf-text">{value}</div>
    </div>
  );
}
