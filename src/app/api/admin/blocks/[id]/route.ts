import { NextResponse } from "next/server";
import { query, queryOne, runTransaction } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

type BlockLogRow = { id: string; userId: string };

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();

  const blockLog = await queryOne<BlockLogRow>('SELECT * FROM "BlockLog" WHERE id = $1', [
    params.id,
  ]);
  if (!blockLog) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await runTransaction(async (q) => {
    await q(
      `UPDATE "User" SET "isBlocked" = false, "blockedReason" = NULL, "blockedAt" = NULL WHERE id = $1`,
      [blockLog.userId]
    );
    await q(`UPDATE "BlockLog" SET "unblockedAt" = $2 WHERE id = $1`, [
      blockLog.id,
      new Date(),
    ]);
  });

  return NextResponse.json({ ok: true });
}