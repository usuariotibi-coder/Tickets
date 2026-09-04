import Link from "next/link";
import { query } from "@/lib/db";
import {
  PageHeader,
  Badge,
  STATUS_LABELS,
  STATUS_STYLES,
  CATEGORY_LABELS,
  formatDate,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type UserObj = { id: string; name: string; email: string; role: string };
type TicketRow = {
  id: string;
  number: number;
  title: string;
  category: string;
  status: string;
  createdAt: Date;
  user: UserObj;
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status;

  const tickets = status
    ? await query<TicketRow>(
        `SELECT t.*, json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS "user"
         FROM "Ticket" t
         JOIN "User" u ON u.id = t."userId"
         WHERE t.status = $1
         ORDER BY t."createdAt" DESC`,
        [status]
      )
    : await query<TicketRow>(
        `SELECT t.*, json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS "user"
         FROM "Ticket" t
         JOIN "User" u ON u.id = t."userId"
         ORDER BY t."createdAt" DESC`
      );

  const statuses = ["pendiente", "aprobada", "rechazada", "resuelta"];

  return (
    <div>
      <PageHeader title="Solicitudes" subtitle="Todas las solicitudes registradas" />
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/admin/tickets"
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              !status ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-300"
            }`}
          >
            Todas
          </Link>
          {statuses.map((s) => (
            <Link
              key={s}
              href={`/admin/tickets?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                status === s ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-300"
              }`}
            >
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {tickets.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No hay solicitudes aquí.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/tickets/${t.id}`}
                    className="text-sm font-medium text-brand-700 hover:underline"
                  >
                    #{t.number} · {t.title}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    {t.user.name} · {CATEGORY_LABELS[t.category] || t.category} ·{" "}
                    {formatDate(t.createdAt)}
                  </p>
                </div>
                <Badge label={STATUS_LABELS[t.status] || t.status} className={STATUS_STYLES[t.status]} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

