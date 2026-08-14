import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorized } from "@/lib/admin";

export async function GET() {
  if (!(await requireStaff())) return unauthorized();
  const emails = await prisma.allowedEmail.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ emails });
}

export async function POST(req: Request) {
  if (!(await requireStaff())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").toLowerCase().trim();
  const note = String(body.note || "").trim() || null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const existing = await prisma.allowedEmail.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ese correo ya está en la lista" }, { status: 409 });
  }

  const item = await prisma.allowedEmail.create({ data: { email, note } });
  return NextResponse.json({ item }, { status: 201 });
}
