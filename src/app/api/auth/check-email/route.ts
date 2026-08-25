import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

type UserRow = { id: string; email: string; role: string };
type AllowedEmailRow = { id: string; email: string };

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "Correo requerido" }, { status: 400 });
  }

  const user = await queryOne<UserRow>('SELECT * FROM "User" WHERE email = $1', [email]);
  if (user?.role === "staff") return NextResponse.json({ method: "password" });

  const allowed = await queryOne<AllowedEmailRow>(
    'SELECT * FROM "AllowedEmail" WHERE email = $1',
    [email]
  );
  if (!allowed) return NextResponse.json({ method: "denied" });

  return NextResponse.json({ method: "direct" });
}