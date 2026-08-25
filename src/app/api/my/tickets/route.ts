import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

type TicketRow = {
  id: string;
  number: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  loan: {
    status: string;
    borrowedAt: Date | null;
    returnedAt: Date | null;
  } | null;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await query<TicketRow>(
    `SELECT
       t.id, t.number, t.title, t.description, t.category, t.priority, t.status,
       t."createdAt", t."updatedAt",
       CASE WHEN l.id IS NULL THEN NULL ELSE
         json_build_object('status', l.status, 'borrowedAt', l."borrowedAt", 'returnedAt', l."returnedAt")
       END AS loan
     FROM "Ticket" t
     LEFT JOIN "Loan" l ON l."ticketId" = t.id
     WHERE t."userId" = $1
     ORDER BY t."createdAt" DESC`,
    [session.user.id]
  );

  const tickets = rows.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    loan: t.loan
      ? {
          ...t.loan,
          borrowedAt: t.loan.borrowedAt ? t.loan.borrowedAt.toISOString() : null,
          returnedAt: t.loan.returnedAt ? t.loan.returnedAt.toISOString() : null,
        }
      : null,
  }));

  return NextResponse.json({ tickets });
}