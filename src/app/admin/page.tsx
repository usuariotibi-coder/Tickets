import Link from "next/link";
import { query } from "@/lib/db";
import { PageHeader, Badge, STATUS_LABELS, STATUS_STYLES, formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type UserObj = { id: string; name: string; email: string; role: string };
type TicketRow = {
  id: string;
  number: number;
  title: string;
  status: string;
  createdAt: Date;
  user: UserObj;
};
type InventoryRow = { id: string; quantity: number; minThreshold: number };
type ConversationRow = {
  id: string;
  updatedAt: Date;
  user: UserObj;
  _count: { messages: number };
};

export default async function AdminDashboard() {
  const [pendingTickets, totalItems, inventoryItems, activeLoans, recentTickets, recentConversations] =
    await Promise.all([
      query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM "Ticket" WHERE status = 'pendiente'`
      ).then((r) => r[0].count),
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "InventoryItem"`).then(
        (r) => r[0].count
      ),
      query<InventoryRow>(`SELECT * FROM "InventoryItem" ORDER BY name ASC`),
      query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM "Loan" WHERE status = 'prestado'`
      ).then((r) => r[0].count),
      query<TicketRow>(
        `SELECT t.*, json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS "user"
         FROM "Ticket" t
         JOIN "User" u ON u.id = t."userId"
         ORDER BY t."createdAt" DESC LIMIT 6`
      ),
      query<ConversationRow>(
        `SELECT c.*,
           json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS "user",
           json_build_object('messages', (SELECT COUNT(*)::int FROM "Message" m WHERE m."conversationId" = c.id)) AS "_count"
         FROM "Conversation" c
         JOIN "User" u ON u.id = c."userId"
         ORDER BY c."updatedAt" DESC LIMIT 6`
      ),
    ]);

  const outOfStock = inventoryItems.filter((i) => i.quantity <= 0);
  const lowStock = inventoryItems.filter((i) => i.quantity > 0 && i.quantity <= i.minThreshold);

  const cards = [
    { label: "Solicitudes pendientes", value: pendingTickets, icon: "🎫", href: "/admin/tickets", color: "bg-amber-50 text-amber-700" },
    { label: "Artículos en inventario", value: totalItems, icon: "📦", href: "/admin/inventory", color: "bg-brand-600/5 text-brand-700" },
    { label: "Requisiciones activas", value: activeLoans, icon: "🔄", href: "/admin/loans", color: "bg-green-50 text-green-700" },
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

