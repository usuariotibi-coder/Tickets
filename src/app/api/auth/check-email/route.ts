import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "Correo requerido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.role === "staff") return NextResponse.json({ method: "password" });

  const allowed = await prisma.allowedEmail.findUnique({ where: { email } });
  if (!allowed) return NextResponse.json({ method: "denied" });

  return NextResponse.json({ method: "direct" });
}
