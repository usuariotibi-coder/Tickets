import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/tickets", label: "Solicitudes", icon: "🎫" },
  { href: "/admin/inventory", label: "Inventario", icon: "📦" },
  { href: "/admin/loans", label: "Requisiciones", icon: "🔄" },
  { href: "/admin/conversations", label: "Conversaciones", icon: "💬" },
  { href: "/admin/users", label: "Usuarios", icon: "👥" },
  { href: "/admin/procedures", label: "Procedimientos", icon: "📄" },
  { href: "/admin/emails", label: "Correos permitidos", icon: "📧" },
  { href: "/admin/blocks", label: "Bloqueos", icon: "🚫" },
  { href: "/admin/settings", label: "Seguridad", icon: "🔒" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id) redirect("/login");
  if (role !== "staff") redirect("/chat");

  const [pendingTickets, activeLoans, lowStock, activeBlocks] = await Promise.all([
    query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM "Ticket" WHERE status = 'pendiente'`
    ).then((r) => r[0].count),
    query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM "Loan" WHERE status = 'prestado'`
    ).then((r) => r[0].count),
    query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM "InventoryItem" WHERE quantity <= "minThreshold"`
    ).then((r) => r[0].count),
    query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM "BlockLog" WHERE "unblockedAt" IS NULL`
    ).then((r) => r[0].count),
  ]);

  const counts: Record<string, number> = {
    "/admin/tickets": pendingTickets,
    "/admin/loans": activeLoans,
    "/admin/inventory": lowStock,
    "/admin/blocks": activeBlocks,
  };

  return (
    <div className="flex min-h-full">
      <AdminSidebar nav={nav} counts={counts} />
      <main className="min-w-0 flex-1 overflow-y-auto bg-brand-light">
        <div className="h-12 lg:hidden" />
        {children}
      </main>
    </div>
  );
}

