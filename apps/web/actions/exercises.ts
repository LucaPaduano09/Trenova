"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { requireTenantFromSession } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

/** ---------------- helpers ---------------- */

function normalizeTagsText(tags: string[]) {
  return tags
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTags(tagsRaw?: string | null) {
  const tags = (tagsRaw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);

  return { tags, tagsText: normalizeTagsText(tags) };
}

function parseRef(refRaw?: unknown): { kind: "c" | "g"; id: string } | null {
  const ref = String(refRaw ?? "");
  if (!ref) return null;
  const [kind, id] = ref.split(":");
  if ((kind === "c" || kind === "g") && id) return { kind, id };
  return null;
}

/** ---------------- schemas ---------------- */

const upsertSchema = z.object({
  // ref: "c:<id>" or "g:<globalId>"
  ref: z.string().min(3, "Ref mancante"),

  name: z.string().min(2, "Nome troppo corto"),
  description: z.string().optional().or(z.literal("")),
  coachTips: z.string().optional().or(z.literal("")),
  imageUrl: z
    .string()
    .url("URL immagine non valida")
    .optional()
    .or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  // per custom: isArchived
  isArchived: z.string().optional().or(z.literal("")),
  // per global: isHidden (nasconde dal PT)
  isHidden: z.string().optional().or(z.literal("")),
});

const createCustomSchema = z.object({
  name: z.string().min(2, "Nome troppo corto"),
  description: z.string().optional().or(z.literal("")),
  coachTips: z.string().optional().or(z.literal("")),
  imageUrl: z
    .string()
    .url("URL immagine non valida")
    .optional()
    .or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  isArchived: z.string().optional().or(z.literal("")),
});

/** ---------------- CREATE ---------------- */

export async function createExercise(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = createCustomSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    coachTips: String(formData.get("coachTips") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    isArchived: String(formData.get("isArchived") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const { tags, tagsText } = splitTags(parsed.data.tags);

  await prisma.tenantExercise.create({
    data: {
      tenantId: tenant.id,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      coachTips: parsed.data.coachTips?.trim() || null,
      imageUrl: parsed.data.imageUrl?.trim() || null,
      tags,
      tagsText,
      isArchived: parsed.data.isArchived === "on",
    },
    select: { id: true },
  });

  revalidatePath("/app/exercises");
  redirect("/app/exercises?flash=created");
}

/** ---------------- UPDATE ---------------- */

/**
 * UPDATE:
 * - se ref = c:<id> -> update TenantExercise (custom)
 * - se ref = g:<globalId> -> upsert TenantExerciseOverride (personalizzazione)
 */
export async function updateExercise(formData: FormData) {
  console.log("UPDATE CHIAMATA");

  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = upsertSchema.safeParse({
    ref: String(formData.get("ref") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    coachTips: String(formData.get("coachTips") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    isArchived: String(formData.get("isArchived") ?? ""),
    isHidden: String(formData.get("isHidden") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const ref = parseRef(parsed.data.ref);
  console.log(
    "REF:",
    parsed.success ? parsed.data.ref : "INVALID",
    "KIND:",
    ref?.kind
  );
  if (!ref) return { ok: false as const, error: { ref: ["Ref non valida"] } };

  const { tags, tagsText } = splitTags(parsed.data.tags);

  // CUSTOM (TenantExercise)
  if (ref.kind === "c") {
    const payload = {
      tenantId: tenant.id,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      coachTips: parsed.data.coachTips?.trim() || null,
      imageUrl: parsed.data.imageUrl?.trim() || null,
      tags,
      tagsText,
      isArchived: parsed.data.isArchived === "on",
    };

    // Proviamo prima a vedere se esiste davvero (multi-tenant safe)
    const existing = await prisma.tenantExercise.findFirst({
      where: { id: ref.id, tenantId: tenant.id },
      select: { id: true },
    });

    if (existing) {
      await prisma.tenantExercise.update({
        where: { id: existing.id },
        data: payload,
      });

      revalidatePath("/app/exercises");
      revalidatePath(
        `/app/exercises/${encodeURIComponent(parsed.data.ref)}/edit`
      );
      redirect("/app/exercises?flash=updated");
    }

    const created = await prisma.tenantExercise.create({
      data: payload,
      select: { id: true },
    });

    revalidatePath("/app/exercises");
    redirect(
      `/app/exercises/${encodeURIComponent(
        `c:${created.id}`
      )}/edit?flash=created`
    );
  }
  // GLOBAL -> OVERRIDE (upsert)
  if (ref.kind === "g") {
    const g = await prisma.globalExercise.findFirst({
      where: { id: ref.id },
      select: { id: true },
    });
    if (!g) return { ok: false as const };

    await prisma.tenantExerciseOverride.upsert({
      where: {
        tenantId_globalExerciseId: {
          tenantId: tenant.id,
          globalExerciseId: g.id,
        },
      },
      create: {
        tenantId: tenant.id,
        globalExerciseId: g.id,
        nameOverride: parsed.data.name.trim(),
        descriptionOverride: parsed.data.description?.trim() || null,
        coachTips: parsed.data.coachTips?.trim() || null,
        imageUrlOverride: parsed.data.imageUrl?.trim() || null,
        tagsOverride: tags,
        isHidden: parsed.data.isHidden === "on",
      },
      update: {
        nameOverride: parsed.data.name.trim(),
        descriptionOverride: parsed.data.description?.trim() || null,
        coachTips: parsed.data.coachTips?.trim() || null,
        imageUrlOverride: parsed.data.imageUrl?.trim() || null,
        tagsOverride: tags,
        isHidden: parsed.data.isHidden === "on",
      },
      select: { id: true },
    });

    revalidatePath("/app/exercises");
    revalidatePath(
      `/app/exercises/${encodeURIComponent(parsed.data.ref)}/edit`
    );
    redirect("/app/exercises?flash=updated");
  }

  return { ok: false as const };
}

/** ---------------- ARCHIVE / RESTORE ---------------- */

export async function archiveExercise(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const ref = parseRef(formData.get("ref"));
  if (!ref) return { ok: false as const };

  // custom -> isArchived (TenantExercise)
  if (ref.kind === "c") {
    await prisma.tenantExercise.update({
      where: { id: ref.id },
      data: { tenantId: tenant.id, isArchived: true },
    });
    revalidatePath("/app/exercises");
    return { ok: true as const };
  }

  // global -> isHidden (override)
  if (ref.kind === "g") {
    await prisma.tenantExerciseOverride.upsert({
      where: {
        tenantId_globalExerciseId: {
          tenantId: tenant.id,
          globalExerciseId: ref.id,
        },
      },
      create: {
        tenantId: tenant.id,
        globalExerciseId: ref.id,
        isHidden: true,
      },
      update: { isHidden: true },
      select: { id: true },
    });
    revalidatePath("/app/exercises");
    return { ok: true as const };
  }

  return { ok: false as const };
}

export async function restoreExercise(formData: FormData) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const ref = parseRef(formData.get("ref"));
  if (!ref) return { ok: false as const };

  if (ref.kind === "c") {
    await prisma.tenantExercise.update({
      where: { id: ref.id },
      data: { tenantId: tenant.id, isArchived: false },
    });
    revalidatePath("/app/exercises");
    return { ok: true as const };
  }

  if (ref.kind === "g") {
    await prisma.tenantExerciseOverride.upsert({
      where: {
        tenantId_globalExerciseId: {
          tenantId: tenant.id,
          globalExerciseId: ref.id,
        },
      },
      create: {
        tenantId: tenant.id,
        globalExerciseId: ref.id,
        isHidden: false,
      },
      update: { isHidden: false },
      select: { id: true },
    });
    revalidatePath("/app/exercises");
    return { ok: true as const };
  }

  return { ok: false as const };
}

/** ---------------- LIST (MERGED) ---------------- */

export type ExercisesFilters = {
  q?: string;
  state?: "active" | "archived" | "all";
  sort?: "updated" | "name" | "newest" | "oldest";
  image?: "any" | "with" | "without";
  tag?: string; // contains
};

export type ExerciseRow = {
  ref: string; // "c:<id>" or "g:<id>"
  kind: "custom" | "global";
  name: string;
  imageUrl: string | null;
  tags: string[];
  isArchived: boolean;
  updatedAt: Date;
};

export async function listExercises(
  filters?: ExercisesFilters
): Promise<ExerciseRow[]> {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const q = (filters?.q ?? "").trim().toLowerCase();
  const state = filters?.state ?? "active";
  const sort = filters?.sort ?? "updated";
  const image = filters?.image ?? "any";
  const tag = (filters?.tag ?? "").trim().toLowerCase();

  // ------- CUSTOM (TenantExercise)
  const whereCustom: any = { tenantId: tenant.id };
  if (state === "active") whereCustom.isArchived = false;
  if (state === "archived") whereCustom.isArchived = true;

  if (image === "with") whereCustom.imageUrl = { not: null };
  if (image === "without") {
    whereCustom.OR = [{ imageUrl: null }, { imageUrl: { isSet: false } }];
  }

  if (q) {
    whereCustom.AND = [
      ...(whereCustom.AND ?? []),
      {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { tagsText: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (tag) {
    whereCustom.AND = [
      ...(whereCustom.AND ?? []),
      { tagsText: { contains: tag, mode: "insensitive" } },
    ];
  }

  const custom = await prisma.tenantExercise.findMany({
    where: whereCustom,
    orderBy:
      sort === "name"
        ? [{ name: "asc" }]
        : sort === "newest"
        ? [{ createdAt: "desc" }]
        : sort === "oldest"
        ? [{ createdAt: "asc" }]
        : [{ updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      imageUrl: true,
      tags: true,
      tagsText: true,
      isArchived: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  // ------- GLOBAL (catalog) + OVERRIDES (tenant)
  const [globals, overrides] = await Promise.all([
    prisma.globalExercise.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        tags: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy:
        sort === "name"
          ? [{ name: "asc" }]
          : sort === "newest"
          ? [{ createdAt: "desc" }]
          : sort === "oldest"
          ? [{ createdAt: "asc" }]
          : [{ updatedAt: "desc" }],
    }),
    prisma.tenantExerciseOverride.findMany({
      where: { tenantId: tenant.id },
      select: {
        globalExerciseId: true,
        nameOverride: true,
        descriptionOverride: true,
        coachTips: true,
        imageUrlOverride: true,
        tagsOverride: true,
        isHidden: true,
        updatedAt: true,
      },
    }),
  ]);

  const ovMap = new Map<string, (typeof overrides)[number]>();
  for (const o of overrides) ovMap.set(String(o.globalExerciseId), o);

  let mergedGlobal: ExerciseRow[] = globals.map((g) => {
    const o = ovMap.get(String(g.id));
    const name = o?.nameOverride ?? g.name;
    const imageUrl = o?.imageUrlOverride ?? g.imageUrl ?? null;
    const tagsArr = o?.tagsOverride?.length ? o.tagsOverride : g.tags ?? [];
    const isArchived = !!o?.isHidden;
    const updatedAt = o?.updatedAt ?? g.updatedAt;

    return {
      ref: `g:${String(g.id)}`,
      kind: "global",
      name,
      imageUrl,
      tags: tagsArr,
      isArchived,
      updatedAt,
    };
  });

  if (state === "active")
    mergedGlobal = mergedGlobal.filter((x) => !x.isArchived);
  if (state === "archived")
    mergedGlobal = mergedGlobal.filter((x) => x.isArchived);

  const matchText = (row: ExerciseRow) => {
    const t = normalizeTagsText(row.tags);
    const n = row.name.toLowerCase();
    if (q && !(n.includes(q) || t.includes(q))) return false;
    if (tag && !t.includes(tag)) return false;
    if (image === "with" && !row.imageUrl) return false;
    if (image === "without" && row.imageUrl) return false;
    return true;
  };
  mergedGlobal = mergedGlobal.filter(matchText);

  const mappedCustom: ExerciseRow[] = custom.map((c) => ({
    ref: `c:${c.id}`,
    kind: "custom",
    name: c.name,
    imageUrl: c.imageUrl ?? null,
    tags: c.tags ?? [],
    isArchived: !!c.isArchived,
    updatedAt: c.updatedAt,
  }));

  const all = [...mappedCustom, ...mergedGlobal];

  all.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "oldest") return +a.updatedAt - +b.updatedAt;
    return +b.updatedAt - +a.updatedAt;
  });

  return all;
}

/** ---------------- GET (for edit) ---------------- */

export async function getExercise(ref: string) {
  await requireOwner();
  const { tenant } = await requireTenantFromSession();

  const parsed = parseRef(ref);
  if (!parsed) return null;

  // CUSTOM edit (TenantExercise)
  if (parsed.kind === "c") {
    const ex = await prisma.tenantExercise.findFirst({
      where: { id: parsed.id, tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        description: true,
        coachTips: true,
        imageUrl: true,
        tags: true,
        isArchived: true,
      },
    });
    if (!ex) return null;

    return {
      ref: `c:${ex.id}`,
      kind: "custom" as const,
      name: ex.name,
      description: ex.description ?? "",
      coachTips: ex.coachTips ?? "",
      imageUrl: ex.imageUrl ?? "",
      tags: (ex.tags ?? []).join(", "),
      isArchived: !!ex.isArchived,
      isHidden: false,
    };
  }

  // GLOBAL edit via override
  if (parsed.kind === "g") {
    const g = await prisma.globalExercise.findFirst({
      where: { id: parsed.id },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        tags: true,
      },
    });
    if (!g) return null;

    const o = await prisma.tenantExerciseOverride.findUnique({
      where: {
        tenantId_globalExerciseId: {
          tenantId: tenant.id,
          globalExerciseId: g.id,
        },
      },
      select: {
        nameOverride: true,
        descriptionOverride: true,
        coachTips: true,
        imageUrlOverride: true,
        tagsOverride: true,
        isHidden: true,
      },
    });

    const tagsArr = o?.tagsOverride?.length ? o.tagsOverride : g.tags ?? [];

    return {
      ref: `g:${String(g.id)}`,
      kind: "global" as const,
      name: o?.nameOverride ?? g.name,
      description: o?.descriptionOverride ?? g.description ?? "",
      coachTips: o?.coachTips ?? "",
      imageUrl: o?.imageUrlOverride ?? g.imageUrl ?? "",
      tags: (tagsArr ?? []).join(", "),
      isArchived: false,
      isHidden: !!o?.isHidden,
    };
  }

  return null;
}
