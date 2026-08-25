import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

type ProcedureRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
};

const FIELD_MAP: Record<string, string> = {
  title: "title",
  content: "content",
  category: "category",
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  const body = await req.json().catch(() => ({}));

  const updates: { col: string; value: unknown }[] = [];
  if (typeof body.title === "string") updates.push({ col: "title", value: body.title.trim() });
  if (typeof body.content === "string") updates.push({ col: "content", value: body.content.trim() });
  if (typeof body.category === "string") updates.push({ col: "category", value: body.category.trim() });

  if (updates.length === 0) {
    const existing = await queryOne<ProcedureRow>('SELECT * FROM "Procedure" WHERE id = $1', [
      params.id,
    ]);
    return NextResponse.json({ procedure: existing });
  }

  const setClause = updates.map((u, i) => `${FIELD_MAP[u.col]} = $${i + 2}`).join(", ");
  const rows = await query<ProcedureRow>(
    `UPDATE "Procedure" SET ${setClause} WHERE id = $1 RETURNING *`,
    [params.id, ...updates.map((u) => u.value)]
  );
  return NextResponse.json({ procedure: rows[0] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  await query(`DELETE FROM "Procedure" WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}