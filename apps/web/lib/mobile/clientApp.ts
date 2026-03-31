import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveMobileClientSessionUserFromRequest } from "@/lib/mobile/auth";
import { notifyTenantOwners } from "@/lib/notifications";
import { publishTrainerTenantEvent } from "@/lib/realtime";
import { buildClientCalendarFromAvailabilitySlots } from "@/lib/sessions/buildCalendarSlots";

type TrainerSummary = {
  id: string;
  fullName: string | null;
  email: string | null;
};

type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
};

type ClientMeResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "CLIENT";
    tenantId: string | null;
  };
  client: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
    tenantId: string | null;
  };
  hasTenant: boolean;
  workspace: WorkspaceSummary | null;
  trainer: TrainerSummary | null;
};

type ClientDashboardResponse = {
  hasTenant: boolean;
  workspace: WorkspaceSummary | null;
  trainer: TrainerSummary | null;
  nextAppointment: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    location: string | null;
    locationType: string | null;
  } | null;
  activePlan: {
    id: string;
    title: string;
    currentVersion: number | null;
    updatedAt: string;
  } | null;
  latestProgress: {
    id: string;
    weight: number | null;
    createdAt: string;
  } | null;
};

type ClientSessionsResponse = {
  month: string;
  monthLabel: string;
  hasTenant: boolean;
  availableCount: number;
  busyCount: number;
  nextMonth: string;
  previousMonth: string;
  bookedAppointments: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    location: string | null;
    locationType: string | null;
    notes: string | null;
  }>;
  days: Array<{
    dayKey: string;
    date: string;
    dayNumber: number;
    weekdayLabel: string;
    fullLabel: string;
    isToday: boolean;
    availableCount: number;
    busyCount: number;
    slots: Array<{
      key: string;
      startsAt: string;
      endsAt: string;
      dayKey: string;
      label: string;
      isPast: boolean;
      isBusy: boolean;
      isAvailable: boolean;
    }>;
  }>;
};

type ClientWorkoutsResponse = {
  hasActivePlan: boolean;
  planName: string | null;
  planNotes: string | null;
  versionTitle: string | null;
  versionNumber: number | null;
  workouts: Array<{
    key: string;
    name: string;
    order: number;
    items: Array<{
      id: string;
      order: number;
      name: string;
      tips: string | null;
      imageUrl: string | null;
      sets: number | null;
      reps: string | null;
      restSec: number | null;
      tempo: string | null;
      rpe: number | null;
      loadsKg: number[];
      restSecBySet: number[];
      itemNotes: string | null;
      tags: string[];
    }>;
  }>;
};

type ClientSessionBookingResponse = {
  appointment: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    location: string | null;
    locationType: string | null;
    notes: string | null;
  };
};

type AvailabilityRule = {
  id: string;
  weekday: number;
  startMin: number;
  endMin: number;
  isActive: boolean;
};

type MobileClientContext = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "CLIENT";
    tenantId: string | null;
  };
  client: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
    tenantId: string | null;
  };
  hasTenant: boolean;
};

function toWorkspaceSummary(input: {
  id: string;
  name: string;
  slug: string;
  email: string | null;
}): WorkspaceSummary {
  return {
    id: input.id,
    name: input.name,
    slug: input.slug,
    email: input.email,
  };
}

function toTrainerSummary(input: {
  id: string;
  fullName: string | null;
  email: string | null;
}): TrainerSummary {
  return {
    id: input.id,
    fullName: input.fullName,
    email: input.email,
  };
}

export async function requireMobileClientContext(): Promise<MobileClientContext> {
  return requireMobileClientContextFromRequest();
}

async function getClientSessionUser(request?: Request) {
  if (request) {
    const mobileSessionUser =
      await resolveMobileClientSessionUserFromRequest(request);

    if (mobileSessionUser) {
      return mobileSessionUser;
    }
  }

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  if (session.user.role !== "CLIENT") {
    throw new Error("FORBIDDEN");
  }

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    role: "CLIENT" as const,
    tenantId: session.user.tenantId ?? null,
  };
}

