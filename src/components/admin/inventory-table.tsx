"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePopups } from "@/components/ui/popups";

type Item = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  notes: string | null;
};

const CATEGORIES = [
  { value: "papel", label: "Papel" },
  { value: "pilas", label: "Pilas" },
  { value: "periferico", label: "Periférico" },
  { value: "otro", label: "Otro" },
];

export function InventoryTable({ items }: { items: Item[] }) {
  const router = useRouter();
  const { confirm, alert } = usePopups();
  const [editing, setEditing] = useState<Item | null>(null);
  const [showNew, setShowNew] = useState(false);
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
    setShowNew(false);
    router.refresh();
  }

  const lowStock = items.filter((i) => i.quantity <= i.minThreshold);
  const outOfStock = items.filter((i) => i.quantity <= 0);

  return (
    <div className="space-y-6">
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">⚠️ Necesitan reposición</p>
          <ul className="mt-1 list-inside list-disc">
            {outOfStock.map((i) => (
              <li key={i.id}>
                <b>{i.name}</b>: SIN STOCK
              </li>
            ))}
            {lowStock.map((i) => (
              <li key={i.id}>
                <b>{i.name}</b>: {i.quantity} {i.unit} (mínimo {i.minThreshold})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowNew((v) => !v)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Agregar artículo
        </button>
      </div>

      {showNew && (
        <ItemForm
          onSave={(body) => mutate("POST", "/api/admin/inventory", body)}
          busy={busy}
          onCancel={() => setShowNew(false)}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay artículos en el inventario.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <th className="px-4 py-3">Artículo</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Mínimo</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {i.name}
                    {i.notes && <p className="text-xs text-slate-400">{i.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {CATEGORIES.find((c) => c.value === i.category)?.label || i.category}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      i.quantity <= 0
                        ? "text-red-600"
                        : i.quantity <= i.minThreshold
                          ? "text-amber-600"
                          : "text-slate-900"
                    }`}
                  >
                    {i.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{i.minThreshold}</td>
                  <td className="px-4 py-3 text-slate-600">{i.unit}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(i)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-600/5"
                    >
                      Editar
                    </button>
<button
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Eliminar artículo",
                          message: `¿Eliminar "${i.name}" del inventario?`,
                          confirmLabel: "Eliminar",
                        });
                        if (ok) mutate("DELETE", `/api/admin/inventory/${i.id}`);
                      }}
                      className="ml-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <ItemForm
          item={editing}
          onSave={(body) => mutate("PATCH", `/api/admin/inventory/${editing.id}`, body)}
          busy={busy}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ItemForm({
  item,
  onSave,
  onCancel,
  busy,
}: {
  item?: Item;
  onSave: (body: Record<string, unknown>) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "otro");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 0));
  const [minThreshold, setMinThreshold] = useState(String(item?.minThreshold ?? 0));
  const [unit, setUnit] = useState(item?.unit || "unidad");
  const [notes, setNotes] = useState(item?.notes || "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name,
      category,
      quantity: parseInt(quantity) || 0,
      minThreshold: parseInt(minThreshold) || 0,
      unit,
      notes,
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">
        {item ? "Editar artículo" : "Nuevo artículo"}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="text-xs font-medium text-slate-600">Nombre</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Cantidad</label>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Mínimo (alerta)</label>
          <input
            type="number"
            min={0}
            value={minThreshold}
            onChange={(e) => setMinThreshold(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Unidad</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-600">Notas</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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

