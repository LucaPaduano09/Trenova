import { prisma } from "@/lib/db";

export async function getInviteByToken(token: string) {
  return prisma.clientInvite.findUnique({
    where: { token },
  });
}