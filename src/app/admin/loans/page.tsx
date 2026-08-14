import { prisma } from "@/lib/prisma";
import { PageHeader, Badge, formatDate } from "@/components/admin/ui";
import { ReturnLoanButton } from "@/components/admin/return-loan";

export const dynamic = "force-dynamic";

type LoanItem = { name: string; quantity: number };

export default async function LoansPage() {
  const loans = await prisma.loan.findMany({
    orderBy: { borrowedAt: "desc" },
    include: { user: true, ticket: true },
  });

  return (
    <div>
      <PageHeader title="Préstamos" subtitle="Material prestado y pendiente de devolución" />
      <div className="p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loans.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No hay préstamos registrados.</p>
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
                      Prestado: {formatDate(l.borrowedAt)}
                      {l.returnedAt ? ` · Devuelto: ${formatDate(l.returnedAt)}` : ""} ·{" "}
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
                      label={l.status === "prestado" ? "Prestado" : "Devuelto"}
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

