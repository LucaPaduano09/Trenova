import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth/guards";
import { InviteForm } from "./invite-form";

export default async function ClientInvitePage() {
  const user = await requireOwner();

  const invites = await prisma.clientInvite.findMany({
    where: {
      tenantId: user.tenantId!,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.22em] cf-muted">
          Clients
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Invita un cliente
        </h1>
        <p className="max-w-2xl text-sm cf-muted">
          Genera un link di invito da condividere con il cliente. Quando lo
          accetterà, verrà associato al tuo tenant Trenova.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="cf-card">
          <InviteForm />
        </div>

        <div className="cf-card">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Come funziona
          </h2>

          <div className="mt-4 space-y-4 text-sm cf-muted">
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                1. Genera il link
              </p>
              <p className="mt-1">
                Puoi creare un invito libero oppure vincolato a un’email
                specifica.
              </p>
            </div>

            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                2. Il cliente apre il link
              </p>
              <p className="mt-1">
                Se non ha un account, potrà registrarsi direttamente dal link di
                invito.
              </p>
            </div>

            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                3. Il cliente viene associato a te
              </p>
              <p className="mt-1">
                Con l’MVP attuale ogni cliente può avere un solo PT attivo alla
                volta.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 cf-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Inviti recenti
            </h2>
            <p className="mt-1 text-xs cf-muted">
              Ultimi 12 inviti creati per il tuo tenant.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 dark:border-white/10">
              <tr className="text-xs uppercase tracking-wide cf-muted">
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Stato</th>
                <th className="px-3 py-3 font-medium">Scadenza</th>
                <th className="px-3 py-3 font-medium">Creato</th>
              </tr>
            </thead>

            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-sm cf-muted"
                  >
                    Nessun invito creato per ora.
                  </td>
                </tr>
              ) : (
                invites.map((invite) => {
                  const isExpired =
                    !!invite.expiresAt && invite.expiresAt < new Date();

                  const status = invite.revokedAt
                    ? "Revocato"
                    : invite.usedAt
                    ? "Usato"
                    : isExpired
                    ? "Scaduto"
                    : "Attivo";

                  return (
                    <tr
                      key={invite.id}
                      className="border-b border-neutral-100 dark:border-white/5"
                    >
                      <td className="px-3 py-4 text-neutral-900 dark:text-white">
                        {invite.email || "Link libero"}
                      </td>

                      <td className="px-3 py-4">
                        <span className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs dark:border-white/10">
                          {status}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-neutral-900 dark:text-white">
                        {invite.expiresAt
                          ? invite.expiresAt.toLocaleDateString("it-IT", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td className="px-3 py-4 text-neutral-900 dark:text-white">
                        {invite.createdAt.toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}