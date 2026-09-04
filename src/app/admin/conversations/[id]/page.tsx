import { notFound } from "next/navigation";
import Link from "next/link";
import { queryOne } from "@/lib/db";
import { PageHeader, formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type UserObj = { id: string; name: string; email: string; role: string };
type MessageObj = { id: string; role: string; content: string; createdAt: Date };
type ConversationRow = {
  id: string;
  updatedAt: Date;
  user: UserObj;
  messages: MessageObj[];
  tickets: {
    id: string;
    number: number;
    title: string;
    status: string;
  }[];
};

export default async function ConversationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const conversation = await queryOne<ConversationRow>(
    `SELECT c.*,
       json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS "user",
       COALESCE((
         SELECT json_agg(json_build_object('id', m.id, 'role', m.role, 'content', m.content, 'createdAt', m."createdAt") ORDER BY m."createdAt" ASC)
         FROM "Message" m WHERE m."conversationId" = c.id
       ), '[]') AS messages,
       COALESCE((
         SELECT json_agg(json_build_object('id', t.id, 'number', t.number, 'title', t.title, 'status', t.status))
         FROM "Ticket" t WHERE t."conversationId" = c.id
       ), '[]') AS tickets
     FROM "Conversation" c
     JOIN "User" u ON u.id = c."userId"
     WHERE c.id = $1`,
    [params.id]
  );

  if (!conversation) notFound();

  return (
    <div>
      <PageHeader
        title={`Conversación de ${conversation.user.name}`}
        subtitle={conversation.user.email}
      />
      <div className="p-4 sm:p-6">
        <div className="mb-4">
          <Link href="/admin/conversations" className="text-sm text-brand-600 hover:underline">
            ← Volver
          </Link>
        </div>

        {conversation.tickets.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {conversation.tickets.map((t) => (
              <Link
                key={t.id}
                href={`/admin/tickets/${t.id}`}
                className="rounded-full bg-brand-600/5 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-700/10"
              >
                #{t.number} · {t.title} · {t.status}
              </Link>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {conversation.messages.length === 0 ? (
            <p className="text-sm text-slate-500">Conversación sin mensajes.</p>
          ) : (
            <div className="space-y-3">
              {conversation.messages.map((m) => (
                <div key={m.id}>
                  <div
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      } ${m.role === "tool" || m.role === "system" ? "bg-amber-50 text-amber-800 italic" : ""}`}
                    >
                      {m.role !== "user" && m.role !== "assistant" && (
                        <span className="mr-1 text-xs font-semibold uppercase">
                          [{m.role}]
                        </span>
                      )}
                      {m.content || "(sin contenido)"}
                    </div>
                  </div>
                  <p className="mt-0.5 text-right text-[10px] text-slate-400">
                    {formatDate(m.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
