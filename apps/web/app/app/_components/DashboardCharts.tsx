"use client";

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
import Heatmap from "./Heatmap";
import type { DashboardStats } from "../../../actions/dashboard";
type Props = {
  data: DashboardStats;
};

function formatMoneyEUR(cents: number) {
  const eur = cents / 100;
  return eur.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

// Palette Kinetiq (modifica se vuoi)
const COLORS = {
  completed: "#10B981", // emerald
  scheduled: "#3B82F6", // blue
  canceled: "#F43F5E", // rose
  neutral: "#94A3B8", // slate
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

export default function DashboardCharts({ data }: Props) {
  const { kpi, charts } = data;

  const compliancePie = [
    { name: "Completate", value: charts.compliance.completed },
    { name: "Schedulate", value: charts.compliance.scheduled },
    { name: "Cancellate", value: charts.compliance.canceled },
  ];

  return (
    <div className="mt-6 grid gap-6">
      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cf-card">
          <div className="text-xs cf-muted">Clienti attivi</div>
          <div className="mt-1 text-2xl font-semibold cf-text">
            {kpi.clientsActive}
          </div>
        </div>

        <div className="cf-card">
          <div className="text-xs cf-muted">Sessioni oggi</div>
          <div className="mt-1 text-2xl font-semibold cf-text">
            {kpi.sessionsToday}
          </div>
          <div className="mt-1 text-xs cf-muted">
            Settimana: {kpi.sessionsWeek} • Mese: {kpi.sessionsMonth}
          </div>
        </div>

        <div className="cf-card">
          <div className="text-xs cf-muted">Revenue mese</div>
          <div className="mt-1 text-2xl font-semibold cf-text">
            {formatMoneyEUR(kpi.revenueMonthCents)}
          </div>
          <div className="mt-1 text-xs cf-muted">Da sessioni pagate</div>
        </div>

        <div className="cf-card">
          <div className="text-xs cf-muted">Crediti rimanenti</div>
          <div className="mt-1 text-2xl font-semibold cf-text">
            {kpi.creditsRemaining}
          </div>
          <div className="mt-1 text-xs cf-muted">Somma bundle attivi</div>
        </div>
      </div>

      <Heatmap days={data.charts.heatmap} />

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions line */}
        <div className="cf-card">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold cf-text">
              Sessioni (ultimi 30 giorni)
            </h2>
            <div className="text-xs cf-muted">Totali + completate</div>
          </div>

          <div className="mt-4 h-72">
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

        {/* Revenue bar */}
        <div className="cf-card">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold cf-text">
              Revenue (ultime 8 settimane)
            </h2>
            <div className="text-xs cf-muted">Somma pagamenti</div>
          </div>

          <div className="mt-4 h-72">
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Package mix pie */}
        <div className="cf-card">
          <h2 className="text-sm font-semibold cf-text">Mix pacchetti (top)</h2>
          <div className="mt-4 h-72">
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

        {/* Compliance pie */}
        <div className="cf-card">
          <h2 className="text-sm font-semibold cf-text">
            Compliance (ultimi 30 giorni)
          </h2>
          <div className="mt-4 h-72">
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
                  label={false} // ✅ IMPORTANT: niente label esterne
                >
                  {compliancePie.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={COMPLIANCE_COLORS[entry.name] ?? COLORS.neutral}
                    />
                  ))}
                </Pie>

                {/* ✅ testo centrale: percentuale completate */}
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
      <div className="cf-card">
        <h2 className="text-sm font-semibold cf-text">Prossime sessioni</h2>
        <ul className="mt-3 space-y-2 text-sm cf-muted">
          {data.operational.upcomingAppointments.map((a: any) => (
            <li key={a.id}>
              {new Date(a.startsAt).toLocaleString()} — {a.client.fullName}
            </li>
          ))}
        </ul>
      </div>

      <div className="cf-card">
        <h2 className="text-sm font-semibold cf-text">Clienti inattivi</h2>
        <div className="mt-2 text-sm cf-muted">
          {data.operational.clientsInactive.length} clienti senza sessioni negli
          ultimi 14 giorni
        </div>
      </div>

      <div className="cf-card">
        <div className="text-xs cf-muted">Volume settimanale</div>
        <div className="mt-1 text-2xl font-semibold cf-muted">
          {data.kpi.weeklyVolumeKg.toLocaleString()} kg
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="cf-card">
          <div className="text-xs cf-muted">Abbonamenti</div>
          <div className="mt-1 text-2xl font-semibold cf-muted">
            € {data.kpi.mrr.toLocaleString()}
          </div>
        </div>

        <div className="cf-card">
          <div className="text-xs cf-muted">LTV medio cliente</div>
          <div className="mt-1 text-2xl font-semibold cf-muted">
            € {(data.kpi.ltvAverage / 100).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
