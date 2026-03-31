import AvailabilityCalendarEditor from "@/app/app/_components/AvailabilityCalendarEditor";
import AvailabilityRulesEditor from "@/app/app/_components/AvailabilityRulesEditor";
import { prisma } from "@/lib/db";
import { requireTenantFromSession } from "@/lib/tenant";

export const revalidate = 0;

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const { tenant } = await requireTenantFromSession();

  const now = new Date();
  const currentMonth =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month)
      ? sp.month
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [year, month] = currentMonth.split("-").map(Number);

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const [slots, rules] = await Promise.all([
    prisma.tenantAvailabilitySlot.findMany({
      where: {
        tenantId: tenant.id,
        date: {
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
    prisma.tenantAvailabilityRule.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
      select: {
        id: true,
        weekday: true,
        startMin: true,
        endMin: true,
        isActive: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="cf-card cf-hairline p-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] cf-muted">
            Settings
          </p>
          <h1 className="text-2xl font-semibold tracking-tight cf-text">
            Disponibilita trainer
          </h1>
          <p className="max-w-2xl text-sm cf-muted">
            Definisci prima la routine automatica della settimana, poi usa il
            calendario per fare eccezioni giornaliere e disattivare singole fasce
            orarie.
          </p>
        </div>
      </header>

      <AvailabilityRulesEditor
        initialRules={rules.map((rule) => ({
          id: rule.id,
          weekday: rule.weekday,
          startMin: rule.startMin,
          endMin: rule.endMin,
          isActive: rule.isActive,
        }))}
      />

      <AvailabilityCalendarEditor
        month={currentMonth}
        initialSlots={slots.map((slot) => ({
          id: slot.id,
          date: slot.date.toISOString(),
          startAt: slot.startAt.toISOString(),
          endAt: slot.endAt.toISOString(),
          isAvailable: slot.isAvailable,
        }))}
        recurringRules={rules.map((rule) => ({
          weekday: rule.weekday,
          startMin: rule.startMin,
          endMin: rule.endMin,
          isActive: rule.isActive,
        }))}
      />
    </div>
  );
}
