"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-light/80 hover:bg-white/10 hover:text-white"
    >
      <span>🚪</span> Cerrar sesión
    </button>
  );
}
