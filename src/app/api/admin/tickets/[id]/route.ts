import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorized } from "@/lib/admin";

const validStatuses = ["pendiente", "aprobada", "rechazada", "resuelta"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "");
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const ticket = await prisma.ticket.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json({ ticket });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  await prisma.ticket.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
