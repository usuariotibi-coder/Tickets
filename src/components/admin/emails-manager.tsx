"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePopups } from "@/components/ui/popups";

type EmailItem = {
  id: string;
  email: string;
  name: string | null;
  note: string | null;
  createdAt: string;
};

export function EmailsManager({ emails }: { emails: EmailItem[] }) {
  const router = useRouter();
  const { confirm } = usePopups();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EmailItem | null>(null);

  async function mutate(method: string, url: string, body?: Record<string, string>) {
    setBusy(true);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al guardar.");
      return;
    }
    setError("");
    setCreating(false);
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: "Quitar correo de la lista",
      message: "¿Seguro que quieres quitar este correo de la lista de permitidos?",
      confirmLabel: "Quitar",
    });
    if (!ok) return;
    await fetch(`/api/admin/emails/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {creating ? (
        <EmailForm
          onSave={(body) => mutate("POST", "/api/admin/emails", body)}
          onCancel={() => setCreating(false)}
          busy={busy}
        />
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setCreating(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Agregar correo permitido
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {emails.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No hay correos permitidos todavía. Agrega el primero para que un usuario pueda entrar.
          </p>
        ) : (
          emails.map((e) => (
            <div key={e.id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {e.name ? <>{e.name} · </> : null}
                    <span className={e.name ? "font-normal text-slate-600" : ""}>{e.email}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {e.note || "Sin nota"} · agregado{" "}
                    {new Date(e.createdAt).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(e)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-600/5"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remove(e.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Quitar
                  </button>
                </div>
              </div>

              {editing?.id === e.id && (
                <EmailForm
                  item={editing}
                  onSave={(body) => mutate("PATCH", `/api/admin/emails/${editing.id}`, body)}
                  onCancel={() => setEditing(null)}
                  busy={busy}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmailForm({
  item,
  onSave,
  onCancel,
  busy,
}: {
  item?: EmailItem;
  onSave: (body: Record<string, string>) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [name, setName] = useState(item?.name || "");
  const [email, setEmail] = useState(item?.email || "");
  const [note, setNote] = useState(item?.note || "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name, email, note });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-brand-600/30 bg-brand-600/5 p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">
        {item ? "Editar correo permitido" : "Agregar correo permitido"}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-slate-600">Nombre (opcional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Juan Pérez"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
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
        <div>
          <label className="text-xs font-medium text-slate-600">Nota (opcional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. área de finanzas"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}