"use server";

import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { requireOwner } from "@/lib/permissions";
import {
  publishClientUserEvent,
  publishTrainerTenantEvent,
} from "@/lib/realtime";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const bookingRequestSchema = z.object({
  appointmentId: z.string().min(1),
});

async function resolvePendingAppointment(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = bookingRequestSchema.safeParse({
    appointmentId: formData.get("appointmentId")?.toString(),
  });

  if (!parsed.success) {
    throw new Error("Richiesta non valida");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: parsed.data.appointmentId,
      tenantId: tenant.id,
      status: "PENDING",
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
    select: {
      id: true,
      tenantId: true,
      clientId: true,
      startsAt: true,
      endsAt: true,
      client: {
        select: {
          slug: true,
          fullName: true,
          userId: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new Error("Richiesta non trovata");
  }

  return appointment;
}

export async function acceptBookingRequest(formData: FormData) {
  const appointment = await resolvePendingAppointment(formData);

  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId: appointment.tenantId,
      id: { not: appointment.id },
      status: { not: "CANCELED" },
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      startsAt: { lt: appointment.endsAt },
      endsAt: { gt: appointment.startsAt },
    },
    select: { id: true },
  });

  if (conflict) {
    throw new Error("Esiste gia una sessione in questo intervallo");
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "SCHEDULED",
      notes:
        "Prenotazione richiesta da app cliente e approvata dal personal trainer",
    },
  });

  if (appointment.client.userId) {
    await notifyUser({
      tenantId: appointment.tenantId,
      userId: appointment.client.userId,
      title: "Prenotazione confermata",
      body: `La tua richiesta per ${new Intl.DateTimeFormat("it-IT", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(appointment.startsAt)} e stata accettata.`,
      href: "/c/sessions",
      appointmentId: appointment.id,
      clientId: appointment.clientId,
    });

    await publishClientUserEvent({
      userId: appointment.client.userId,
      name: "booking.approved",
      data: {
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        status: "SCHEDULED",
        title: "Prenotazione confermata",
        body: `La tua richiesta per ${new Intl.DateTimeFormat("it-IT", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(appointment.startsAt)} e stata accettata.`,
        href: "/c/sessions",
      },
    });
  }

  await publishTrainerTenantEvent({
    tenantId: appointment.tenantId,
    name: "booking.approved",
    data: {
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      status: "SCHEDULED",
    },
  });

  revalidatePath("/app/booking");
  revalidatePath(`/app/clients/${appointment.client.slug}`);
  revalidatePath(`/app/clients/${appointment.client.slug}?tab=sessions`);
  revalidatePath("/c/sessions");

  redirect("/app/booking?range=all");
}

export async function rejectBookingRequest(formData: FormData) {
  const appointment = await resolvePendingAppointment(formData);

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "CANCELED",
      notes:
        "Richiesta di prenotazione rifiutata dal personal trainer",
    },
  });

  if (appointment.client.userId) {
    await notifyUser({
      tenantId: appointment.tenantId,
      userId: appointment.client.userId,
      title: "Richiesta non approvata",
      body: `La richiesta per ${new Intl.DateTimeFormat("it-IT", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(appointment.startsAt)} non e stata approvata dal trainer.`,
      href: "/c/sessions",
      appointmentId: appointment.id,
      clientId: appointment.clientId,
    });

    await publishClientUserEvent({
      userId: appointment.client.userId,
      name: "booking.rejected",
      data: {
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        status: "CANCELED",
        title: "Richiesta non approvata",
        body: `La richiesta per ${new Intl.DateTimeFormat("it-IT", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(appointment.startsAt)} non e stata approvata dal trainer.`,
        href: "/c/sessions",
      },
    });
  }

  await publishTrainerTenantEvent({
    tenantId: appointment.tenantId,
    name: "booking.rejected",
    data: {
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      status: "CANCELED",
    },
  });

  revalidatePath("/app/booking");
  revalidatePath(`/app/clients/${appointment.client.slug}`);
  revalidatePath(`/app/clients/${appointment.client.slug}?tab=sessions`);
  revalidatePath("/c/sessions");

  redirect("/app/booking?range=all");
}
