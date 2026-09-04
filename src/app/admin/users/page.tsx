import Link from "next/link";
import { query } from "@/lib/db";
import { PageHeader, Badge, formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  isBlocked: boolean;
  createdAt: Date;
  ticketCount: number;
  conversationCount: number;
  messageCount: number;
  lastActivity: Date | null;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();

  const users = await query<UserRow>(
    `SELECT u.*,
       (SELECT COUNT(*)::int FROM "Ticket" t WHERE t."userId" = u.id) AS "ticketCount",
       (SELECT COUNT(*)::int FROM "Conversation" c WHERE c."userId" = u.id) AS "conversationCount",
       (SELECT COUNT(*)::int FROM "Message" m JOIN "Conversation" c ON c.id = m."conversationId" WHERE c."userId" = u.id) AS "messageCount",
       (SELECT MAX(m."createdAt") FROM "Message" m JOIN "Conversation" c ON c.id = m."conversationId" WHERE c."userId" = u.id) AS "lastActivity"
     FROM "User" u
     WHERE ($1 = '' OR u.name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
     ORDER BY u."createdAt" DESC`,
    [q]
  );

  return (
    <div>
      <PageHeader
        title="Usuarios registrados"
        subtitle="Usuarios que han ingresado al asistente. Haz clic para ver su historial de conversación."
      />
      <div className="p-4 sm:p-6">
        <form method="GET" className="mb-4">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o correo..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none sm:w-80"
          />
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {users.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No hay usuarios que coincidan con la búsqueda.
            </p>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="block border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">{u.name}</p>
                      {u.role === "staff" ? (
                        <Badge label="Staff" className="bg-brand-600/10 text-brand-700" />
                      ) : u.isBlocked ? (
                        <Badge label="Bloqueado" className="bg-red-50 text-red-700" />
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{u.conversationCount} conversación(es)</span>
                    <span>{u.messageCount} mensajes</span>
                    <span>{u.ticketCount} solicitud(es)</span>
                    <span>
                      {u.lastActivity ? `Última actividad: ${formatDate(u.lastActivity)}` : "Sin actividad"}
                    </span>
                    <span className="text-brand-600">Ver historial</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}