export async function requireMobileClientContextFromRequest(
  request?: Request
): Promise<MobileClientContext> {
  const sessionUser = await getClientSessionUser(request);

  const client = await prisma.client.findFirst({
    where: {
      userId: sessionUser.id,
      OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      tenantId: true,
    },
  });

  if (!client) {
    throw new Error("FORBIDDEN");
  }

  return {
    user: {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      role: "CLIENT",
      tenantId: sessionUser.tenantId,
    },
    client,
    hasTenant: !!client.tenantId,
  };
}

export async function getMobileClientMe(request?: Request): Promise<ClientMeResponse> {
  const context = await requireMobileClientContextFromRequest(request);

  let workspace: WorkspaceSummary | null = null;
  let trainer: TrainerSummary | null = null;

  if (context.client.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: context.client.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        users: {
          where: { role: "OWNER" },
          select: {
            id: true,
            fullName: true,
            email: true,
          },
          take: 1,
        },
      },
    });

    if (tenant) {
      workspace = toWorkspaceSummary(tenant);
      if (tenant.users[0]) {
        trainer = toTrainerSummary(tenant.users[0]);
      }
    }
  }

  return {
    user: context.user,
    client: context.client,
    hasTenant: context.hasTenant,
    workspace,
    trainer,
  };
}

export async function getMobileClientDashboard(
  request?: Request
): Promise<ClientDashboardResponse> {
  const context = await requireMobileClientContextFromRequest(request);

  let workspace: WorkspaceSummary | null = null;
  let trainer: TrainerSummary | null = null;

  if (context.client.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: context.client.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        users: {
          where: { role: "OWNER" },
          select: {
            id: true,
            fullName: true,
            email: true,
          },
          take: 1,
        },
      },
    });

    if (tenant) {
      workspace = toWorkspaceSummary(tenant);
      if (tenant.users[0]) {
        trainer = toTrainerSummary(tenant.users[0]);
      }
    }
  }

  const [nextAppointment, activePlan, latestProgress] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        clientId: context.client.id,
        status: "SCHEDULED",
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        location: true,
        locationType: true,
      },
    }),
    prisma.workoutPlan.findFirst({
      where: {
        clientId: context.client.id,
        tenantId: context.client.tenantId ?? undefined,
        status: "active",
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        currentVersion: true,
        updatedAt: true,
      },
    }),
    prisma.progressEntry.findFirst({
      where: {
        clientId: context.client.id,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        weight: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    hasTenant: context.hasTenant,
    workspace,
    trainer,
    nextAppointment: nextAppointment
      ? {
          id: nextAppointment.id,
          startsAt: nextAppointment.startsAt.toISOString(),
          endsAt: nextAppointment.endsAt.toISOString(),
          status: nextAppointment.status,
          location: nextAppointment.location ?? null,
          locationType: nextAppointment.locationType ?? null,
        }
      : null,
    activePlan: activePlan
      ? {
          id: activePlan.id,
          title: activePlan.title,
          currentVersion: activePlan.currentVersion ?? null,
          updatedAt: activePlan.updatedAt.toISOString(),
        }
      : null,
    latestProgress: latestProgress
      ? {
          id: latestProgress.id,
          weight: latestProgress.weight ?? null,
          createdAt: latestProgress.createdAt.toISOString(),
        }
      : null,
  };
}

function formatMonthLabel(month: string) {
  const [year, mon] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, mon - 1, 1));
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatWeekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
  }).format(date);
}

