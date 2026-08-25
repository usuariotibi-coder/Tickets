"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Ticket = {
  id: string;
  number: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  loan: { status: string; borrowedAt: string | null; returnedAt: string | null } | null;
};

const STEPS = [
  { key: "pendiente", label: "Pendiente" },
  { key: "aprobada", label: "Aprobada" },
  { key: "resuelta", label: "Resuelta" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; badge: string; accent: string; bar: string; step: number }
> = {
  pendiente: {
    label: "Pendiente",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    accent: "border-amber-200",
    bar: "bg-amber-400",
    step: 0,
  },
  aprobada: {
    label: "Aprobada",
    dot: "bg-sky-500",
    badge: "bg-sky-50 text-sky-700 border border-sky-200",
    accent: "border-sky-200",
    bar: "bg-sky-400",
    step: 1,
  },
  rechazada: {
    label: "Rechazada",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border border-red-200",
    accent: "border-red-200",
    bar: "bg-red-400",
    step: -1,
  },
  resuelta: {
    label: "Resuelta",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border border-green-200",
    accent: "border-green-200",
    bar: "bg-green-500",
    step: 2,
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  solicitud: "Solicitud",
  prestamo: "Préstamo",
  soporte: "Soporte",
  reposicion: "Reposición",
};

const PRIORITY_LABELS: Record<string, string> = {
  baja: "Baja",
  normal: "Normal",
  alta: "Alta",
};

const PRIORITY_STYLES: Record<string, string> = {
  baja: "bg-slate-100 text-slate-600 border border-slate-200",
  normal: "bg-amber-50 text-amber-700 border border-amber-200",
  alta: "bg-red-50 text-red-700 border border-red-200",
};

const LOAN_LABELS: Record<string, string> = {
  prestado: "Prestado",
  devuelto: "Devuelto",
};

const LOAN_STYLES: Record<string, string> = {
  prestado: "bg-sky-50 text-sky-700 border border-sky-200",
  devuelto: "bg-slate-100 text-slate-600 border border-slate-200",
};

const REFRESH_MS = 10_000;

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg?.badge || "bg-slate-100 text-slate-600 border border-slate-200"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg?.dot || "bg-slate-400"}`} />
      {cfg?.label || status}
    </span>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const className = "h-3.5 w-3.5";
  switch (category) {
    case "prestamo":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case "soporte":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
        </svg>
      );
    case "reposicion":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
}

function Chip({ icon, label, className }: { icon?: React.ReactNode; label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className || "bg-slate-100 text-slate-600"}`}
    >
      {icon}
      {label}
    </span>
  );
}

function ClockIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.pendiente;

  const segments = useMemo(() => {
    if (cfg.step === -1) return ["bg-red-400", "bg-slate-200", "bg-slate-200"];
    return STEPS.map((_, i) => (i <= cfg.step ? cfg.bar : "bg-slate-200"));
  }, [cfg]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              #{ticket.number}
            </span>
          </div>
          <p className="mt-1 text-base font-semibold text-slate-900">{ticket.title}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {ticket.description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{ticket.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip
          icon={<CategoryIcon category={ticket.category} />}
          label={CATEGORY_LABELS[ticket.category] || ticket.category}
          className="bg-brand-600/5 text-brand-700"
        />
        <Chip
          label={`Prioridad: ${PRIORITY_LABELS[ticket.priority] || ticket.priority}`}
          className={PRIORITY_STYLES[ticket.priority]}
        />
        {ticket.loan && (
          <Chip
            label={`Préstamo: ${LOAN_LABELS[ticket.loan.status] || ticket.loan.status}`}
            className={LOAN_STYLES[ticket.loan.status]}
          />
        )}
      </div>

      <div className="mt-5">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${segments[i]}`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {cfg.step === -1
            ? "Esta solicitud fue rechazada."
            : cfg.step === 2
              ? "¡Completada! Tu solicitud ya está resuelta."
              : `Paso ${cfg.step + 1} de ${STEPS.length}: ${cfg.label}`}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        <ClockIcon />
        {ticket.updatedAt !== ticket.createdAt
          ? `Actualizada el ${formatDate(ticket.updatedAt)}`
          : `Creada el ${formatDate(ticket.createdAt)}`}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="h-4 w-24 rounded bg-slate-100" />
      <div className="mt-2 h-5 w-3/4 rounded bg-slate-100" />
      <div className="mt-3 h-3 w-full rounded bg-slate-100" />
      <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
      <div className="mt-5 h-1.5 w-full rounded-full bg-slate-100" />
    </div>
  );
}

export default function MyTickets() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const firstName = session?.user?.name?.split(" ")[0] || "";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/my/tickets");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("error");
      const data = await res.json();
      setTickets(data.tickets || []);
      setLastRefresh(new Date());
      setError("");
    } catch {
      setError("No se pudo actualizar el estado. Reintentando...");
    }
  }, [router]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pendiente: 0, aprobada: 0, rechazada: 0, resuelta: 0 };
    for (const t of tickets || []) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tickets]);

  const stats = [
    { key: "pendiente", label: "Pendientes", value: counts.pendiente, dot: "bg-amber-500" },
    { key: "aprobada", label: "Aprobadas", value: counts.aprobada, dot: "bg-sky-500" },
    { key: "resuelta", label: "Resueltas", value: counts.resuelta, dot: "bg-green-500" },
    { key: "rechazada", label: "Rechazadas", value: counts.rechazada, dot: "bg-red-500" },
  ];

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              TI
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Mis solicitudes</p>
              <p className="truncate text-xs text-slate-500">
                {lastRefresh
                  ? `Actualizado ${lastRefresh.toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}`
                  : "Cargando..."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/chat"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Asistente
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="chat-scroll flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-sm sm:p-6">
            <p className="text-lg font-semibold">
              {firstName ? `Hola, ${firstName}` : "Hola"} 👋
            </p>
            <p className="mt-1 text-sm text-brand-100">
              {tickets
                ? `Tienes ${tickets.length} solicitud${tickets.length === 1 ? "" : "es"} en total. Aquí puedes seguirlas en tiempo real.`
                : "Aquí puedes seguir el estado de tus solicitudes en tiempo real."}
            </p>
          </div>

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

          {tickets === null ? (
            <div className="mt-5 space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : tickets.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/10 text-brand-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-700">Aún no tienes solicitudes</p>
              <p className="mt-1 text-xs text-slate-400">
                Ve al asistente y pide material, reporta una falla o haz una solicitud.
              </p>
              <Link
                href="/chat"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Ir al asistente
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                {stats.map((s) => (
                  <div key={s.key} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                {tickets.map((t) => (
                  <TicketCard key={t.id} ticket={t} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}