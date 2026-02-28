export const dynamic = "force-dynamic";
export const revalidate = 0;
import { requireTenantFromSession } from "@/lib/tenant";

import { getDashboardStats } from "@/actions/dashboard";
import DashboardCharts from "../_components/DashboardCharts";

export default async function DashboardPage() {
  const { tenant, session } = await requireTenantFromSession();
  const data = await getDashboardStats();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold cf-text">Dashboard</h1>
      <p className="mt-2 text-sm cf-muted">
        <span className="font-medium">{tenant.name}</span> •{" "}
        {session.user.email}
      </p>

      <DashboardCharts data={data} />
    </div>
  );
}
