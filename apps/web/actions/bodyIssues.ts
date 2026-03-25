"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BodySide, IssueType } from "@prisma/client";
import { zoneEnum } from "@/lib/bodyIssues";

const listSchema = z.object({
  clientId: z.string().min(1),
});

const upsertSchema = z.object({
  clientId: z.string().min(1),
  zoneKey: zoneEnum,
  side: z.nativeEnum(BodySide),
  type: z.nativeEnum(IssueType).optional(),
  severity: z.coerce.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
  active: z.coerce.boolean().optional(),
});

const toggleSchema = z.object({
  id: z.string().min(1),
});

export async function listClientBodyIssues(clientId: string) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = listSchema.safeParse({ clientId });
  if (!parsed.success) return [];

  return prisma.clientBodyIssue.findMany({
    where: {
      tenantId: tenant.id,
      clientId,
    },
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      zoneKey: true,
      side: true,
      type: true,
      severity: true,
      notes: true,
      active: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function upsertClientBodyIssue(input: {
  clientId: string;
  zoneKey: string;
  side: BodySide;
  type?: IssueType;
  severity?: number | null;
  notes?: string;
  active?: boolean;
}) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const { clientId, zoneKey, side } = parsed.data;

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId: tenant.id },
    select: { slug: true },
  });
  if (!client)
    return { ok: false as const, error: { clientId: ["Cliente non trovato"] } };

  const existing = await prisma.clientBodyIssue.findFirst({
    where: { tenantId: tenant.id, clientId, zoneKey, side },
    select: { id: true },
  });

  const notes = parsed.data.notes?.trim() || null;

  if (existing) {
    await prisma.clientBodyIssue.update({
      where: { id: existing.id },
      data: {
        type: parsed.data.type ?? undefined,
        severity: parsed.data.severity ?? undefined,
        notes,
        active: parsed.data.active ?? undefined,
      },
    });
  } else {
    await prisma.clientBodyIssue.create({
      data: {
        tenantId: tenant.id,
        clientId,
        zoneKey,
        side,
        type: parsed.data.type ?? "PAIN",
        severity: parsed.data.severity ?? null,
        notes,
        active: parsed.data.active ?? true,
      },
    });
  }

  revalidatePath(`/app/clients/${client.slug}`);
  return { ok: true as const };
}

export async function toggleActive(id: string) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = toggleSchema.safeParse({ id });
  if (!parsed.success) return { ok: false as const };

  const row = await prisma.clientBodyIssue.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, active: true, client: { select: { slug: true } } },
  });

  if (!row) return { ok: false as const };

  await prisma.clientBodyIssue.update({
    where: { id: row.id },
    data: { active: !row.active },
  });

  revalidatePath(`/app/clients/${row.client.slug}`);
  return { ok: true as const, active: !row.active };
}
