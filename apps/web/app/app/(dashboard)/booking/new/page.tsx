export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireTenantFromSession } from "@/lib/tenant";
import { notFound } from "next/navigation";
import NewSessionForm from "./session-form";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: clientSlug } = await searchParams;
  if (!clientSlug) notFound();

  const { tenant } = await requireTenantFromSession();

  const client = await prisma.client.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: clientSlug } },
    select: { slug: true, fullName: true, email: true, phone: true },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight cf-text">
            Nuova sessione
          </h1>
          <p className="mt-1 text-sm cf-muted">
            Cliente:{" "}
            <span className="font-medium cf-text">{client.fullName}</span>
          </p>
        </div>

        <Link
          href={`/app/clients/${client.slug}`}
          className="cf-text rounded-2xl border cf-surface px-4 py-2 text-sm"
        >
          Annulla
        </Link>
      </header>

      <div className="">
        <NewSessionForm clientSlug={client.slug} />
      </div>
    </div>
  );
}
