"use client";

import { useCallback, useEffect, useState } from "react";
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

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  resuelta: "Resuelta",
};

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  aprobada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  resuelta: "bg-brand-600/10 text-brand-700",
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

const LOAN_LABELS: Record<string, string> = {
  prestado: "Prestado",
  devuelto: "Devuelto",
};

const LOAN_STYLES: Record<string, string> = {
  prestado: "bg-sky-100 text-sky-800",
  devuelto: "bg-slate-100 text-slate-600",
};

const REFRESH_MS = 10_000;

function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className || ""}`}
    >
      {label}
    </span>
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

export default function MyTickets() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            TI
          </span>
          <div>
            <p className="text-sm font-semibold">Mis solicitudes</p>
            <p className="text-xs text-slate-500">
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
        <div className="flex items-center gap-2">
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
      </header>

      <main className="chat-scroll flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

          {tickets === null ? (
            <p className="text-sm text-slate-500">Cargando tus solicitudes...</p>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-600">Aún no tienes solicitudes registradas.</p>
              <p className="mt-1 text-xs text-slate-400">
                Ve al asistente y pide material, reporta una falla o haz una solicitud.
              </p>
              <Link
                href="/chat"
                className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Ir al asistente
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      #{t.number} · {t.title}
                    </p>
                    <Badge
                      label={STATUS_LABELS[t.status] || t.status}
                      className={STATUS_STYLES[t.status]}
                    />
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.description}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      label={CATEGORY_LABELS[t.category] || t.category}
                      className="bg-slate-100 text-slate-600"
                    />
                    <Badge
                      label={PRIORITY_LABELS[t.priority] || t.priority}
                      className="bg-slate-100 text-slate-600"
                    />
                    {t.loan && (
                      <Badge
                        label={`Préstamo: ${LOAN_LABELS[t.loan.status] || t.loan.status}`}
                        className={LOAN_STYLES[t.loan.status]}
                      />
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-slate-400">
                    Creada: {formatDate(t.createdAt)}
                    {t.updatedAt !== t.createdAt && (
                      <> · Actualizada: {formatDate(t.updatedAt)}</>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}