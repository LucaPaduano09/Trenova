import { requireTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDashboardStats } from "@/actions/dashboard";
import DashboardCharts from "../_components/DashboardCharts";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;

  const data = await getDashboardStats(month);
  const { tenant, session } = await requireTenantFromSession();
  const workoutTemplates = await prisma.workoutTemplate.findMany({
    where: { tenantId: tenant.id, isArchived: false },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });

  const trainerName =
    session.user.name?.trim() || session.user.email?.split("@")[0] || "Trainer";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-[32px] border cf-surface px-5 py-6 sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(22,78,255,0.14),transparent_30%),radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.12),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.15),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border cf-surface px-3 py-1 text-[11px] uppercase tracking-[0.16em] cf-faint">
              Control room
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight cf-text sm:text-4xl">
              Panoramica operativa di{" "}
              <span className="bg-gradient-to-r from-[#0f2747] via-[#174ea6] to-[#10b981] bg-clip-text text-transparent dark:from-[#7fb4ff] dark:via-[#9dc3ff] dark:to-[#5ee6b5]">
                {tenant.name}
              </span>
            </h1>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <div className="rounded-[26px] border cf-surface bg-white/70 px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] dark:bg-white/[0.04] dark:shadow-none">
              <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
                Tenant attivo
              </div>
              <div className="mt-2 text-base font-semibold cf-text">
                {tenant.name}
              </div>
              <div className="mt-1 text-sm cf-muted">{trainerName}</div>
            </div>

            <div className="rounded-[26px] border cf-surface bg-white/70 px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] dark:bg-white/[0.04] dark:shadow-none">
              <div className="text-[11px] uppercase tracking-[0.16em] cf-faint">
                Account
              </div>
              <div className="mt-2 truncate text-base font-semibold cf-text">
                {session.user.email}
              </div>
              <div className="mt-1 text-sm cf-muted">
                Accesso trainer autenticato
              </div>
            </div>
          </div>
        </div>
      </section>

      <DashboardCharts data={data} workoutTemplates={workoutTemplates} />
    </div>
  );
}
