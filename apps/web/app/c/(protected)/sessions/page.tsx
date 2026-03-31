import { getCurrentClient } from "@/lib/auth/getCurrentClient";
import { prisma } from "@/lib/db";
import SessionsView from "../_components/SessionsView";
import { buildClientCalendarFromAvailabilitySlots } from "@/lib/sessions/buildCalendarSlots";

export const revalidate = 0;

export default async function ClientSessionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const { client } = await getCurrentClient();

  if (!client.tenantId) {
    throw new Error("Client not connected to tenant");
  }

  const now = new Date();
  const currentMonth =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month)
      ? sp.month
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [year, month] = currentMonth.split("-").map(Number);

  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const [availabilitySlots, busyAppointments] = await Promise.all([
    prisma.tenantAvailabilitySlot.findMany({
      where: {
        tenantId: client.tenantId,
        startAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      orderBy: [{ date: "asc" }, { startAt: "asc" }],
      select: {
        id: true,
        date: true,
        startAt: true,
        endAt: true,
        isAvailable: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId: client.tenantId,
        startsAt: { gte: monthStart, lte: monthEnd },
        status: {
          in: ["PENDING", "SCHEDULED"],
        },
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
      },
    }),
  ]);

  const slots = buildClientCalendarFromAvailabilitySlots({
    availabilitySlots,
    busyAppointments,
  });

  return <SessionsView month={currentMonth} slots={slots} />;
}