function formatFullDayLabel(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

function changeMonth(month: string, delta: number) {
  const [year, mon] = month.split("-").map(Number);
  const d = new Date(year, mon - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

const DEFAULT_SESSION_SLOT_MINUTES = 60;

function buildDateFromMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setMinutes(minutes, 0, 0);
  return next;
}

function getExplicitSlotDayKeys(
  slots: Array<{
    startAt: Date;
  }>
) {
  return new Set(slots.map((slot) => formatDateKey(slot.startAt)));
}

function expandAvailabilityRulesToSlots(args: {
  month: string;
  rules: AvailabilityRule[];
  existingSlots: Array<{
    id: string;
    date: Date;
    startAt: Date;
    endAt: Date;
    isAvailable: boolean;
  }>;
}) {
  const [year, month] = args.month.split("-").map(Number);
  const monthLastDay = new Date(year, month, 0).getDate();
  const explicitDayKeys = getExplicitSlotDayKeys(args.existingSlots);
  const generatedSlots: Array<{
    id: string;
    date: Date;
    startAt: Date;
    endAt: Date;
    isAvailable: boolean;
  }> = [];

  for (let day = 1; day <= monthLastDay; day++) {
    const date = new Date(year, month - 1, day);
    const dayKey = formatDateKey(date);

    if (explicitDayKeys.has(dayKey)) {
      continue;
    }

    for (const rule of args.rules) {
      if (!rule.isActive || date.getDay() !== rule.weekday) {
        continue;
      }

      for (
        let slotStartMin = rule.startMin;
        slotStartMin < rule.endMin;
        slotStartMin += DEFAULT_SESSION_SLOT_MINUTES
      ) {
        const slotEndMin = Math.min(
          slotStartMin + DEFAULT_SESSION_SLOT_MINUTES,
          rule.endMin
        );

        if (slotEndMin <= slotStartMin) {
          continue;
        }

        generatedSlots.push({
          id: `rule:${rule.id}:${dayKey}:${slotStartMin}`,
          date,
          startAt: buildDateFromMinutes(date, slotStartMin),
          endAt: buildDateFromMinutes(date, slotEndMin),
          isAvailable: true,
        });
      }
    }
  }

  return generatedSlots;
}

function resolveRuleBackedSlot(args: {
  dayKey: string;
  startMin: number;
  rule: Pick<AvailabilityRule, "weekday" | "startMin" | "endMin">;
}) {
  const [year, month, day] = args.dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (date.getDay() !== args.rule.weekday) {
    return null;
  }

  if (args.startMin < args.rule.startMin || args.startMin >= args.rule.endMin) {
    return null;
  }

  const slotEndMin = Math.min(
    args.startMin + DEFAULT_SESSION_SLOT_MINUTES,
    args.rule.endMin
  );

  if (slotEndMin <= args.startMin) {
    return null;
  }

  return {
    startAt: buildDateFromMinutes(date, args.startMin),
    endAt: buildDateFromMinutes(date, slotEndMin),
  };
}

export async function getMobileClientSessions(args?: {
  request?: Request;
  month?: string;
}): Promise<ClientSessionsResponse> {
  const context = await requireMobileClientContextFromRequest(args?.request);

  const now = new Date();
  const currentMonth =
    args?.month && /^\d{4}-\d{2}$/.test(args.month)
      ? args.month
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (!context.client.tenantId) {
    return {
      month: currentMonth,
      monthLabel: formatMonthLabel(currentMonth),
      hasTenant: false,
      availableCount: 0,
      busyCount: 0,
      nextMonth: changeMonth(currentMonth, 1),
      previousMonth: changeMonth(currentMonth, -1),
      bookedAppointments: [],
      days: [],
    };
  }

  const [year, month] = currentMonth.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const [availabilitySlots, availabilityRules, busyAppointments, bookedAppointments] =
    await Promise.all([
    prisma.tenantAvailabilitySlot.findMany({
      where: {
        tenantId: context.client.tenantId,
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
    prisma.tenantAvailabilityRule.findMany({
      where: {
        tenantId: context.client.tenantId,
        isActive: true,
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
    prisma.appointment.findMany({
      where: {
        tenantId: context.client.tenantId,
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
    prisma.appointment.findMany({
      where: {
        tenantId: context.client.tenantId,
        clientId: context.client.id,
        startsAt: { gte: monthStart, lte: monthEnd },
        status: {
          in: ["PENDING", "SCHEDULED", "COMPLETED", "CANCELED"],
        },
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        location: true,
        locationType: true,
        notes: true,
      },
    }),
    ]);

  const effectiveAvailabilitySlots = [
    ...availabilitySlots,
    ...expandAvailabilityRulesToSlots({
      month: currentMonth,
      rules: availabilityRules,
      existingSlots: availabilitySlots,
    }),
  ];

  const slots = buildClientCalendarFromAvailabilitySlots({
    availabilitySlots: effectiveAvailabilitySlots,
    busyAppointments,
  });

  const monthLastDay = new Date(year, month, 0);
  const days = [];

  for (let day = 1; day <= monthLastDay.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    const dayKey = formatDateKey(date);
    const daySlots = slots
      .filter((slot) => slot.dayKey === dayKey)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    days.push({
      dayKey,
      date: date.toISOString(),
      dayNumber: day,
      weekdayLabel: formatWeekdayLabel(date),
      fullLabel: formatFullDayLabel(date),
      isToday: isToday(date),
      availableCount: daySlots.filter((slot) => slot.isAvailable).length,
      busyCount: daySlots.filter((slot) => slot.isBusy).length,
      slots: daySlots.map((slot) => ({
        key: slot.key,
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
        dayKey: slot.dayKey,
        label: slot.label,
        isPast: slot.isPast,
        isBusy: slot.isBusy,
        isAvailable: slot.isAvailable,
      })),
    });
  }

  return {
    month: currentMonth,
    monthLabel: formatMonthLabel(currentMonth),
    hasTenant: true,
    availableCount: slots.filter((slot) => slot.isAvailable).length,
    busyCount: slots.filter((slot) => slot.isBusy).length,
    nextMonth: changeMonth(currentMonth, 1),
    previousMonth: changeMonth(currentMonth, -1),
    bookedAppointments: bookedAppointments.map((appointment) => ({
      id: appointment.id,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      status: appointment.status,
      location: appointment.location ?? null,
      locationType: appointment.locationType ?? null,
      notes: appointment.notes ?? null,
    })),
    days,
  };
}

export async function getMobileClientWorkouts(
  request?: Request
): Promise<ClientWorkoutsResponse> {
  const context = await requireMobileClientContextFromRequest(request);

  const activePlan = await prisma.workoutPlan.findFirst({
    where: {
      tenantId: context.client.tenantId ?? undefined,
      clientId: context.client.id,
      status: "active",
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      notes: true,
      currentVersion: true,
    },
  });

  if (!activePlan) {
    return {
      hasActivePlan: false,
      planName: null,
      planNotes: null,
      versionTitle: null,
      versionNumber: null,
      workouts: [],
    };
  }

  const currentVersion = await prisma.workoutPlanVersion.findFirst({
    where: {
      tenantId: context.client.tenantId ?? undefined,
      planId: activePlan.id,
      version: activePlan.currentVersion,
    },
    select: {
      id: true,
      version: true,
      title: true,
      items: {
        orderBy: [{ workoutOrder: "asc" }, { order: "asc" }],
        select: {
          id: true,
          order: true,
          workoutKey: true,
          workoutNameSnapshot: true,
          workoutOrder: true,
          nameSnapshot: true,
          tipsSnapshot: true,
          imageUrlSnapshot: true,
          sets: true,
          reps: true,
          restSec: true,
          tempo: true,
          rpe: true,
          loadsKg: true,
          restSecBySet: true,
          itemNotes: true,
          tagsSnapshot: true,
        },
      },
    },
  });

  if (!currentVersion || currentVersion.items.length === 0) {
    return {
      hasActivePlan: true,
      planName: activePlan.title,
      planNotes: activePlan.notes ?? null,
      versionTitle: currentVersion?.title ?? null,
      versionNumber: currentVersion?.version ?? null,
      workouts: [],
    };
  }

  const groupsMap = new Map<
    string,
    {
      key: string;
      name: string;
      order: number;
      items: ClientWorkoutsResponse["workouts"][number]["items"];
    }
  >();

  for (const item of currentVersion.items) {
    const normalizedWorkoutName =
      item.workoutNameSnapshot?.trim() || "Workout";
    const normalizedWorkoutOrder = item.workoutOrder ?? 0;
    const groupKey =
      item.workoutKey?.trim() ||
      `${normalizedWorkoutOrder}-${normalizedWorkoutName}`;

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        key: groupKey,
        name: normalizedWorkoutName,
        order: normalizedWorkoutOrder,
        items: [],
      });
    }

    groupsMap.get(groupKey)!.items.push({
      id: item.id,
      order: item.order,
      name: item.nameSnapshot,
      tips: item.tipsSnapshot ?? null,
      imageUrl: item.imageUrlSnapshot ?? null,
      sets: item.sets ?? null,
      reps: item.reps ?? null,
      restSec: item.restSec ?? null,
      tempo: item.tempo ?? null,
      rpe: item.rpe ?? null,
      loadsKg: item.loadsKg ?? [],
      restSecBySet: item.restSecBySet ?? [],
      itemNotes: item.itemNotes ?? null,
      tags: item.tagsSnapshot ?? [],
    });
  }

  const workouts = Array.from(groupsMap.values())
    .sort((a, b) => a.order - b.order)
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => a.order - b.order),
    }));

  return {
    hasActivePlan: true,
    planName: activePlan.title,
    planNotes: activePlan.notes ?? null,
    versionTitle: currentVersion.title,
    versionNumber: currentVersion.version,
    workouts,
  };
}

export async function bookMobileClientSession(args: {
  request: Request;
  slotKey: string;
}): Promise<ClientSessionBookingResponse> {
  const context = await requireMobileClientContextFromRequest(args.request);

  if (!context.client.tenantId) {
    throw new Error("FORBIDDEN");
  }

  const ruleBackedSlotMatch = args.slotKey.match(
    /^rule:(.+):(\d{4}-\d{2}-\d{2}):(\d+)$/
  );

  let slot:
    | {
        id: string;
        startAt: Date;
        endAt: Date;
      }
    | null = null;

  if (ruleBackedSlotMatch) {
    const [, ruleId, dayKey, startMinRaw] = ruleBackedSlotMatch;
    const startMin = Number(startMinRaw);

    if (!Number.isNaN(startMin)) {
      const rule = await prisma.tenantAvailabilityRule.findFirst({
        where: {
          id: ruleId,
          tenantId: context.client.tenantId,
          isActive: true,
        },
        select: {
          id: true,
          weekday: true,
          startMin: true,
          endMin: true,
        },
      });

      if (rule) {
        const resolvedSlot = resolveRuleBackedSlot({
          dayKey,
          startMin,
          rule,
        });

        if (resolvedSlot) {
          slot = {
            id: args.slotKey,
            startAt: resolvedSlot.startAt,
            endAt: resolvedSlot.endAt,
          };
        }
      }
    }
  } else {
    slot = await prisma.tenantAvailabilitySlot.findFirst({
      where: {
        id: args.slotKey,
        tenantId: context.client.tenantId,
        isAvailable: true,
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
      },
    });
  }

  if (!slot) {
    throw new Error("SLOT_NOT_FOUND");
  }

  if (slot.endAt <= new Date()) {
    throw new Error("SLOT_NOT_AVAILABLE");
  }

  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId: context.client.tenantId,
      status: { not: "CANCELED" },
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { lt: slot.endAt },
      endsAt: { gt: slot.startAt },
    },
    select: { id: true },
  });

  if (conflict) {
    throw new Error("SLOT_ALREADY_BOOKED");
  }

  const sameClientAppointment = await prisma.appointment.findFirst({
    where: {
      tenantId: context.client.tenantId,
      clientId: context.client.id,
      status: { not: "CANCELED" },
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { lt: slot.endAt },
      endsAt: { gt: slot.startAt },
    },
    select: { id: true },
  });

  if (sameClientAppointment) {
    throw new Error("CLIENT_ALREADY_BOOKED");
  }

  const appointment = await prisma.appointment.create({
    data: {
      tenantId: context.client.tenantId,
      clientId: context.client.id,
      startsAt: slot.startAt,
      endsAt: slot.endAt,
      locationType: "OTHER",
      location: null,
      notes: "Richiesta di prenotazione inviata da app cliente",
      status: "PENDING",
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      location: true,
      locationType: true,
      notes: true,
    },
  });

  await notifyTenantOwners({
    tenantId: context.client.tenantId,
    title: "Nuova richiesta di prenotazione",
    body: `${context.client.fullName} ha richiesto una sessione il ${new Intl.DateTimeFormat(
      "it-IT",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(slot.startAt)}.`,
    href: "/app/booking?range=all",
    appointmentId: appointment.id,
    clientId: context.client.id,
  });

  await publishTrainerTenantEvent({
    tenantId: context.client.tenantId,
    name: "booking.requested",
    data: {
      appointmentId: appointment.id,
      clientId: context.client.id,
      status: appointment.status,
    },
  });

  return {
    appointment: {
      id: appointment.id,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      status: appointment.status,
      location: appointment.location ?? null,
      locationType: appointment.locationType ?? null,
      notes: appointment.notes ?? null,
    },
  };
}
