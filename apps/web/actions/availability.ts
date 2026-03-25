"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const availabilityRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(1439),
  endMin: z.number().int().min(1).max(1440),
  isActive: z.boolean().optional(),
});

const schema = z.object({
  rules: z.array(availabilityRuleSchema),
});

export async function saveTenantAvailability(input: {
  rules: Array<{
    weekday: number;
    startMin: number;
    endMin: number;
    isActive?: boolean;
  }>;
}) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid availability data");
  }

  const normalizedRules = parsed.data.rules
    .filter((r) => r.endMin > r.startMin)
    .map((r) => ({
      tenantId: tenant.id,
      weekday: r.weekday,
      startMin: r.startMin,
      endMin: r.endMin,
      isActive: r.isActive ?? true,
    }));

  await prisma.$transaction(async (tx) => {
    await tx.tenantAvailabilityRule.deleteMany({
      where: { tenantId: tenant.id },
    });

    for (const rule of normalizedRules) {
      await tx.tenantAvailabilityRule.create({
        data: rule,
      });
    }
  });

  revalidatePath("/app/settings/availability");
  revalidatePath("/c/sessions");
}