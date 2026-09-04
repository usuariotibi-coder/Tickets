import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

type AllowedEmailRow = {
  id: string;
  email: string;
  name: string | null;
  note: string | null;
};

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  await query(`DELETE FROM "AllowedEmail" WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();

  const current = await queryOne<AllowedEmailRow>(
    'SELECT * FROM "AllowedEmail" WHERE id = $1',
    [params.id]
  );
  if (!current) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || current.email).toLowerCase().trim();
  const name = typeof body.name === "string" ? body.name.trim() || null : current.name;
  const note = typeof body.note === "string" ? body.note.trim() || null : current.note;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const emailConflict = await queryOne<AllowedEmailRow>(
    'SELECT * FROM "AllowedEmail" WHERE email = $1 AND id <> $2',
    [email, params.id]
  );
  if (emailConflict) {
    return NextResponse.json({ error: "Ese correo ya está en la lista" }, { status: 409 });
  }

  if (email !== current.email) {
    const userConflict = await queryOne<{ id: string }>(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );
    if (userConflict) {
      return NextResponse.json(
        { error: "El nuevo correo ya pertenece a otro usuario" },
        { status: 409 }
      );
    }
  }

  const rows = await query<AllowedEmailRow>(
    `UPDATE "AllowedEmail" SET email = $2, name = $3, note = $4 WHERE id = $1 RETURNING *`,
    [params.id, email, name, note]
  );

  if (email !== current.email) {
    await query(`UPDATE "User" SET email = $2 WHERE email = $1`, [current.email, email]);
  }
  if (name) {
    await query(`UPDATE "User" SET name = $2 WHERE email = $1`, [email, name]);
  }

  return NextResponse.json({ item: rows[0] });
}