import { getCurrentClient } from "@/lib/auth/getCurrentClient";
import { prisma } from "@/lib/db";
import Link from "next/link";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function DashboardCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="text-sm text-white/55">{title}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      {hint ? <div className="mt-2 text-sm text-white/45">{hint}</div> : null}
    </div>
  );
}

export default async function ClientDashboardPage() {
  const { client, hasTenant } = await getCurrentClient();

  const [nextAppointment, activePlan, latestProgress] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        clientId: client.id,
        status: "SCHEDULED",
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.workoutPlan.findFirst({
      where: {
        clientId: client.id,
        status: "active",
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    }),
    prisma.progressEntry.findFirst({
      where: {
        clientId: client.id,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        weight: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
            Area Cliente
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Ciao {client.fullName}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
            {hasTenant
              ? "Bentornato nella tua area personale. Qui puoi seguire sessioni, scheda attiva e progressi del tuo percorso."
              : "Hai già il tuo accesso personale. Completa il tuo profilo e preparati a collegarti a un personal trainer."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/c/profile"
              className="rounded-2xl border border-white/10 bg-white text-black px-4 py-2.5 text-sm font-medium transition hover:opacity-90"
            >
              Vai al profilo
            </Link>

            <Link
              href="/c/workouts"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white"
            >
              I miei workout
            </Link>

            <Link
              href="/c/sessions"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white"
            >
              Le mie sessioni
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="text-sm text-white/55">Stato account</div>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-white/40">
                Profilo cliente
              </div>
              <div className="mt-2 text-sm font-medium text-white">
                Attivo
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-white/40">
                Collegamento PT
              </div>
              <div className="mt-2 text-sm font-medium text-white">
                {hasTenant ? "Connesso a un trainer" : "Nessun trainer collegato"}
              </div>
              <p className="mt-2 text-sm text-white/45">
                {hasTenant
                  ? "Il tuo account è già associato a un workspace Trenova."
                  : "Più avanti potrai collegarti a un trainer tramite invito o scelta autonoma."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!hasTenant ? (
        <section className="rounded-[32px] border border-dashed border-white/12 bg-white/[0.03] p-6 backdrop-blur-xl">
          <div className="max-w-2xl">
            <div className="text-sm text-white/55">Prossimo step</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
              Non sei ancora collegato a un personal trainer
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Il tuo account cliente è già pronto. Nel prossimo step potrai
              ricevere un invito da un PT oppure scegliere in autonomia il
              trainer più adatto a te.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/c/profile"
                className="rounded-2xl border border-white/10 bg-white text-black px-4 py-2.5 text-sm font-medium transition hover:opacity-90"
              >
                Completa il profilo
              </Link>
              <button
                disabled
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/35 cursor-not-allowed"
              >
                Scopri i trainer
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Prossima sessione"
          value={
            nextAppointment
              ? formatDate(new Date(nextAppointment.startsAt))
              : "Nessuna sessione programmata"
          }
          hint={
            nextAppointment
              ? "Controlla i dettagli nella sezione Sessioni."
              : "Appena verrà fissato un appuntamento lo vedrai qui."
          }
        />

        <DashboardCard
          title="Scheda attiva"
          value={activePlan?.title ?? "Nessuna scheda assegnata"}
          hint={
            activePlan
              ? "La tua programmazione attuale è pronta."
              : "Quando un trainer ti assegnerà una scheda, comparirà qui."
          }
        />

        <DashboardCard
          title="Ultimo progresso"
          value={
            latestProgress?.weight != null
              ? `${latestProgress.weight} kg`
              : "Nessun dato registrato"
          }
          hint={
            latestProgress
              ? `Aggiornato il ${new Intl.DateTimeFormat("it-IT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }).format(new Date(latestProgress.createdAt))}`
              : "Aggiungi dati e progressi per iniziare a tracciare il tuo percorso."
          }
        />
      </section>
    </div>
  );
}