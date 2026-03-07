import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  const isApp = nextUrl.pathname.startsWith("/app");
  const isClient = nextUrl.pathname.startsWith("/c");

  const isAppAuth =
    nextUrl.pathname === "/app/sign-in" ||
    nextUrl.pathname.startsWith("/app/sign-up") ||
    nextUrl.pathname.startsWith("/app/verify") ||
    nextUrl.pathname.startsWith("/app/forgot-password");

  const isClientAuth =
    nextUrl.pathname === "/c/sign-in" ||
    nextUrl.pathname.startsWith("/c/verify");

  // Protezione area PT
  if (isApp && !isAppAuth) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/app/sign-in", nextUrl));
    }
    if (session.user.role !== "OWNER") {
      return NextResponse.redirect(new URL("/c", nextUrl));
    }
  }

  // Protezione area cliente
  if (isClient && !isClientAuth) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/c/sign-in", nextUrl));
    }
    if (session.user.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/app", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/c/:path*"],
};
