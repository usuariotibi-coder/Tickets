"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReturnLoanButton({ id, alreadyReturned }: { id: string; alreadyReturned: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markReturned() {
    if (!confirm("¿Marcar este préstamo como devuelto?")) return;
    setBusy(true);
    await fetch(`/api/admin/loans/${id}/return`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  if (alreadyReturned) return null;

  return (
    <button
      onClick={markReturned}
      disabled={busy}
      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      {busy ? "..." : "Marcar devuelto"}
    </button>
  );
}
