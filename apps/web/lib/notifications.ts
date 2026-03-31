import { prisma } from "@/lib/db";
import { publishClientUserEvent, publishTrainerTenantEvent } from "@/lib/realtime";
import { sendPushToUser } from "@/lib/push-notifications";

export async function notifyTenantOwners(args: {
  tenantId: string;
  title: string;
  body?: string | null;
  href?: string | null;
  appointmentId?: string | null;
  clientId?: string | null;
}) {
  const owners = await prisma.user.findMany({
    where: {
      tenantId: args.tenantId,
      role: "OWNER",
    },
    select: {
      id: true,
    },
  });

  if (owners.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: owners.map((owner) => ({
      tenantId: args.tenantId,
      userId: owner.id,
      type: "GENERIC",
      title: args.title,
      body: args.body ?? null,
      href: args.href ?? null,
      appointmentId: args.appointmentId ?? null,
      clientId: args.clientId ?? null,
    })),
  });

  await publishTrainerTenantEvent({
    tenantId: args.tenantId,
    name: "notifications.updated",
    data: {
      appointmentId: args.appointmentId ?? null,
      clientId: args.clientId ?? null,
    },
  });

  await Promise.allSettled(
    owners.map((owner) =>
      sendPushToUser({
        userId: owner.id,
        title: args.title,
        body: args.body ?? args.title,
        data: {
          href: args.href ?? "/app/booking",
        },
      })
    )
  );
}

export async function notifyUser(args: {
  tenantId: string;
  userId: string;
  title: string;
  body?: string | null;
  href?: string | null;
  appointmentId?: string | null;
  clientId?: string | null;
}) {
  await prisma.notification.create({
    data: {
      tenantId: args.tenantId,
      userId: args.userId,
      type: "GENERIC",
      title: args.title,
      body: args.body ?? null,
      href: args.href ?? null,
      appointmentId: args.appointmentId ?? null,
      clientId: args.clientId ?? null,
    },
  });

  await publishClientUserEvent({
    userId: args.userId,
    name: "notifications.updated",
    data: {
      appointmentId: args.appointmentId ?? null,
      clientId: args.clientId ?? null,
    },
  });

  try {
    await sendPushToUser({
      userId: args.userId,
      title: args.title,
      body: args.body ?? args.title,
      data: {
        href: args.href ?? "/(tabs)",
        appointmentId: args.appointmentId ?? "",
        clientId: args.clientId ?? "",
      },
    });
  } catch {
    return;
  }
}
