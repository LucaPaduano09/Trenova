import { prisma } from "@/lib/db";
import { requireTenantFromSession } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import * as React from "react";
import { Suspense } from "react";

import { getClientOverviewStats } from "@/actions/clientOverview";
import { MiniOverviewCard } from "./_components/MiniOverviewCard";

import ClientTabSection from "./_components/ClientTabSection";
import ClientTabSkeleton from "./_components/ClientTabSkeleton";

export const revalidate = 100;

type TabKey = "overview" | "packages" | "sessions" | "progress" | "workouts";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?:
    | { tab?: string; flash?: string; sid?: string }
    | Promise<{ tab?: string; flash?: string; sid?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const flash = sp?.flash;
  const sid = sp?.sid;

  const activeTab: TabKey =
  (sp?.tab as TabKey) &&
  ["overview", "packages", "sessions", "progress", "workouts"].includes(
    sp?.tab as string
  )
    ? (sp?.tab as TabKey)
    : "overview";

  const { tenant } = await requireTenantFromSession();

  const client = await prisma.client.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug } },
    select: {
      id: true,
      slug: true,
      fullName: true,
      email: true,
      phone: true,
      notes: true,
      status: true,
      createdAt: true,
    },
  });

  if (!client) return notFound();

  // KPI card (sempre)
  const now = new Date();
  const from30 = new Date();
  from30.setDate(from30.getDate() - 30);

  const stats30 = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      clientId: client.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { gte: from30, lte: now },
    },
    select: { paidAt: true, priceCents: true },
  });

  const nextAppt = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      clientId: client.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { gte: now },
      status: "SCHEDULED",
    },
    orderBy: { startsAt: "asc" },
    select: { startsAt: true },
  });

  const lastAppt = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      clientId: client.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      endsAt: { lt: now },
    },
    orderBy: { endsAt: "desc" },
    select: { endsAt: true, startsAt: true },
  });

  const total30 = stats30.length;
  const paid30 = stats30.filter((s) => !!s.paidAt);
  const paidRate30 = total30 ? Math.round((paid30.length / total30) * 100) : 0;
  const revenue30 = paid30.reduce((sum, s) => sum + (s.priceCents ?? 0), 0);

  const kpi = {
    lastAt: lastAppt?.endsAt ?? lastAppt?.startsAt ?? null,
    nextAt: nextAppt?.startsAt ?? null,
    revenue30,
    paidRate30,
  };

  // (opzionale) overviewStats SOLO se overview è attivo
  // Se ti serve altrove, puoi tenerlo qui.
  // Se non serve più, puoi rimuoverlo del tutto.
  if (activeTab === "overview") {
    await getClientOverviewStats(client.id);
  }

  const avatar = initials(client.fullName || "Client");

  return (
    <div className="space-y-6 cf-text">
      {/* Top hero */}
      <div className="cf-card cf-hairline p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="flex items-start gap-4">
            <div className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border bg-white/70 text-sm font-semibold cf-text shadow-sm dark:bg-[#111a2e]/70 dark:border-white/10">
              <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.08),transparent_55%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_55%)]" />
              <span className="relative text-base">{avatar}</span>
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {client.fullName}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm cf-muted">
                <span className="truncate">{client.email ?? "—"}</span>
                <span className="opacity-30">•</span>
                <span className="truncate">{client.phone ?? "—"}</span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <StatusPill status={client.status} />
                <Link
                  href="/app/clients"
                  className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-faint cf-text hover:border-black dark:hover:border-white"
                >
                  Indietro
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <MiniOverviewCard client={client} kpi={kpi} />
        </div>
      </div>

      {/* Tabs (URL-driven) */}
      <div className="sticky top-6 z-10 cf-surface cf-hairline p-2">
        <div className="flex flex-wrap gap-2">
          <TabLink
            href={`/app/clients/${client.slug}?tab=overview`}
            active={activeTab === "overview"}
          >
            Panoramica
          </TabLink>
          <TabLink
            href={`/app/clients/${client.slug}?tab=packages`}
            active={activeTab === "packages"}
          >
            Pacchetti
          </TabLink>
          <TabLink
            href={`/app/clients/${client.slug}?tab=workouts`}
            active={activeTab === "workouts"}
          >
            Workout
          </TabLink>
          <TabLink
            href={`/app/clients/${client.slug}?tab=sessions`}
            active={activeTab === "sessions"}
          >
            Sessioni
          </TabLink>
          <TabLink
            href={`/app/clients/${client.slug}?tab=progress`}
            active={activeTab === "progress"}
          >
            Progressi
          </TabLink>
        </div>
      </div>

      <Suspense
        key={activeTab}
        fallback={<ClientTabSkeleton tab={activeTab} />}
      >
        <ClientTabSection
          tenantId={tenant.id}
          client={{
            id: client.id,
            slug: client.slug,
            createdAt: client.createdAt,
            notes: client.notes ?? null,
          }}
          activeTab={activeTab}
          flash={flash}
          sid={sid}
        />
      </Suspense>
    </div>
  );
}

/* ---------- UI bits ---------- */

function StatusPill({ status }: { status: string }) {
  const isActive = status.toUpperCase() === "ACTIVE";
  return (
    <span className={["cf-chip", isActive ? "" : "opacity-80"].join(" ")}>
      {status}
    </span>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={[
        "rounded-2xl px-4 py-2 text-sm transition cf-surface cf-text hover:border-black hover:dark:border-white",
        active ? "border-1 border-black dark:border-white" : "",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
