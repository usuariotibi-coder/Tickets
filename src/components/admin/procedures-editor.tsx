"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePopups } from "@/components/ui/popups";

type Procedure = {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
};

export function ProceduresEditor({ procedures }: { procedures: Procedure[] }) {
  const router = useRouter();
  const { confirm, alert } = usePopups();
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  async function mutate(method: string, url: string, body?: unknown) {
    setBusy(true);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      alert({ title: "Error al guardar", variant: "danger" });
      return;
    }
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Nuevo procedimiento
        </button>
      </div>

      {creating && (
        <ProcedureForm
          onSave={(body) => mutate("POST", "/api/admin/procedures", body)}
          onCancel={() => setCreating(false)}
          busy={busy}
        />
      )}

      {procedures.map((p) => (
        <div key={p.id} className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-400">
                  {p.category} · actualizado {new Date(p.updatedAt).toLocaleDateString("es-MX")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(p)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-600/5"
                >
                  Editar
                </button>
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Eliminar procedimiento",
                      message: `¿Eliminar "${p.title}"?`,
                      confirmLabel: "Eliminar",
                    });
                    if (ok) mutate("DELETE", `/api/admin/procedures/${p.id}`);
                  }}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{p.content}</p>
          </div>

          {editing?.id === p.id && (
            <ProcedureForm
              procedure={editing}
              onSave={(body) => mutate("PATCH", `/api/admin/procedures/${editing.id}`, body)}
              onCancel={() => setEditing(null)}
              busy={busy}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ProcedureForm({
  procedure,
  onSave,
  onCancel,
  busy,
}: {
  procedure?: Procedure;
  onSave: (body: Record<string, unknown>) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState(procedure?.title || "");
  const [category, setCategory] = useState(procedure?.category || "general");
  const [content, setContent] = useState(procedure?.content || "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ title, category, content });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-brand-600/30 bg-brand-600/5 p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">
        {procedure ? "Editar procedimiento" : "Nuevo procedimiento"}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-600">Título</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Categoría</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs font-medium text-slate-600">
            Contenido (el asistente lo usa para responder)
          </label>
          <textarea
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
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

