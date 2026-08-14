import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Badge, STATUS_LABELS, STATUS_STYLES, formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [pendingTickets, totalItems, inventoryItems, activeLoans, recentTickets, recentConversations] =
    await Promise.all([
      prisma.ticket.count({ where: { status: "pendiente" } }),
      prisma.inventoryItem.count(),
      prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
      prisma.loan.count({ where: { status: "prestado" } }),
      prisma.ticket.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
      prisma.conversation.findMany({
        take: 6,
        orderBy: { updatedAt: "desc" },
        include: { user: true, _count: { select: { messages: true } } },
      }),
    ]);

  const outOfStock = inventoryItems.filter((i) => i.quantity <= 0);
  const lowStock = inventoryItems.filter((i) => i.quantity > 0 && i.quantity <= i.minThreshold);

  const cards = [
    { label: "Solicitudes pendientes", value: pendingTickets, icon: "🎫", href: "/admin/tickets", color: "bg-amber-50 text-amber-700" },
    { label: "Artículos en inventario", value: totalItems, icon: "📦", href: "/admin/inventory", color: "bg-brand-600/5 text-brand-700" },
    { label: "Préstamos activos", value: activeLoans, icon: "🔄", href: "/admin/loans", color: "bg-green-50 text-green-700" },
    { label: "Artículos sin stock", value: outOfStock.length + lowStock.length, icon: "⚠️", href: "/admin/inventory", color: "bg-red-50 text-red-700" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen del departamento de TI" />
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow ${c.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-3xl font-bold text-slate-900">{c.value}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-600">{c.label}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Solicitudes recientes</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {recentTickets.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">Sin solicitudes todavía.</p>
              ) : (
                recentTickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/admin/tickets/${t.id}`}
                    className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        #{t.number} · {t.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.user.name} · {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <Badge label={STATUS_LABELS[t.status] || t.status} className={STATUS_STYLES[t.status]} />
                  </Link>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Conversaciones recientes</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {recentConversations.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">Sin conversaciones todavía.</p>
              ) : (
                recentConversations.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/conversations/${c.id}`}
                    className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{c.user.name}</p>
                      <p className="text-xs text-slate-500">
                        {c._count.messages} mensajes · {formatDate(c.updatedAt)}
                      </p>
                    </div>
                    <span className="text-xs text-brand-600">Ver</span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

