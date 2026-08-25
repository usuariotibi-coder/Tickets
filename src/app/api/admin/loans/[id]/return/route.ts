import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

type LoanRow = {
  id: string;
  status: string;
  returnedAt: Date | null;
};

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  const loan = await queryOne<LoanRow>('SELECT * FROM "Loan" WHERE id = $1', [params.id]);
  if (!loan) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const rows = await query<LoanRow>(
    `UPDATE "Loan" SET status = 'devuelto', "returnedAt" = $2 WHERE id = $1 RETURNING *`,
    [params.id, new Date()]
  );
  return NextResponse.json({ loan: rows[0] });
}