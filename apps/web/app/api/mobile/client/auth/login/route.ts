import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateClientCredentials,
  createMobileClientAuthSessionForUserId,
} from "@/lib/mobile/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 400 });
  }

  try {
    const user = await authenticateClientCredentials(parsed.data);

    if (!user) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const session = await createMobileClientAuthSessionForUserId(user.id);
    return NextResponse.json(session);
  } catch (error) {
    console.error("POST /api/mobile/client/auth/login failed", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
