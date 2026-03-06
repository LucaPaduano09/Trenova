import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getCurrentClient() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/c/sign-in");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/app");
  }

  const client = await prisma.client.findFirst({
    where: {
      userId: session.user.id,
      archivedAt: null,
    },
    include: {
      profile: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
        },
      },
    },
  });

  if (!client) {
    redirect("/c/sign-in");
  }

  return {
    session,
    user: session.user,
    client,
  };
}