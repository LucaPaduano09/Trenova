import { requireTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDashboardStats } from "@/actions/dashboard";
import DashboardCharts from "../_components/DashboardCharts";

export default async function DashboardPage() {
  const { tenant, session } = await requireTenantFromSession();
  const data = await getDashboardStats();
  const workoutTemplates = await prisma.workoutTemplate.findMany({
    where: { tenantId: tenant.id, isArchived: false },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold cf-text">Dashboard</h1>
      <p className="mt-2 text-sm cf-muted">
        <span className="font-medium">{tenant.name}</span> •{" "}
        {session.user.email}
      </p>

      <DashboardCharts data={data} workoutTemplates={workoutTemplates} />
    </div>
  );
}
