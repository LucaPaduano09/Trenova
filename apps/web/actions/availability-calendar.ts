"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const slotSchema = z.object({
  date: z.string().min(1),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  isAvailable: z.boolean().optional(),
});

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  slots: z.array(slotSchema),
});

export async function saveTenantAvailabilityCalendar(input: {
  month: string;
  slots: Array<{
    date: string;
    startAt: string;
    endAt: string;
    isAvailable?: boolean;
  }>;
}): Promise<void> {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid availability calendar payload");
  }

  const [year, month] = parsed.data.month.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const normalizedSlots = parsed.data.slots
    .map((slot) => {
      const date = new Date(slot.date);
      const startAt = new Date(slot.startAt);
      const endAt = new Date(slot.endAt);

      if (Number.isNaN(date.getTime())) return null;
      if (Number.isNaN(startAt.getTime())) return null;
      if (Number.isNaN(endAt.getTime())) return null;
      if (endAt <= startAt) return null;

      return {
        tenantId: tenant.id,
        date,
        startAt,
        endAt,
        isAvailable: slot.isAvailable ?? true,
      };
    })
    .filter(Boolean) as Array<{
    tenantId: string;
    date: Date;
    startAt: Date;
    endAt: Date;
    isAvailable: boolean;
  }>;

  await prisma.$transaction(async (tx) => {
    await tx.tenantAvailabilitySlot.deleteMany({
      where: {
        tenantId: tenant.id,
        date: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59, 999),
        },
      },
    });

    for (const slot of normalizedSlots) {
      await tx.tenantAvailabilitySlot.create({
        data: slot,
      });
    }
  });

  revalidatePath("/app/settings/availability");
  revalidatePath("/c/sessions");
}