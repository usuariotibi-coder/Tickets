import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorized } from "@/lib/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  await prisma.allowedEmail.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
