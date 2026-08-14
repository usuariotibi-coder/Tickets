"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EmailItem = {
  id: string;
  email: string;
  note: string | null;
  createdAt: string;
};

export function EmailsManager({ emails }: { emails: EmailItem[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/admin/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, note }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al agregar el correo.");
      return;
    }
    setEmail("");
    setNote("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("¿Quitar este correo de la lista?")) return;
    await fetch(`/api/admin/emails/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="rounded-2xl border border-brand-600/30 bg-brand-600/5 p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">Agregar correo permitido</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-600">Nota (opcional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. área de finanzas"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "Agregando..." : "+ Agregar"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {emails.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No hay correos permitidos todavía. Agrega el primero para que un usuario pueda entrar.
          </p>
        ) : (
          emails.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{e.email}</p>
                <p className="text-xs text-slate-500">
                  {e.note || "Sin nota"} · agregado {new Date(e.createdAt).toLocaleDateString("es-MX")}
                </p>
              </div>
              <button
                onClick={() => remove(e.id)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Quitar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

