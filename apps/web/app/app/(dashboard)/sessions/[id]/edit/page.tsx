import { prisma } from "@/lib/db";
import { requireTenantFromSession } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateSession } from "../../../../../../actions/sessions";

function toInputDateTimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function centsToEuroString(priceCents?: number | null) {
  if (priceCents == null) return "";
  return (priceCents / 100).toFixed(2).replace(".", ",");
}

export default async function EditSessionPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(params);
  const { tenant } = await requireTenantFromSession();

  const session = await prisma.appointment.findFirst({
    where: { id, tenantId: tenant.id },
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
      client: { select: { slug: true, fullName: true } },
    },
  });

  if (!session) return notFound();

  const durationMin = Math.max(
    15,
    Math.round((session.endsAt.getTime() - session.startsAt.getTime()) / 60000)
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border cf-surface p-6 ">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Modifica sessione
            </h1>
            <p className="mt-1 text-sm cf-muted">
              Cliente: {session.client.fullName}
            </p>
          </div>

          <Link
            href={`/app/clients/${session.client.slug}?tab=sessions`}
            className="rounded-2xl border px-4 py-2 text-sm cf-surface"
          >
            Indietro
          </Link>
        </div>

        <form action={updateSession} className="mt-6 space-y-4">
          <input type="hidden" name="sessionId" value={session.id} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-medium cf-text">Data e ora</label>
              <input
                type="datetime-local"
                name="startsAt"
                defaultValue={toInputDateTimeLocal(session.startsAt)}
                className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-medium cf-text">
                Durata (min)
              </label>
              <input
                name="durationMin"
                defaultValue={durationMin}
                className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-medium cf-text">Tipo</label>
              <select
                name="locationType"
                defaultValue={String(session.locationType)}
                className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none"
              >
                <option value="GYM">Palestra</option>
                <option value="HOME">A domicilio</option>
                <option value="OUTDOOR">Outdoor</option>
                <option value="ONLINE">Online</option>
                <option value="OTHER">Altro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium cf-text">Luogo</label>
              <input
                name="location"
                defaultValue={session.location ?? ""}
                placeholder="Es. Palestra Caravaggio"
                className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium cf-text">Metodo</label>
              <select
                name="paymentMethod"
                defaultValue={session.paymentMethod ?? ""}
                className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none"
              >
                <option value="">—</option>
                <option value="Contanti">Contanti</option>
                <option value="Carta">Carta</option>
                <option value="Bonifico">Bonifico</option>
                <option value="Altro">Altro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium cf-text">Prezzo (€)</label>
              <input
                name="price"
                inputMode="decimal"
                defaultValue={centsToEuroString(session.priceCents)}
                placeholder="Es. 50 oppure 50,00"
                className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium cf-text">
                Stato pagamento
              </label>
              <div className="mt-2 flex h-[42px] items-center gap-3 rounded-2xl border bg-white/80 px-4">
                <input
                  id="isPaid"
                  name="isPaid"
                  type="checkbox"
                  defaultChecked={!!session.paidAt}
                />
                <label htmlFor="isPaid" className="text-sm cf-text">
                  Pagata
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium cf-text">Note</label>
            <textarea
              name="notes"
              defaultValue={session.notes ?? ""}
              rows={4}
              className="mt-2 w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button className="rounded-2xl bg-black px-4 py-2 text-sm text-white hover:opacity-90">
              Salva modifiche
            </button>

            <Link
              href={`/app/clients/${session.client.slug}?tab=sessions`}
              className="rounded-2xl border bg-white px-4 py-2 text-sm hover:bg-neutral-50"
            >
              Annulla
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
