import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite /p/g/{accession} to /project/g/{accession}
  if (pathname.startsWith("/p/g/")) {
    const accession = pathname.slice(5);
    if (accession) {
      const url = request.nextUrl.clone();
      url.pathname = `/project/g/${accession}`;
      return NextResponse.rewrite(url);
    }
  }

  // Rewrite /p/s/{accession} to /project/s/{accession}
  if (pathname.startsWith("/p/s/")) {
    const accession = pathname.slice(5);
    if (accession) {
      const url = request.nextUrl.clone();
      url.pathname = `/project/s/${accession}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/p/g/:path*",
    "/p/s/:path*",
  ],
};
