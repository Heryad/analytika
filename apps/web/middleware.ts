import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("analytika_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Protect all /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Redirect logged-in users away from /auth/login
  if (pathname === "/auth/login") {
    if (token) {
      const redirectPath = request.nextUrl.searchParams.get("redirect");
      if (redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//")) {
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
  ],
};
