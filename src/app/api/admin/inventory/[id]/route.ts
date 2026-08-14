import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorized } from "@/lib/admin";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.category === "string") data.category = body.category;
  if (typeof body.quantity === "number") data.quantity = Math.max(0, body.quantity);
  if (typeof body.minThreshold === "number") data.minThreshold = Math.max(0, body.minThreshold);
  if (typeof body.unit === "string") data.unit = body.unit.trim();
  if (typeof body.notes === "string") data.notes = body.notes.trim() || null;

  const item = await prisma.inventoryItem.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  await prisma.inventoryItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
