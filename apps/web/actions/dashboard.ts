"use server";

import { prisma } from "@/lib/db";
import { requireTenantFromSession } from "@/lib/tenant";
import { unstable_cache, revalidateTag } from "next/cache";

type DayPoint = {
  date: string;
  sessions: number;
  completed: number;
  canceled: number;
};
type WeekPoint = { weekStart: string; revenueCents: number };
type PackageMixPoint = { name: string; count: number };

/** ---------------- date helpers ---------------- */

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function toISODate(d: Date) {
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  x.setDate(x.getDate() + diff);
  return x;
}

/** ---------------- caching ---------------- */

// tag per invalidare cache dashboard per tenant
function dashboardTag(tenantId: string) {
  return `dashboard:${tenantId}`;
}

// cache builder per-tenant (così tags può includere tenantId)
function getCachedDashboardFn(tenantId: string) {
  return unstable_cache(
    async () => buildDashboardStats(tenantId),
    // cache key
    [`dashboard-stats:${tenantId}`],
    // cache policy
    { revalidate: 30, tags: [dashboardTag(tenantId)] }
  );
}

/**
 * Chiamala dalle actions che modificano appointments / payments / workouts
 * es: createSession/updateSession/duplicateSession ecc.
 */
export async function invalidateDashboardStatsCache(tenantId: string) {
  revalidateTag(dashboardTag(tenantId), "max");
}

/** ---------------- core builder (NO auth inside) ---------------- */

