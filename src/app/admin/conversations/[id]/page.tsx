import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ConversationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      messages: { orderBy: { createdAt: "asc" } },
      tickets: true,
    },
  });

  if (!conversation) notFound();

  return (
    <div>
      <PageHeader
        title={`Conversación de ${conversation.user.name}`}
        subtitle={conversation.user.email}
      />
      <div className="p-6">
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
