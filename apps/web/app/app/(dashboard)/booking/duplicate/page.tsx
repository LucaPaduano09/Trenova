export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireTenantFromSession } from "@/lib/tenant";
import { notFound } from "next/navigation";
import SessionForm from "../../../_components/SessionForm";

export default async function BookingDuplicatePage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const { id } = (await searchParams) ?? {};
  if (!id) notFound();

  const { tenant } = await requireTenantFromSession();

  const a = await prisma.appointment.findFirst({
    where: {
      id,
      tenantId: tenant.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      locationType: true,
      location: true,
      notes: true,
      priceCents: true,
      paidAt: true,
      paymentMethod: true,
      client: { select: { fullName: true } },
    },
  });

  if (!a) notFound();

  const durationMin = Math.max(
    15,
    Math.round((a.endsAt.getTime() - a.startsAt.getTime()) / 60000)
  );

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold cf-text">Duplica sessione</h1>
          <p className="mt-1 text-sm cf-muted">
            Cliente:{" "}
            <span className="font-medium cf-text">{a.client.fullName}</span>
          </p>
        </div>

        <Link
          href="/app/booking"
          className="rounded-2xl border cf-surface px-4 py-2 text-sm"
        >
          Indietro
        </Link>
      </header>

      <div className="cf-card">
        <SessionForm
          mode={{
            kind: "duplicate",
            sourceId: a.id,
            defaults: {
              ...a,
              durationMin,
              paidAt: null,
            },
          }}
        />
      </div>
    </div>
  );
}
