// apps/web/app/app/verify-email/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const email = url.searchParams.get("email") ?? "";

  if (!token || !email) {
    return NextResponse.redirect(new URL("/app/sign-in?verified=0", url));
  }

  const vt = await prisma.verificationToken.findUnique({
    where: { token },
    select: { identifier: true, expires: true, token: true },
  });

  if (!vt || vt.identifier !== email || vt.expires < new Date()) {
    return NextResponse.redirect(new URL("/app/sign-in?verified=0", url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return NextResponse.redirect(new URL("/app/sign-in?verified=1", url));
}
