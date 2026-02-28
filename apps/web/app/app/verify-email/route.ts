// apps/web/app/app/verify-email/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const email = (url.searchParams.get("email") ?? "").toLowerCase();

  const bad = new URL("/app/sign-in", url.origin);
  bad.searchParams.set("verified", "0");

  if (!token || !email) return NextResponse.redirect(bad);

  const vt = await prisma.verificationToken.findFirst({
    where: { token },
    select: { identifier: true, expires: true },
  });

  if (!vt || vt.identifier.toLowerCase() !== email || vt.expires < new Date()) {
    return NextResponse.redirect(bad);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { token } }),
  ]);

  const ok = new URL("/app/sign-in", url.origin);
  ok.searchParams.set("verified", "1");
  return NextResponse.redirect(ok);
}
