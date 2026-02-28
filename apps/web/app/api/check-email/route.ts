import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Missing email" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  return NextResponse.json({
    ok: true,
    exists: !!user,
    verified: !!user?.emailVerified,
  });
}
