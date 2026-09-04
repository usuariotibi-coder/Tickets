"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePopups } from "@/components/ui/popups";

export function ReturnLoanButton({ id, alreadyReturned }: { id: string; alreadyReturned: boolean }) {
  const router = useRouter();
  const { confirm } = usePopups();
  const [busy, setBusy] = useState(false);

  async function markReturned() {
    const ok = await confirm({
      title: "Marcar requisición como entregada",
      message: "¿Seguro que quieres marcar esta requisición como entregada?",
      variant: "success",
      confirmLabel: "Marcar entregada",
    });
    if (!ok) return;
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
      {busy ? "..." : "Marcar entregada"}
    </button>
  );
}
