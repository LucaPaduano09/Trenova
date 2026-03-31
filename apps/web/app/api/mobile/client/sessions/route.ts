import { NextResponse } from "next/server";
import { getMobileClientSessions } from "@/lib/mobile/clientApp";

function toErrorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  console.error("GET /api/mobile/client/sessions failed", error);
  return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") ?? undefined;
    const payload = await getMobileClientSessions({ request, month });
    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}
