import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

type UserRow = { id: string; password: string | null };

export async function POST(req: Request) {
  const session = await requireStaff();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  const user = await queryOne<UserRow>('SELECT * FROM "User" WHERE id = $1', [
    session.user.id,
  ]);
  if (!user?.password) {
    return NextResponse.json({ error: "Este usuario no tiene contraseña." }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await query(`UPDATE "User" SET password = $2 WHERE id = $1`, [user.id, hash]);

  return NextResponse.json({ ok: true });
}