import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

const validCategories = ["papel", "pilas", "periferico", "otro"];

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

export async function POST(req: Request) {
  if (!(await requireStaff())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const category = String(body.category || "otro");
  const quantity = Math.max(0, parseInt(body.quantity) || 0);
  const minThreshold = Math.max(0, parseInt(body.minThreshold) || 0);
  const unit = String(body.unit || "unidad").trim();
  const notes = String(body.notes || "").trim() || null;

  if (!name || !validCategories.includes(category)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const rows = await query<InventoryRow>(
    `INSERT INTO "InventoryItem" (name, category, quantity, "minThreshold", unit, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, category, quantity, minThreshold, unit, notes]
  );
  const item = rows[0];
  return NextResponse.json({ item }, { status: 201 });
}