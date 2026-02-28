const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({ select: { id: true } });
  const owner = await prisma.user.findFirst({
    where: { role: "OWNER" },
    select: { id: true, tenantId: true },
  });

  if (!tenant || !owner) {
    console.log("Serve almeno 1 tenant e 1 owner per test");
    return;
  }

  const n = await prisma.notification.create({
    data: {
      tenantId: owner.tenantId || tenant.id,
      userId: owner.id,
      type: "GENERIC",
      title: "Test notifica",
      body: "Hello 🔔",
      href: "/app/booking",
    },
  });

  console.log("CREATED", n.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
