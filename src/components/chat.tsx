"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Quiero pedir prestado papel y pilas",
  "¿Cómo solicito una computadora con falla?",
  "Necesito que revisen mi equipo",
  "¿Cómo va mi solicitud?",
];

function greetingMessage(name: string): Msg {
  return {
    role: "assistant",
    content:
      `¡Hola${name ? ", " + name : ""}! Soy el asistente del departamento de TI. ` +
      "Puedo ayudarte a solicitar material (papel, pilas, periféricos), reportar fallas y responder preguntas. " +
      "Solo escribe lo que necesitas y yo me encargo del resto.",
  };
}

export default function Chat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isStaff = (session?.user as { role?: string } | undefined)?.role === "staff";
  const firstName = session?.user?.name?.split(" ")[0] || "";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([greetingMessage(firstName)]);
    }
  }, [firstName, messages.length]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, conversationId }),
      });

      if (!res.ok || !res.body) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "No pude conectarme. Inténtalo de nuevo." },
        ]);
        setLoading(false);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const evt of events) {
          const line = evt.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.delta) {
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = { ...last, content: last.content + payload.delta };
              return copy;
            });
          }
          if (payload.done) {
            setConversationId(payload.conversationId);
          }
          if (payload.error) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: payload.error };
              return copy;
            });
          }
        }
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Ocurrió un error de conexión." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function newConversation() {
    setConversationId(null);
    setMessages([greetingMessage(firstName)]);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            TI
          </span>
          <div>
            <p className="text-sm font-semibold">Centro de Asistencia TI</p>
            <p className="text-xs text-slate-500">
              {loading ? "Escribiendo..." : "En línea"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStaff && (
            <a
              href="/admin"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Panel de administración
            </a>
          )}
          <button
            onClick={newConversation}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Nueva conversación
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="chat-scroll flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                } ${loading && i === messages.length - 1 ? "animate-pulse" : ""}`}
              >
                {m.content}
                {loading && i === messages.length - 1 && m.content === "" && (
                  <span className="inline-block">...</span>
                )}
              </div>
            </div>
          ))}

          {!isStaff && messages.length <= 1 && !loading && (
            <div className="mt-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-brand-600 hover:text-brand-600"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="mx-auto flex max-w-3xl gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isStaff
                ? "Ayuda al personal del departamento..."
                : "Escribe tu solicitud o pregunta..."
            }
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-600 focus:outline-none disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}

