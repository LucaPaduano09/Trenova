import { prisma } from "../lib/db";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: ts-node scripts/bootstrap-owner.ts you@email.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("User not found. Do a sign-in once to create it.");
    process.exit(1);
  }

  if (user.tenantId) {
    console.log("User already has tenantId:", user.tenantId);
    process.exit(0);
  }

  const baseName = email.split("@")[0].slice(0, 40);
  const slugBase = slugify(baseName) || "coach";
  let slug = slugBase;

  for (let i = 0; i < 50; i++) {
    const exists = await prisma.tenant.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${slugBase}-${i + 2}`;
  }

  const tenant = await prisma.tenant.create({
    data: { name: baseName, slug, email },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tenantId: tenant.id,
      role: "OWNER",
      fullName: user.fullName ?? baseName,
    },
  });

  console.log("✅ Linked user to tenant:", { email, tenantSlug: slug });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
