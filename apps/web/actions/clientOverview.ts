"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function diffDays(a: Date, b: Date) {

  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function getClientOverviewStats(clientId: string) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!client) return null;

  const now = new Date();

  const from28 = addDays(now, -28);

  const appts28 = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      clientId,
      startsAt: { gte: from28, lte: now },
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    select: { status: true },
  });

  const scheduled = appts28.filter((a) => a.status === "SCHEDULED").length;
  const completed = appts28.filter((a) => a.status === "COMPLETED").length;
  const canceled = appts28.filter((a) => a.status === "CANCELED").length;
  const total28 = scheduled + completed + canceled;
  const complianceRate =
    total28 > 0 ? Math.round((completed / total28) * 100) : 0;

  const nextSession = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      clientId,
      status: "SCHEDULED",
      startsAt: { gte: now },
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      locationType: true,
      location: true,
      priceCents: true,
      paidAt: true,
    },
  });

  const from7 = addDays(now, -7);
  const completed7 = await prisma.appointment.count({
    where: {
      tenantId: tenant.id,
      clientId,
      status: "COMPLETED",
      startsAt: { gte: from7, lte: now },
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
  });

  const from90 = addDays(now, -90);
  const weights90 = await prisma.bodyMetricsEntry.findMany({
    where: {
      tenantId: tenant.id,
      clientId,
      measuredAt: { gte: from90, lte: now },
    },
    orderBy: { measuredAt: "asc" },
    select: { measuredAt: true, weightG: true },
  });

  const weightPoints = weights90
    .filter((x) => typeof x.weightG === "number" && x.weightG! > 0)
    .map((x) => ({
      date: x.measuredAt,
      weightKg: Math.round((x.weightG! / 1000) * 10) / 10,
    }));

  const lastWeight = weightPoints.length
    ? weightPoints[weightPoints.length - 1].weightKg
    : null;

  const from30 = addDays(now, -30);
  const w30 = weightPoints.filter((p) => p.date >= from30);
  const delta30 =
    w30.length >= 2
      ? Math.round((w30[w30.length - 1].weightKg - w30[0].weightKg) * 10) / 10
      : null;

  const appts30 = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      clientId,
      startsAt: { gte: from30, lte: now },
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],

    },
    select: { priceCents: true, paidAt: true },
  });

  const withPrice = appts30.filter(
    (a) => typeof a.priceCents === "number" && a.priceCents! >= 0
  );
  const paid = withPrice.filter((a) => a.paidAt != null);
  const revenue30dCents = paid.reduce((sum, a) => sum + (a.priceCents ?? 0), 0);
  const paidRate30d = withPrice.length
    ? Math.round((paid.length / withPrice.length) * 100)
    : 0;

  const activePackage = await prisma.packagePurchase.findFirst({
    where: {
      tenantId: tenant.id,
      clientId,
      active: true,
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      remainingSessions: true,
      expiresAt: true,
      package: { select: { name: true, type: true } },
    },
  });

  const packageExpiresInDays = activePackage?.expiresAt
    ? diffDays(activePackage.expiresAt, now)
    : null;

  const lastActivity = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      clientId,
      status: { in: ["SCHEDULED", "COMPLETED"] },
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    orderBy: { startsAt: "desc" },
    select: { startsAt: true },
  });

  const inactiveDays = lastActivity?.startsAt
    ? Math.max(0, diffDays(now, lastActivity.startsAt))
    : null;

  const isAtRisk = inactiveDays == null ? true : inactiveDays >= 21;

  return {
    performance: {
      compliance: {
        total28,
        completed,
        scheduled,
        canceled,
        rate: complianceRate,
      },
      inactivity: {
        lastActivityAt: lastActivity?.startsAt ?? null,
        inactiveDays,
        atRisk: isAtRisk,
      },
      nextSession,
      completed7,
      weight: { points: weightPoints, last: lastWeight, delta30 },
    },
    business: {
      revenue30dCents,
      paidRate30d,
      activePackage: activePackage
        ? {
            name: activePackage.package.name,
            type: activePackage.package.type,
            remainingSessions: activePackage.remainingSessions ?? null,
            expiresAt: activePackage.expiresAt ?? null,
            expiresInDays: packageExpiresInDays,
          }
        : null,
    },
  };
}
