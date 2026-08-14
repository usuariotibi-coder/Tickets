"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUS_LABELS, STATUS_STYLES } from "@/components/admin/ui";

const statuses = ["pendiente", "aprobada", "rechazada", "resuelta"];

export function TicketStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    setBusy(true);
    await fetch(`/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {statuses.map((s) => (
        <button
          key={s}
          disabled={busy}
          onClick={() => change(s)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
            s === status
              ? STATUS_STYLES[s] || "bg-slate-100 text-slate-700"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
