import { notFound } from "next/navigation";
import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import { PageHeader, Badge, formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type UserObj = { id: string; name: string; email: string; role: string };

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  createdAt: Date;
  ticketCount: number;
  conversationCount: number;
  messageCount: number;
};

type MessageObj = { id: string; role: string; content: string; createdAt: Date };

type ConversationRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageObj[];
  tickets: { id: string; number: number; title: string; status: string }[];
};

type TicketRow = {
  id: string;
  number: number;
  title: string;
  status: string;
  createdAt: Date;
};

function MessageBubble({ m }: { m: MessageObj }) {
  const isSystem = m.role !== "user" && m.role !== "assistant";
  return (
    <div className="flex flex-col">
      <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
            m.role === "user"
              ? "bg-brand-600 text-white"
              : isSystem
                ? "bg-amber-50 text-amber-800 italic"
                : "bg-slate-100 text-slate-800"
          }`}
        >
          {isSystem && <span className="mr-1 text-xs font-semibold uppercase">[{m.role}]</span>}
          {m.content || "(sin contenido)"}
        </div>
      </div>
      <p
        className={`mt-0.5 text-[10px] text-slate-400 ${m.role === "user" ? "text-right" : ""}`}
      >
        {m.role === "user" ? "Usuario" : isSystem ? m.role : "Asistente"} ·{" "}
        {formatDate(m.createdAt)}
      </p>
    </div>
  );
}

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await queryOne<UserRow>(
    `SELECT u.*,
       (SELECT COUNT(*)::int FROM "Ticket" t WHERE t."userId" = u.id) AS "ticketCount",
       (SELECT COUNT(*)::int FROM "Conversation" c WHERE c."userId" = u.id) AS "conversationCount",
       (SELECT COUNT(*)::int FROM "Message" m JOIN "Conversation" c ON c.id = m."conversationId" WHERE c."userId" = u.id) AS "messageCount"
     FROM "User" u
     WHERE u.id = $1`,
    [params.id]
  );

  if (!user) notFound();

  const [conversations, tickets] = await Promise.all([
    query<ConversationRow>(
      `SELECT c.id, c."createdAt", c."updatedAt",
         COALESCE((
           SELECT json_agg(json_build_object('id', m.id, 'role', m.role, 'content', m.content, 'createdAt', m."createdAt") ORDER BY m."createdAt" ASC)
           FROM "Message" m WHERE m."conversationId" = c.id
         ), '[]') AS messages,
         COALESCE((
           SELECT json_agg(json_build_object('id', t.id, 'number', t.number, 'title', t.title, 'status', t.status))
           FROM "Ticket" t WHERE t."conversationId" = c.id
         ), '[]') AS tickets
       FROM "Conversation" c
       WHERE c."userId" = $1
       ORDER BY c."updatedAt" DESC`,
      [params.id]
    ),
    query<TicketRow>(
      `SELECT id, number, title, status, "createdAt"
       FROM "Ticket" WHERE "userId" = $1
       ORDER BY "createdAt" DESC`,
      [params.id]
    ),
  ]);

  return (
    <div>
      <PageHeader title={user.name} subtitle={user.email} />
      <div className="p-6">
        <div className="mb-4">
          <Link href="/admin/users" className="text-sm text-brand-600 hover:underline">
            ← Volver a usuarios
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <Badge
            label={user.role === "staff" ? "Staff" : "Usuario"}
            className="bg-brand-600/10 text-brand-700"
          />
          {user.isBlocked ? (
            <Badge label="Bloqueado" className="bg-red-50 text-red-700" />
          ) : (
            <Badge label="Activo" className="bg-green-50 text-green-700" />
          )}
          <span className="text-xs text-slate-500">
            Registrado el {formatDate(user.createdAt)}
          </span>
          <span className="text-xs text-slate-500">
            {user.conversationCount} conversaciones · {user.messageCount} mensajes ·{" "}
            {user.ticketCount} solicitudes
          </span>
        </div>

        {user.isBlocked && user.blockedReason && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="font-medium">Motivo del bloqueo:</span> {user.blockedReason}
          </div>
        )}

        {tickets.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Solicitudes</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/tickets/${t.id}`}
                  className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">#{t.number} · {t.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(t.createdAt)}</p>
                  </div>
                  <Badge
                    label={t.status}
                    className={
                      t.status === "resuelta"
                        ? "bg-green-50 text-green-700"
                        : t.status === "rechazada"
                          ? "bg-red-50 text-red-700"
                          : t.status === "aprobada"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-amber-50 text-amber-700"
                    }
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Historial de conversación
        </h2>
        {conversations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Este usuario no tiene conversaciones.
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((c) => (
              <div key={c.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                  <p className="text-xs font-medium text-slate-600">
                    Conversación del {formatDate(c.createdAt)} · {c.messages.length} mensajes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.tickets.map((t) => (
                      <Link
                        key={t.id}
                        href={`/admin/tickets/${t.id}`}
                        className="rounded-full bg-brand-600/5 px-2 py-0.5 text-[11px] font-medium text-brand-700 hover:bg-brand-700/10"
                      >
                        #{t.number} · {t.status}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  {c.messages.length === 0 ? (
                    <p className="text-sm text-slate-500">Conversación sin mensajes.</p>
                  ) : (
                    c.messages.map((m) => <MessageBubble key={m.id} m={m} />)
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}