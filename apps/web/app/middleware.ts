import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // lascia passare pagine pubbliche
  if (pathname === "/app/sign-in" || pathname === "/app/verify") {
    return NextResponse.next();
  }

  // proteggi /app/*
  if (pathname.startsWith("/app") && !req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/app/sign-in";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*"],
};
