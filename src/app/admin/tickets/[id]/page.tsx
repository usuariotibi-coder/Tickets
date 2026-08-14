import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  PageHeader,
  Badge,
  STATUS_LABELS,
  STATUS_STYLES,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  formatDate,
} from "@/components/admin/ui";
import { TicketStatusButton } from "@/components/admin/ticket-status";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      conversation: { include: { messages: { orderBy: { createdAt: "asc" } } } },
      loan: true,
    },
  });

  if (!ticket) notFound();

  const items = (ticket.requestedItems as { name: string; quantity: number }[]) || [];

  return (
    <div>
      <PageHeader
        title={`Solicitud #${ticket.number}`}
        subtitle={`${CATEGORY_LABELS[ticket.category] || ticket.category} · Prioridad ${PRIORITY_LABELS[ticket.priority] || ticket.priority}`}
      />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">{ticket.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{ticket.description}</p>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              Solicitante: {ticket.user.name} ({ticket.user.email})
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Creada: {formatDate(ticket.createdAt)}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Estado</p>
                <TicketStatusButton id={ticket.id} status={ticket.status} />
              </div>
              <Badge label={STATUS_LABELS[ticket.status] || ticket.status} className={STATUS_STYLES[ticket.status]} />
            </div>
          </div>

          {items.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-700">Artículos solicitados</h2>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 text-slate-700">{it.name}</td>
                      <td className="py-2 text-right font-medium text-slate-900">{it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {ticket.loan && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-700">Préstamo</h2>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p>
                  Estado:{" "}
                  <Badge
                    label={ticket.loan.status === "prestado" ? "Prestado" : "Devuelto"}
                    className={ticket.loan.status === "prestado" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}
                  />
                </p>
                <p>Prestado el: {formatDate(ticket.loan.borrowedAt)}</p>
                {ticket.loan.returnedAt && <p>Devuelto el: {formatDate(ticket.loan.returnedAt)}</p>}
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Conversación original
          </h2>
          <div className="chat-scroll max-h-[70vh] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
            {ticket.conversation?.messages.length ? (
              ticket.conversation.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {m.content || "(sin contenido)"}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Esta solicitud no tiene conversación adjunta (fue creada manualmente).
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
