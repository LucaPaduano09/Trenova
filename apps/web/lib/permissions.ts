// lib/permissions.ts
import { auth } from "@/lib/auth";

export async function requireOwner() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER") throw new Error("Forbidden");

  return session.user;
}
