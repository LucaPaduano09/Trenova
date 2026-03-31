import { NextResponse } from "next/server";
import { z } from "zod";
import { registerClientWithInvite } from "@/lib/invites/registerClientWithInvite";
import { createMobileClientAuthSessionForUserId } from "@/lib/mobile/auth";

const registerInviteSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  inviteToken: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerInviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  try {
    const result = await registerClientWithInvite(parsed.data);

    if (!result.ok) {
      const status =
        result.error === "INTERNAL_SERVER_ERROR"
          ? 500
          : result.error === "EMAIL_ALREADY_USED"
            ? 409
            : 400;

      return NextResponse.json({ error: result.error }, { status });
    }

    const session = await createMobileClientAuthSessionForUserId(result.user.id);
    return NextResponse.json(session);
  } catch (error) {
    console.error("POST /api/mobile/client/auth/register-invite failed", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
