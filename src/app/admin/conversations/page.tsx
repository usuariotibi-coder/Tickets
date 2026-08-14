import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: true,
      _count: { select: { messages: true } },
      tickets: { select: { id: true, number: true, title: true, status: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Conversaciones"
        subtitle="Historial completo del chat con los usuarios (para auditoría)"
      />
      <div className="p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {conversations.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No hay conversaciones todavía.</p>
          ) : (
            conversations.map((c) => (
              <Link
                key={c.id}
                href={`/admin/conversations/${c.id}`}
                className="block border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{c.user.name}</p>
                  <p className="text-xs text-slate-400">{formatDate(c.updatedAt)}</p>
                </div>
                <p className="text-xs text-slate-500">
                  {c._count.messages} mensajes
                  {c.tickets.length > 0 &&
                    ` · ${c.tickets.length} solicitud(es): ${c.tickets
                      .map((t) => `#${t.number} ${t.status}`)
                      .join(", ")}`}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
