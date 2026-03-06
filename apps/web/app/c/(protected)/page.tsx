import { getCurrentClient } from "@/lib/auth/getCurrentClient";
import { prisma } from "@/lib/db";

export default async function ClientDashboardPage() {
  const { client } = await getCurrentClient();

  const nextAppointment = await prisma.appointment.findFirst({
    where: {
      clientId: client.id,
      status: "SCHEDULED",
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ciao {client.fullName}</h1>
        <p className="mt-1 text-sm text-white/60">Benvenuto nella tua area cliente.</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-sm text-white/60">Prossima sessione</div>
        <div className="mt-2 text-base font-medium">
          {nextAppointment
            ? new Date(nextAppointment.startsAt).toLocaleString("it-IT")
            : "Nessuna sessione programmata"}
        </div>
      </div>
    </div>
  );
}