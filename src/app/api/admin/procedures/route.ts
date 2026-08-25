import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireStaff, unauthorized } from "@/lib/admin";

type ProcedureRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function POST(req: Request) {
  if (!(await requireStaff())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  const category = String(body.category || "general").trim();

  if (!title || !content) {
    return NextResponse.json({ error: "Título y contenido son requeridos" }, { status: 400 });
  }

  const rows = await query<ProcedureRow>(
    `INSERT INTO "Procedure" (title, content, category) VALUES ($1, $2, $3) RETURNING *`,
    [title, content, category]
  );
  const procedure = rows[0];
  return NextResponse.json({ procedure }, { status: 201 });
}