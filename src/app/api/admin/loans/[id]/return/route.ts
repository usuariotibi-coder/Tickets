import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorized } from "@/lib/admin";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  const loan = await prisma.loan.findUnique({ where: { id: params.id } });
  if (!loan) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const updated = await prisma.loan.update({
    where: { id: params.id },
    data: { status: "devuelto", returnedAt: new Date() },
  });
  return NextResponse.json({ loan: updated });
}
