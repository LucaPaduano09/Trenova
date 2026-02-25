// app/app/page.tsx
import { requireTenantFromSession } from "@/lib/tenant";
import Link from "next/link";
export default async function DashboardPage() {
  const { tenant, session } = await requireTenantFromSession();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold cf-text">Dashboard</h1>
      <p className="mt-2 text-sm cf-muted">
        Tenant: <span className="font-medium">{tenant.name}</span> •{" "}
        {session.user.email}
      </p>
      <Link href="/app/clients" className="text-sm underline cf-faint">
        Go to clients
      </Link>
    </div>
  );
}
