import Link from "next/link";
import { query } from "@/lib/db";
import { PageHeader, formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type UserObj = { id: string; name: string; email: string; role: string };
type TicketObj = { id: string; number: number; title: string; status: string };
type ConversationRow = {
  id: string;
  updatedAt: Date;
  user: UserObj;
  _count: { messages: number };
  tickets: TicketObj[];
};

export default async function ConversationsPage() {
  const conversations = await query<ConversationRow>(
    `SELECT c.*,
       json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS "user",
       json_build_object('messages', (SELECT COUNT(*)::int FROM "Message" m WHERE m."conversationId" = c.id)) AS "_count",
       COALESCE((
         SELECT json_agg(json_build_object('id', t.id, 'number', t.number, 'title', t.title, 'status', t.status))
         FROM "Ticket" t WHERE t."conversationId" = c.id
       ), '[]') AS tickets
     FROM "Conversation" c
     JOIN "User" u ON u.id = c."userId"
     ORDER BY c."updatedAt" DESC`
  );

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
