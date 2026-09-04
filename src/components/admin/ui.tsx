export const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  resuelta: "Resuelta",
};

export const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  aprobada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  resuelta: "bg-brand-600/10 text-brand-700",
};

export const CATEGORY_LABELS: Record<string, string> = {
  solicitud: "Solicitud",
  prestamo: "Requisición",
  soporte: "Soporte",
  reposicion: "Reposición",
};

export const PRIORITY_LABELS: Record<string, string> = {
  baja: "Baja",
  normal: "Normal",
  alta: "Alta",
};

export function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className || ""}`}
    >
      {label}
    </span>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

