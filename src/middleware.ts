import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

// API routes validate JWT in route handlers — do not use auth.protect() here
// (protect-rewrite breaks cross-origin Bearer tokens from the UI).
const isPublicRoute = createRouteMatcher(["/", "/api/(.*)"]);

function corsHeaders(origin: string | null): Headers {
  const allowed = new Set(
    [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter(Boolean) as string[]
  );
  const headers = new Headers();
  if (origin && allowed.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Requested-With, X-E2E-Role, X-Demo-Staff-Id, X-Demo-As-Patient, X-Demo-Email, X-Demo-Name"
  );
  return headers;
}

const clerkHandler = clerkMiddleware(async (auth, request) => {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: cors });
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const response = NextResponse.next();
  cors.forEach((value, key) => response.headers.set(key, value));
  return response;
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: cors });
  }

  if (process.env.E2E_TEST_MODE === "true") {
    const response = NextResponse.next();
    cors.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  return clerkHandler(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
