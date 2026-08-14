"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BlockedUser = {
  id: string;
  name: string;
  email: string;
  blockedAt: string | null;
  reason: string | null;
  offTopicCount: number;
  blockLogId: string | null;
  conversation: { role: string; content: string }[];
};

export function BlocksManager({ users }: { users: BlockedUser[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function unblock(blockLogId: string) {
    if (!confirm("¿Desbloquear a este usuario?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/blocks/${blockLogId}`, { method: "PATCH" });
    setBusy(false);
    if (!res.ok) {
      alert("Error al desbloquear.");
      return;
    }
    router.refresh();
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        No hay usuarios bloqueados.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((u) => (
        <div key={u.id} className="rounded-2xl border border-red-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {u.name} <span className="font-normal text-slate-500">({u.email})</span>
              </p>
              <p className="text-xs text-slate-500">
                Bloqueado: {u.blockedAt ? new Date(u.blockedAt).toLocaleString("es-MX") : "—"} ·{" "}
                {u.offTopicCount} faltas fuera de tema
              </p>
              <p className="mt-1 text-xs text-red-700">Motivo: {u.reason || "No especificado"}</p>
            </div>
            {u.blockLogId && (
              <button
                onClick={() => unblock(u.blockLogId!)}
                disabled={busy}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Desbloquear
              </button>
            )}
          </div>
          {u.conversation.length > 0 && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">
                Copia de la conversación ({u.conversation.length} mensajes)
              </p>
              <div className="space-y-1.5">
                {u.conversation.map((m, i) => (
                  <p key={i} className="text-xs leading-relaxed text-slate-700">
                    <span className="font-semibold">
                      {m.role === "user" ? "👤" : "🤖"}:
                    </span>{" "}
                    {m.content}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
