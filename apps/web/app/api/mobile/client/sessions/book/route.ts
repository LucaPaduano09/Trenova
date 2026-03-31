import { NextResponse } from "next/server";
import { z } from "zod";
import { bookMobileClientSession } from "@/lib/mobile/clientApp";

const bookSessionSchema = z.object({
  slotKey: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bookSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  try {
    const payload = await bookMobileClientSession({
      request,
      slotKey: parsed.data.slotKey,
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }

      if (
        error.message === "SLOT_NOT_FOUND" ||
        error.message === "SLOT_NOT_AVAILABLE" ||
        error.message === "SLOT_ALREADY_BOOKED" ||
        error.message === "CLIENT_ALREADY_BOOKED"
      ) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    console.error("POST /api/mobile/client/sessions/book failed", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
