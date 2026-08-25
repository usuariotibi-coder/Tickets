import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

type BlockLogRow = {
  id: string;
  reason: string;
  conversation: unknown;
  blockedAt: Date;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: Date | null;
  offTopicCount: number;
  blockLogs: BlockLogRow[];
};

export async function GET() {
  if (!(await requireStaff())) return unauthorized();
  const users = await query<UserRow>(
    `SELECT u.*,
       COALESCE((
         SELECT json_agg(json_build_object('id', bl.id, 'reason', bl.reason, 'conversation', bl.conversation, 'blockedAt', bl."blockedAt") ORDER BY bl."blockedAt" DESC)
         FROM "BlockLog" bl WHERE bl."userId" = u.id
       ), '[]') AS "blockLogs"
     FROM "User" u
     WHERE u."isBlocked" = true
     ORDER BY u."blockedAt" DESC`
  );
  return NextResponse.json({ users });
}