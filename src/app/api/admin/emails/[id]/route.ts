import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  await query(`DELETE FROM "AllowedEmail" WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}