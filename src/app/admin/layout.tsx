import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/signout-button";

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

  return (
    <div className="flex h-full">
      <aside className="flex w-60 flex-col border-r border-white/10 bg-brand-dark">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            TI
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Departamento de TI</p>
            <p className="text-xs text-brand-light/70">Panel de control</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-light/80 hover:bg-white/10 hover:text-white"
            >
              <span>{n.icon}</span>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <a
            href="/chat"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-light/80 hover:bg-white/10 hover:text-white"
          >
            <span>💬</span> Ir al chat
          </a>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-brand-light">{children}</main>
    </div>
  );
}

