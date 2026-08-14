import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorized } from "@/lib/admin";

const validCategories = ["papel", "pilas", "periferico", "otro"];

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

  const item = await prisma.inventoryItem.create({
    data: { name, category, quantity, minThreshold, unit, notes },
  });
  return NextResponse.json({ item }, { status: 201 });
}
