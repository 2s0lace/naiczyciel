import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const role = request.cookies.get("role")?.value;

  if (role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("restricted", "edu");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/edu/:path*"],
};
