import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  return session.user;
}

export async function requireOwner() {
  const user = await requireUser();

  if (user.role !== "OWNER" || !user.tenantId) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export async function requireClient() {
  const user = await requireUser();

  if (user.role !== "CLIENT") {
    throw new Error("FORBIDDEN");
  }

  return user;
}