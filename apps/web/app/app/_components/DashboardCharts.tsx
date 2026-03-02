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
import { useRouter, useSearchParams } from "next/navigation";

import Heatmap from "./Heatmap";
import type { DashboardStats } from "../../../actions/dashboard";
import DashboardCalendar from "./DashboardCalendat";

type Props = {
  data: DashboardStats;
  workoutTemplates: { id: string; title: string }[];
  /** opzionale: se la page server già lo passa */
  monthStartISO?: string; // YYYY-MM-01
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

// Palette
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

  const router = useRouter();
  const searchParams = useSearchParams();

  // Month ISO “source of truth”: URL > prop > oggi
  const monthISO =
    searchParams?.get("month") ??
    monthStartISO ??
    toISODate(startOfMonth(new Date()));

  const compliancePie = [
    { name: "Completate", value: charts.compliance.completed },
    { name: "Schedulate", value: charts.compliance.scheduled },
    { name: "Cancellate", value: charts.compliance.canceled },
  ];

  function onMonthChangeISO(nextMonthISO: string) {
    // nextMonthISO = YYYY-MM-01
    const sp = new URLSearchParams(searchParams?.toString());
    sp.set("month", nextMonthISO);
    router.push(`?${sp.toString()}`);
    // niente fetch qui: la page server rigenera `data` per quel month
  }

  return (
    <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6">
      {/* KPI */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cf-card p-4 sm:p-6">
          <div className="text-xs cf-muted">Clienti attivi</div>
          <div className="mt-1 text-2xl font-semibold cf-text">
            {kpi.clientsActive}
          </div>
        </div>

        <div className="cf-card p-4 sm:p-6">
          <div className="text-xs cf-muted">Sessioni oggi</div>
          <div className="mt-1 text-2xl font-semibold cf-text">
            {kpi.sessionsToday}
          </div>
          <div className="mt-1 text-xs cf-muted">
            Settimana: {kpi.sessionsWeek} • Mese: {kpi.sessionsMonth}
          </div>
        </div>

        <div className="cf-card p-4 sm:p-6">
          <div className="text-xs cf-muted">Revenue mese</div>
          <div className="mt-1 text-2xl font-semibold cf-text">
            {formatMoneyEUR(kpi.revenueMonthCents)}
          </div>
          <div className="mt-1 text-xs cf-muted">Da sessioni pagate</div>
        </div>

        <div className="cf-card p-4 sm:p-6">
          <div className="text-xs cf-muted">Crediti rimanenti</div>
          <div className="mt-1 text-2xl font-semibold cf-text">
            {kpi.creditsRemaining}
          </div>
          <div className="mt-1 text-xs cf-muted">Somma bundle attivi</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="mt-6 w-full max-w-full overflow-x-auto overscroll-x-contain sm:overflow-visible">
        <div className="min-w-0 sm:min-w-0">
          <DashboardCalendar
            monthStartISO={monthISO}
            onMonthChangeISO={onMonthChangeISO}
            days={data.operational.calendar}
            clients={data.operational.clientsLite}
            workoutTemplates={workoutTemplates}
          />
        </div>
      </div>

      {/* Heatmap */}
      <div className="mt-6 w-full max-w-full">
        <Heatmap days={data.charts.heatmap} />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="cf-card p-4 sm:p-6">
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

        <div className="cf-card p-4 sm:p-6">
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
                <Tooltip formatter={(v: any) => formatMoneyEUR(Number(v))} />
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

      {/* Charts row 2 */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="cf-card p-4 sm:p-6">
          <h2 className="text-sm font-semibold cf-text">Mix pacchetti (top)</h2>
          <div className="mt-4 h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.packageMix}
                  dataKey="count"
                  nameKey="name"
                  outerRadius={110}
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${Math.round((percent ?? 0) * 100)}%`
                  }
                >
                  {charts.packageMix.map((_: any, i: number) => (
                    <Cell
                      key={`mix-${i}`}
                      fill={MIX_COLORS[i % MIX_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cf-card p-4 sm:p-6">
          <h2 className="text-sm font-semibold cf-text">
            Compliance (ultimi 30 giorni)
          </h2>
          <div className="mt-4 h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compliancePie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
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
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontSize: 22, fontWeight: 700 }}
                >
                  {(() => {
                    const total = compliancePie.reduce(
                      (s, x) => s + (x.value || 0),
                      0
                    );
                    const completed =
                      compliancePie.find((x) => x.name === "Completate")
                        ?.value ?? 0;
                    const pct = total
                      ? Math.round((completed / total) * 100)
                      : 0;
                    return `${pct}%`;
                  })()}
                </text>

                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operational */}
      <div className="cf-card p-4 sm:p-6">
        <h2 className="text-sm font-semibold cf-text">Prossime sessioni</h2>
        <ul className="mt-3 space-y-2 text-sm cf-muted">
          {data.operational.upcomingAppointments.map((a: any) => (
            <li key={a.id} className="break-words">
              {new Date(a.startsAt).toLocaleString("it-IT")} —{" "}
              {a.client.fullName}
            </li>
          ))}
        </ul>
      </div>

      <div className="cf-card p-4 sm:p-6">
        <h2 className="text-sm font-semibold cf-text">Clienti inattivi</h2>
        <div className="mt-2 text-sm cf-muted">
          {data.operational.clientsInactive.length} clienti senza sessioni negli
          ultimi 14 giorni
        </div>
      </div>

      <div className="cf-card p-4 sm:p-6">
        <div className="text-xs cf-muted">Volume settimanale</div>
        <div className="mt-1 text-2xl font-semibold cf-muted">
          {data.kpi.weeklyVolumeKg.toLocaleString()} kg
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="cf-card p-4 sm:p-6">
          <div className="text-xs cf-muted">Abbonamenti</div>
          <div className="mt-1 text-2xl font-semibold cf-muted">
            € {data.kpi.mrr.toLocaleString()}
          </div>
        </div>

        <div className="cf-card p-4 sm:p-6">
          <div className="text-xs cf-muted">LTV medio cliente</div>
          <div className="mt-1 text-2xl font-semibold cf-muted">
            € {(data.kpi.ltvAverage / 100).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
