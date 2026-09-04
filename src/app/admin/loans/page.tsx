import { query } from "@/lib/db";
import { PageHeader, Badge, formatDate } from "@/components/admin/ui";
import { ReturnLoanButton } from "@/components/admin/return-loan";

export const dynamic = "force-dynamic";

type LoanItem = { name: string; quantity: number };

type LoanRow = {
  id: string;
  ticketId: string;
  borrowerName: string;
  items: LoanItem[];
  status: string;
  borrowedAt: Date;
  returnedAt: Date | null;
  user: { id: string; name: string; email: string } | null;
  ticket: { id: string; number: number; title: string; status: string };
};

export default async function LoansPage() {
  const loans = await query<LoanRow>(
    `SELECT l.*,
       CASE WHEN u.id IS NULL THEN NULL ELSE json_build_object('id', u.id, 'name', u.name, 'email', u.email) END AS "user",
       CASE WHEN t.id IS NULL THEN NULL ELSE json_build_object('id', t.id, 'number', t.number, 'title', t.title, 'status', t.status) END AS ticket
     FROM "Loan" l
     LEFT JOIN "User" u ON u.id = l."userId"
     LEFT JOIN "Ticket" t ON t.id = l."ticketId"
     ORDER BY l."borrowedAt" DESC`
  );

  return (
    <div>
<PageHeader title="Requisiciones" subtitle="Requisiciones de material y su estado de entrega" />
      <div className="p-4 sm:p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loans.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No hay requisiciones registradas.</p>
          ) : (
            loans.map((l) => {
              const items = (l.items as LoanItem[]) || [];
              return (
                <div
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {l.borrowerName}
                      <span className="ml-2 text-xs text-slate-500">{l.user?.email}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
Solicitada: {formatDate(l.borrowedAt)}
                      {l.returnedAt ? ` · Entregada: ${formatDate(l.returnedAt)}` : ""} ·{" "}
                      <a
                        href={`/admin/tickets/${l.ticketId}`}
                        className="text-brand-600 hover:underline"
                      >
                        Solicitud #{l.ticket.number}
                      </a>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
<Badge
                      label={l.status === "prestado" ? "Solicitada" : "Entregada"}
                      className={l.status === "prestado" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}
                    />
                    <ReturnLoanButton id={l.id} alreadyReturned={l.status === "devuelto"} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

