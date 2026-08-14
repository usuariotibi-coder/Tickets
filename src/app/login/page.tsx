"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"idle" | "direct" | "password" | "denied">("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.method === "direct") {
        const signInRes = await signIn("credentials", { email, redirect: false });
        if (signInRes?.error) {
          setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
          setMethod("idle");
        } else {
          router.push("/");
          router.refresh();
        }
        return;
      }
      if (data.method === "password") {
        setMethod("password");
        return;
      }
      setMethod("denied");
    } catch {
      setError("Error al verificar el correo.");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            TI
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Centro de Asistencia TI</h1>
            <p className="text-xs text-slate-500">
              {method === "password" ? "Acceso del personal de TI" : "Portal de ayuda del departamento de TI"}
            </p>
          </div>
        </div>

        {method === "idle" && (
          <form onSubmit={checkEmail} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Correo corporativo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Continuar"}
            </button>
            <p className="text-center text-xs text-slate-400">
              Solo los correos autorizados pueden ingresar. Si necesitas acceso, contacta al
              departamento de TI.
            </p>
          </form>
        )}

        {method === "password" && (
          <form onSubmit={loginWithPassword} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Correo</label>
              <input
                type="email"
                value={email}
                disabled
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("idle");
                setPassword("");
                setError("");
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700"
            >
              ← Volver
            </button>
          </form>
        )}

        {method === "denied" && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Tu correo no está autorizado para acceder.</p>
              <p className="mt-1 text-xs">
                Si crees que deberías tener acceso, contacta al departamento de TI para que lo
                agregue a la lista.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMethod("idle");
                setEmail("");
                setError("");
              }}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Intentar con otro correo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

