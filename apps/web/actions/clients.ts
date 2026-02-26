"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createClientSchema = z.object({
  fullName: z.string().min(2, "Nome troppo corto"),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function makeUniqueClientSlug(tenantId: string, base: string) {
  const cleanBase = slugify(base) || "client";
  let slug = cleanBase;

  for (let i = 0; i < 50; i++) {
    const exists = await prisma.client.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      select: { id: true },
    });

    if (!exists) return slug;
    slug = `${cleanBase}-${i + 2}`;
  }

  return `${cleanBase}-${Date.now()}`;
}

export async function createClient(formData: FormData) {
  // RBAC
  await requireOwner();

  const { tenant } = await requireTenantFromSession();
  const tenantId = tenant.id;

  const parsed = createClientSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const fullName = parsed.data.fullName.trim();
  const email = parsed.data.email?.trim() || null;
  const phone = parsed.data.phone?.trim() || null;
  const notes = parsed.data.notes?.trim() || null;

  const slug = await makeUniqueClientSlug(tenantId, fullName);

  const client = await prisma.client.create({
    data: {
      tenantId,
      slug,
      fullName,
      email,
      phone,
      notes,
      status: "ACTIVE",
    },
    select: { id: true, slug: true },
  });

  revalidatePath("/app/clients");
  return { ok: true as const, client };
}

export type ClientsFilters = {
  q?: string;
  state?: "active" | "archived" | "all";
  created?: "all" | "7d" | "30d" | "90d";
  sort?: "new" | "old" | "name";
  email?: "any" | "with" | "without";
  phone?: "any" | "with" | "without";
};

function since(created?: ClientsFilters["created"]) {
  const now = new Date();
  const days =
    created === "7d" ? 7 : created === "30d" ? 30 : created === "90d" ? 90 : 0;
  if (!days) return null;
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
}

export async function listClients(filters: ClientsFilters = {}) {
  const user = await requireOwner();
  const tenantId = user.tenantId;

  const q = (filters.q ?? "").trim();
  const state = filters.state ?? "active";
  const created = filters.created ?? "all";
  const sort = filters.sort ?? "new";
  const email = filters.email ?? "any";
  const phone = filters.phone ?? "any";

  const createdGte = since(created);

  // Costruiamo tutto con AND, e dentro mettiamo OR dove serve (Mongo safe)
  const and: any[] = [{ tenantId }];

  if (state === "active") {
    and.push({
      OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
    });
  } else if (state === "archived") {
    and.push({ archivedAt: { not: null } });
  }
  if (createdGte) {
    and.push({ createdAt: { gte: createdGte } });
  }
  if (q) {
    and.push({
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (email === "with") {
    and.push({ email: { not: null } });
  } else if (email === "without") {
    and.push({ OR: [{ email: null }, { email: { isSet: false } }] });
  }
  if (phone === "with") {
    and.push({ phone: { not: null } });
  } else if (phone === "without") {
    and.push({ OR: [{ phone: null }, { phone: { isSet: false } }] });
  }

  const where = { AND: and };

  const orderBy =
    sort === "name"
      ? [{ fullName: "asc" as "asc" }]
      : sort === "old"
      ? [{ createdAt: "asc" as "asc" }]
      : [{ createdAt: "desc" as "desc" }];

  return prisma.client.findMany({
    where,
    orderBy,
    select: {
      id: true,
      slug: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      archivedAt: true,
    },
  });
}