async function buildDashboardStats(tenantId: string) {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  const last30Start = addDays(today, -29);
  const weekStart = startOfWeekMonday(now);
  const nextWeekStart = addDays(weekStart, 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // ============ KPI (parallel) ============
  const clientsActivePromise = prisma.client.count({
    where: {
      tenantId,
      status: "ACTIVE",
      OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
    },
  });

  const sessionsTodayPromise = prisma.appointment.count({
    where: {
      tenantId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { gte: today, lt: tomorrow },
    },
  });

  const sessionsWeekPromise = prisma.appointment.count({
    where: {
      tenantId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { gte: weekStart, lt: nextWeekStart },
    },
  });

  const sessionsMonthPromise = prisma.appointment.count({
    where: {
      tenantId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { gte: monthStart, lt: nextMonthStart },
    },
  });

  const paidAppointmentsMonthPromise = prisma.appointment.findMany({
    where: {
      tenantId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      paidAt: { gte: monthStart, lt: nextMonthStart },
      priceCents: { not: null },
    },
    select: { priceCents: true },
  });

  const activePurchasesPromise = prisma.packagePurchase.findMany({
    where: { tenantId, active: true },
    select: { remainingSessions: true },
  });

  // ============ CHARTS BASE (parallel) ============
  const appointments30Promise = prisma.appointment.findMany({
    where: {
      tenantId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { gte: last30Start, lt: tomorrow },
    },
    select: { startsAt: true, status: true },
    orderBy: { startsAt: "asc" },
  });

  const paidAppointments8wPromise = prisma.appointment.findMany({
    where: {
      tenantId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      paidAt: { not: null },
      priceCents: { not: null },
    },
    select: { paidAt: true, priceCents: true },
  });

  const packageMixPromise = prisma.packagePurchase.findMany({
    where: { tenantId },
    select: { package: { select: { name: true } } },
  });

  // ============ OPERATIONAL (parallel) ============
  const upcomingAppointmentsPromise = prisma.appointment.findMany({
    where: {
      tenantId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { gte: now },
      status: "SCHEDULED",
    },
    include: {
      client: { select: { fullName: true } },
    },
    orderBy: { startsAt: "asc" },
    take: 5,
  });

  const inactiveThreshold = addDays(today, -14);
  const clientsInactivePromise = prisma.client.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      appointments: {
        none: {
          status: "COMPLETED",
          startsAt: { gte: inactiveThreshold },
        },
      },
    },
    select: { id: true, fullName: true },
  });

  const workoutLogsWeekPromise = prisma.workoutSetLog.findMany({
    where: {
      session: {
        tenantId,
        updatedAt: { gte: weekStart },
      },
    },
    select: { weight: true, reps: true },
  });

  const monthlyActivePromise = prisma.packagePurchase.findMany({
    where: {
      tenantId,
      active: true,
      package: { type: "MONTHLY" },
    },
    include: {
      package: { select: { monthlyPrice: true } },
    },
  });

  const paidAppointmentsAllPromise = prisma.appointment.findMany({
    where: {
      tenantId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      paidAt: { not: null },
      priceCents: { not: null },
    },
    select: { clientId: true, priceCents: true },
  });

  const heatmapDays = 90;
  const heatmapStart = addDays(today, -(heatmapDays - 1));
  const completedForHeatmapPromise = prisma.appointment.findMany({
    where: {
      tenantId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      status: "COMPLETED",
      startsAt: { gte: heatmapStart, lt: tomorrow },
    },
    select: { startsAt: true },
  });

  // calendar mese corrente
  const calMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const calNextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const calendarAppointmentsPromise = prisma.appointment.findMany({
    where: {
      tenantId,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { gte: calMonthStart, lt: calNextMonthStart },
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      client: { select: { fullName: true, slug: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const clientsLitePromise = prisma.client.findMany({
    where: { tenantId, status: "ACTIVE" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const [
    clientsActive,
    sessionsToday,
    sessionsWeek,
    sessionsMonth,
    paidAppointmentsMonth,
    activePurchases,
    appointments30,
    paidAppointments8w,
    packageMix,
    upcomingAppointments,
    clientsInactive,
    workoutLogsWeek,
    monthlyActive,
    paidAppointmentsAll,
    completedForHeatmap,
    calendarAppointments,
    clientsLite,
  ] = await Promise.all([
    clientsActivePromise,
    sessionsTodayPromise,
    sessionsWeekPromise,
    sessionsMonthPromise,
    paidAppointmentsMonthPromise,
    activePurchasesPromise,
    appointments30Promise,
    paidAppointments8wPromise,
    packageMixPromise,
    upcomingAppointmentsPromise,
    clientsInactivePromise,
    workoutLogsWeekPromise,
    monthlyActivePromise,
    paidAppointmentsAllPromise,
    completedForHeatmapPromise,
    calendarAppointmentsPromise,
    clientsLitePromise,
  ]);

  // ============ compute ============
  const revenueMonthCents = paidAppointmentsMonth.reduce(
    (sum, a) => sum + (a.priceCents ?? 0),
    0
  );

  const creditsRemaining = activePurchases.reduce(
    (sum, p) => sum + (p.remainingSessions ?? 0),
    0
  );

  // Sessions by day (last 30)
  const dayMap = new Map<string, DayPoint>();
  for (let i = 0; i < 30; i++) {
    const d = addDays(last30Start, i);
    const key = toISODate(d);
    dayMap.set(key, { date: key, sessions: 0, completed: 0, canceled: 0 });
  }

  for (const a of appointments30) {
    const key = toISODate(a.startsAt);
    const row = dayMap.get(key);
    if (!row) continue;
    row.sessions += 1;
    if (a.status === "COMPLETED") row.completed += 1;
    if (a.status === "CANCELED") row.canceled += 1;
  }

  const sessionsByDay = Array.from(dayMap.values());

  // Compliance donut (last 30)
  const compliance = {
    completed: appointments30.filter((a) => a.status === "COMPLETED").length,
    scheduled: appointments30.filter((a) => a.status === "SCHEDULED").length,
    canceled: appointments30.filter((a) => a.status === "CANCELED").length,
  };

  // Revenue by week (last 8 weeks)
  const weekBuckets: WeekPoint[] = [];
  const start = startOfWeekMonday(addDays(today, -7 * 7)); // current + previous 7 weeks
  for (let i = 0; i < 8; i++) {
    const ws = addDays(start, i * 7);
    weekBuckets.push({ weekStart: toISODate(ws), revenueCents: 0 });
  }

  const weekIndexMap = new Map<string, number>();
  weekBuckets.forEach((b, idx) => weekIndexMap.set(b.weekStart, idx));

  for (const a of paidAppointments8w) {
    if (!a.paidAt) continue;
    const ws = startOfWeekMonday(a.paidAt);
    const key = toISODate(ws);
    const idx = weekIndexMap.get(key);
    if (idx == null) continue;
    weekBuckets[idx].revenueCents += a.priceCents ?? 0;
  }

  // Package mix (top 6)
  const mixMap = new Map<string, number>();
  for (const p of packageMix) {
    const name = p.package?.name ?? "Package";
    mixMap.set(name, (mixMap.get(name) ?? 0) + 1);
  }

  const packageMixTop: PackageMixPoint[] = Array.from(mixMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Weekly volume
  const weeklyVolumeKg = workoutLogsWeek.reduce((sum, log) => {
    return sum + (log.weight ?? 0) * (log.reps ?? 0);
  }, 0);

  // MRR
  const mrr = monthlyActive.reduce((sum, p) => {
    return sum + (p.package.monthlyPrice ?? 0);
  }, 0);

  // LTV avg
  const revenueByClient = new Map<string, number>();
  for (const a of paidAppointmentsAll) {
    revenueByClient.set(
      a.clientId,
      (revenueByClient.get(a.clientId) ?? 0) + (a.priceCents ?? 0)
    );
  }
  const ltvAverage =
    revenueByClient.size === 0
      ? 0
      : Array.from(revenueByClient.values()).reduce((a, b) => a + b, 0) /
        revenueByClient.size;

  // Heatmap 90 days
  const heatmapCountMap = new Map<string, number>();
  for (const a of completedForHeatmap) {
    const key = toISODate(a.startsAt);
    heatmapCountMap.set(key, (heatmapCountMap.get(key) ?? 0) + 1);
  }

  const heatmap: { date: string; count: number }[] = [];
  for (let i = 0; i < heatmapDays; i++) {
    const d = addDays(heatmapStart, i);
    const key = toISODate(d);
    heatmap.push({ date: key, count: heatmapCountMap.get(key) ?? 0 });
  }

  // Calendar by day (current month)
  const calendarByDay = new Map<
    string,
    {
      date: string;
      scheduled: number;
      completed: number;
      canceled: number;
      items: any[];
    }
  >();

  for (const a of calendarAppointments) {
    const key = toISODate(a.startsAt);
    if (!calendarByDay.has(key)) {
      calendarByDay.set(key, {
        date: key,
        scheduled: 0,
        completed: 0,
        canceled: 0,
        items: [],
      });
    }
    const row = calendarByDay.get(key)!;

    row.items.push({
      id: a.id,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      status: a.status,
      client: a.client,
    });

    if (a.status === "SCHEDULED") row.scheduled += 1;
    if (a.status === "COMPLETED") row.completed += 1;
    if (a.status === "CANCELED") row.canceled += 1;
  }

  const calendar = Array.from(calendarByDay.values());

  return {
    kpi: {
      clientsActive,
      sessionsToday,
      sessionsWeek,
      sessionsMonth,
      revenueMonthCents,
      creditsRemaining,
      weeklyVolumeKg,
      mrr,
      ltvAverage,
    },
    charts: {
      sessionsByDay,
      revenueByWeek: weekBuckets,
      packageMix: packageMixTop,
      compliance,
      heatmap,
    },
    operational: {
      upcomingAppointments,
      clientsInactive,
      calendar,
      clientsLite,
    },
  };
}

/** ---------------- public API (auth + cached) ---------------- */

export async function getDashboardStats() {
  const { tenant } = await requireTenantFromSession();
  const cached = getCachedDashboardFn(tenant.id);
  return cached();
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
