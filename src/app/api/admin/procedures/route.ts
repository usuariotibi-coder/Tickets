import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorized } from "@/lib/admin";

export async function POST(req: Request) {
  if (!(await requireStaff())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  const category = String(body.category || "general").trim();

  if (!title || !content) {
    return NextResponse.json({ error: "Título y contenido son requeridos" }, { status: 400 });
  }

  const procedure = await prisma.procedure.create({
    data: { title, content, category },
  });
  return NextResponse.json({ procedure }, { status: 201 });
}
