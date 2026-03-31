import { NextResponse } from "next/server";
import { getMobileClientWorkouts } from "@/lib/mobile/clientApp";

function toErrorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  console.error("GET /api/mobile/client/workouts failed", error);
  return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const payload = await getMobileClientWorkouts(request);
    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}
