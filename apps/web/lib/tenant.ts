// lib/tenant.ts
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// lib/tenant.ts

import { redirect } from "next/navigation";

export async function requireTenantFromSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/app/sign-in");
  }

  const tenantId = session.user.tenantId;

  if (!tenantId) {
    redirect("/app/setup");
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    redirect("/app/setup");
  }

  return { session, tenant };
}

export async function getTenantBySlug(tenantSlug: string) {
  return prisma.tenant.findUnique({ where: { slug: tenantSlug } });
}

export async function getClientBySlug(tenantSlug: string, clientSlug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });
  if (!tenant) return null;

  const client = await prisma.client.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: clientSlug } },
  });

  return { tenant, client };
}
