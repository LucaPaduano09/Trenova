import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import PackagesClient from "../../_components/PackagesClient";

export const revalidate = 30;

export default async function PackagesPage({
  searchParams,
}: {
  searchParams?: { flash?: string, clients?: string } | Promise<{ flash?: string, clients?: string }>;
}) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();
  const sp = await searchParams;
  const flash = sp?.flash ?? null;
  const clients = sp?.clients ?? null;

  const items = await prisma.package.findMany({
    where: { tenantId: tenant.id, OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }], },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      sessionCount: true,
      bundlePrice: true,
      monthlyPrice: true,
      monthlySessionCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <PackagesClient
      flash={flash}
      clients={clients}
      items={items.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
    />
  );
}