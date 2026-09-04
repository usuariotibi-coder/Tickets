"use client";

import { useState } from "react";
import { SignOutButton } from "@/components/signout-button";

type NavItem = { href: string; label: string; icon: string };

export function AdminSidebar({
  nav,
  counts,
}: {
  nav: NavItem[];
  counts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-dark text-white shadow-lg lg:hidden"
        aria-label="Abrir menú"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-brand-dark transition-transform lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            TI
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Departamento de TI</p>
            <p className="text-xs text-brand-light/70">Panel de control</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((n) => {
            const count = counts[n.href] || 0;
            return (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-light/80 hover:bg-white/10 hover:text-white"
              >
                <span>{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                {count > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {count}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <a
            href="/chat"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-light/80 hover:bg-white/10 hover:text-white"
          >
            <span>💬</span> Ir al chat
          </a>
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
