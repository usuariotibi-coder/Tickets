import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

const validStatuses = ["pendiente", "aprobada", "rechazada", "resuelta"];

type TicketRow = {
  id: string;
  status: string;
};

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

  const rows = await query<TicketRow>(
    `UPDATE "Ticket" SET status = $2 WHERE id = $1 RETURNING *`,
    [params.id, status]
  );
  return NextResponse.json({ ticket: rows[0] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireStaff())) return unauthorized();
  await query(`DELETE FROM "Ticket" WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}