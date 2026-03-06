import type { Prisma } from "@prisma/client";
import { slugify } from "@/lib/utils/slugify";

export async function makeUniqueClientSlug(
  tx: Prisma.TransactionClient,
  tenantId: string,
  base: string
) {
  const cleanBase = slugify(base) || "client";
  let slug = cleanBase;

  for (let i = 0; i < 50; i++) {
    const exists = await tx.client.findFirst({
      where: { tenantId, slug },
      select: { id: true },
    });

    if (!exists) return slug;
    slug = `${cleanBase}-${i + 2}`;
  }

  return `${cleanBase}-${Date.now()}`;
}