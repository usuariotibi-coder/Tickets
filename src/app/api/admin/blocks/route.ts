import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorized } from "@/lib/admin";

export async function GET() {
  if (!(await requireStaff())) return unauthorized();
  const users = await prisma.user.findMany({
    where: { isBlocked: true },
    include: { blockLogs: { orderBy: { blockedAt: "desc" }, take: 1 } },
    orderBy: { blockedAt: "desc" },
  });
  return NextResponse.json({ users });
}
