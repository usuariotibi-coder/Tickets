import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

type InventoryRow = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const FIELD_MAP: Record<string, string> = {
  name: "name",
  category: "category",
  quantity: "quantity",
  minThreshold: '"minThreshold"',
  unit: "unit",
  notes: "notes",
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  const body = await req.json().catch(() => ({}));

  const updates: { col: string; value: unknown }[] = [];
  if (typeof body.name === "string") updates.push({ col: "name", value: body.name.trim() });
  if (typeof body.category === "string") updates.push({ col: "category", value: body.category });
  if (typeof body.quantity === "number")
    updates.push({ col: "quantity", value: Math.max(0, body.quantity) });
  if (typeof body.minThreshold === "number")
    updates.push({ col: "minThreshold", value: Math.max(0, body.minThreshold) });
  if (typeof body.unit === "string") updates.push({ col: "unit", value: body.unit.trim() });
  if (typeof body.notes === "string") updates.push({ col: "notes", value: body.notes.trim() || null });

  if (updates.length === 0) {
    const existing = await queryOne<InventoryRow>('SELECT * FROM "InventoryItem" WHERE id = $1', [
      params.id,
    ]);
    return NextResponse.json({ item: existing });
  }

  const setClause = updates.map((u, i) => `${FIELD_MAP[u.col]} = $${i + 2}`).join(", ");
  const rows = await query<InventoryRow>(
    `UPDATE "InventoryItem" SET ${setClause} WHERE id = $1 RETURNING *`,
    [params.id, ...updates.map((u) => u.value)]
  );
  return NextResponse.json({ item: rows[0] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  await query(`DELETE FROM "InventoryItem" WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}