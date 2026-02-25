export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { listWorkoutTemplates } from "../../../../../../actions/workouts";
import { requireTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { attachNewWorkoutToSession } from "../../../../../../actions/attachWorkoutToSession";

export default async function ChangeWorkoutToSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { tenant } = await requireTenantFromSession();
  const templates = await listWorkoutTemplates({ state: "active" });

  const currentSession = await prisma.appointment.findFirst({
    where: {
      id,
      tenantId: tenant.id,
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    select: {
      id: true,
      workoutTemplateId: true,
      workoutTemplate: { select: { id: true, title: true } },
      clientId: true,
    },
  });

  if (!currentSession) {
    return <div className="cf-text">Sessione non trovata</div>;
  }

  return (
    <div className="space-y-6 cf-text">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Cambia la scheda assegnata alla sessione
          </h1>
          <p className="mt-1 text-sm cf-muted">
            Seleziona una scheda e sostituiscila per questo appuntamento.
          </p>
        </div>

        <Link
          href={`/app/sessions/${id}/edit`}
          className="rounded-2xl border cf-surface px-4 py-2 text-sm cf-text hover:opacity-90"
        >
          Indietro
        </Link>
      </header>

      <div className="rounded-3xl border cf-surface p-5">
        <form action={attachNewWorkoutToSession} className="grid gap-4">
          <input type="hidden" name="appointmentId" value={id} />
          <input
            type="hidden"
            name="clientId"
            value={currentSession.clientId}
          />
          <div className="grid gap-2">
            <div className="text-sm font-medium">Scheda</div>

            <select
              name="workoutTemplateId"
              className="cf-input hover:border-black hover:dark:border-white mb-2"
              required
              defaultValue={currentSession.workoutTemplateId ?? ""}
            >
              <option value="" disabled>
                Seleziona scheda…
              </option>

              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            {currentSession.workoutTemplate?.title ? (
              <div className="text-xs cf-faint">
                Attuale:{" "}
                <span className="cf-chip">
                  {currentSession.workoutTemplate.title}
                </span>
              </div>
            ) : (
              <div className="text-xs cf-faint">Nessuna scheda assegnata</div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button className="rounded-2xl px-4 py-2 text-sm cf-surface cf-text hover:border-black hover:dark:border-white hover:cursor-pointer">
              Salva modifica
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
