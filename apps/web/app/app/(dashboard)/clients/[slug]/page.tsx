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

  if (activeTab === "overview") {
    await getClientOverviewStats(client.id);
  }

  const avatar = initials(client.fullName || "Client");

  return (
    <div className="space-y-6 cf-text">
      <div className="relative overflow-hidden rounded-[32px] border cf-surface cf-hairline p-6 sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_26%),radial-gradient(circle_at_75%_18%,rgba(16,185,129,0.1),transparent_22%)]" />

        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex items-start gap-4">
            <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-[24px] border cf-surface text-base font-semibold cf-text shadow-sm">
              <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.16),transparent_55%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(125,211,252,0.12),transparent_55%)]" />
              <span className="relative">{avatar}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center rounded-full border cf-surface px-3 py-1 text-[11px] uppercase tracking-[0.16em] cf-faint">
                Cliente workspace
              </div>

              <h1 className="mt-4 truncate text-3xl font-semibold tracking-tight cf-text">
                {client.fullName}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm cf-muted">
                <span className="truncate">{client.email ?? "—"}</span>
                <span className="opacity-30">•</span>
                <span className="truncate">{client.phone ?? "—"}</span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <StatusPill status={client.status} />
                <span className="rounded-full border cf-surface px-3 py-1 text-xs cf-faint">
                  Cliente dal {client.createdAt.toLocaleDateString("it-IT")}
                </span>
                <Link
                  href="/app/clients"
                  className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-faint cf-text hover:border-black dark:hover:border-white"
                >
                  Indietro
                </Link>
              </div>
            </div>
          </div>

          <MiniOverviewCard client={client} kpi={kpi} />
        </div>
      </div>

      <div className="sticky top-6 z-10 rounded-[28px] border cf-surface cf-hairline p-3">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
            Navigazione cliente
          </div>
          <div className="text-xs cf-muted">Panoramica, pacchetti, workout e storico</div>
        </div>

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
        "rounded-2xl px-4 py-2.5 text-sm transition border cf-text",
        active
          ? "bg-gradient-to-r from-[#0f2747] via-[#12305a] to-[#0f2747] text-white shadow-[0_14px_36px_rgba(15,39,71,0.2)] dark:border-white/20 dark:text-white"
          : "cf-surface hover:border-black dark:hover:border-white",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
