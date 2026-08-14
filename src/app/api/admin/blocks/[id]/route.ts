import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorized } from "@/lib/admin";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();

  const blockLog = await prisma.blockLog.findUnique({ where: { id: params.id } });
  if (!blockLog) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: blockLog.userId },
      data: { isBlocked: false, blockedReason: null, blockedAt: null },
    }),
    prisma.blockLog.update({
      where: { id: blockLog.id },
      data: { unblockedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
