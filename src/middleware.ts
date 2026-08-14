import { NextResponse, type NextRequest } from "next/server";

const WINDOW_MS = 60_000;
const LIMITS: Record<string, number> = {
  "/api/auth/callback/credentials": 10,
  "/api/auth/check-email": 20,
  "/api/chat": 30,
};

const hits = new Map<string, { count: number; resetAt: number }>();

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const limit = LIMITS[path];
  if (!limit) return NextResponse.next();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const key = `${ip}:${path}`;
  const now = Date.now();

  let entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  entry.count += 1;
  hits.set(key, entry);

  if (entry.count > limit) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/check-email", "/api/auth/callback/credentials", "/api/chat"],
};
