import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Backward compatibility: redirect old URLs to new format
  // /project/geo/{accession} -> /p/{accession}
  if (pathname.startsWith("/project/geo/")) {
    const accession = pathname.slice(13); // Remove '/project/geo/'
    if (accession) {
      const url = request.nextUrl.clone();
      url.pathname = `/p/${accession}`;
      return NextResponse.redirect(url, 301); // Permanent redirect
    }
  }

  // Backward compatibility: redirect old URLs to new format
  // /project/sra/{accession} -> /p/{accession}
  if (pathname.startsWith("/project/sra/")) {
    const accession = pathname.slice(13); // Remove '/project/sra/'
    if (accession) {
      const url = request.nextUrl.clone();
      url.pathname = `/p/${accession}`;
      return NextResponse.redirect(url, 301); // Permanent redirect
    }
  }

  // Also handle the shorter variants for completeness
  // /project/g/{accession} -> /p/{accession}
  if (pathname.startsWith("/project/g/")) {
    const accession = pathname.slice(11); // Remove '/project/g/'
    if (accession) {
      const url = request.nextUrl.clone();
      url.pathname = `/p/${accession}`;
      return NextResponse.redirect(url, 301);
    }
  }

  // /project/s/{accession} -> /p/{accession}
  if (pathname.startsWith("/project/s/")) {
    const accession = pathname.slice(11); // Remove '/project/s/'
    if (accession) {
      const url = request.nextUrl.clone();
      url.pathname = `/p/${accession}`;
      return NextResponse.redirect(url, 301);
    }
  }

  // /project/gse/{accession} -> /p/{accession} (alternate GEO format)
  if (pathname.startsWith("/project/gse/")) {
    const accession = pathname.slice(13); // Remove '/project/gse/'
    if (accession) {
      const url = request.nextUrl.clone();
      url.pathname = `/p/${accession}`;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/project/geo/:path*",
    "/project/sra/:path*",
    "/project/g/:path*",
    "/project/s/:path*",
    "/project/gse/:path*",
  ],
};
