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
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.content === "string") data.content = body.content.trim();
  if (typeof body.category === "string") data.category = body.category.trim();

  const procedure = await prisma.procedure.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json({ procedure });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  await prisma.procedure.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
