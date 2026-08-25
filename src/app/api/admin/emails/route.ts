import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

type AllowedEmailRow = {
  id: string;
  email: string;
  name: string | null;
  note: string | null;
  createdAt: Date;
};

export async function GET() {
  if (!(await requireStaff())) return unauthorized();
  const emails = await query<AllowedEmailRow>(
    `SELECT * FROM "AllowedEmail" ORDER BY "createdAt" DESC`
  );
  return NextResponse.json({ emails });
}

export async function POST(req: Request) {
  if (!(await requireStaff())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").toLowerCase().trim();
  const name = String(body.name || "").trim() || null;
  const note = String(body.note || "").trim() || null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const existing = await queryOne<AllowedEmailRow>(
    'SELECT * FROM "AllowedEmail" WHERE email = $1',
    [email]
  );
  if (existing) {
    return NextResponse.json({ error: "Ese correo ya está en la lista" }, { status: 409 });
  }

  const rows = await query<AllowedEmailRow>(
    `INSERT INTO "AllowedEmail" (email, name, note) VALUES ($1, $2, $3) RETURNING *`,
    [email, name, note]
  );
  const item = rows[0];
  return NextResponse.json({ item }, { status: 201 });
}