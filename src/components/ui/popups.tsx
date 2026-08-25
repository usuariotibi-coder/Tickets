"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type PopupType = "confirm" | "alert";
type PopupVariant = "danger" | "success" | "info";

type PopupState = {
  id: number;
  type: PopupType;
  variant: PopupVariant;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (value: boolean) => void;
};

type PopupsContextValue = {
  confirm: (opts: {
    title: string;
    message?: string;
    variant?: PopupVariant;
    confirmLabel?: string;
    cancelLabel?: string;
  }) => Promise<boolean>;
  alert: (opts: {
    title: string;
    message?: string;
    variant?: PopupVariant;
  }) => void;
};

const PopupsContext = createContext<PopupsContextValue | null>(null);

export function PopupsProvider({ children }: { children: ReactNode }) {
  const [popups, setPopups] = useState<PopupState[]>([]);
  const idRef = useRef(0);

  const close = useCallback((id: number) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const confirm = useCallback<PopupsContextValue["confirm"]>(
    (opts) => {
      return new Promise<boolean>((resolve) => {
        const id = ++idRef.current;
        setPopups((prev) => [
          ...prev,
          {
            id,
            type: "confirm",
            variant: opts.variant || "danger",
            title: opts.title,
            message: opts.message,
            confirmLabel: opts.confirmLabel || "Confirmar",
            cancelLabel: opts.cancelLabel || "Cancelar",
            resolve: (val) => {
              resolve(val);
              close(id);
            },
          },
        ]);
      });
    },
    [close]
  );

  const alert = useCallback<PopupsContextValue["alert"]>(
    (opts) => {
      const id = ++idRef.current;
      setPopups((prev) => [
        ...prev,
        {
          id,
          type: "alert",
          variant: opts.variant || "info",
          title: opts.title,
          message: opts.message,
          resolve: () => close(id),
        },
      ]);
    },
    [close]
  );

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  return (
    <PopupsContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-4">
        {popups.map((popup) => (
          <PopupDialog key={popup.id} popup={popup} onClose={close} />
        ))}
      </div>
    </PopupsContext.Provider>
  );
}

function PopupDialog({
  popup,
  onClose,
}: {
  popup: PopupState;
  onClose: (id: number) => void;
}) {
  const variant = popup.variant;
  const icon =
    variant === "danger" ? (
      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        />
      </svg>
    ) : variant === "success" ? (
      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ) : (
      <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    );

  return (
    <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
      <div
        className={`h-1.5 w-full ${
          variant === "danger" ? "bg-red-500" : variant === "success" ? "bg-green-500" : "bg-brand-600"
        }`}
      />
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              variant === "danger"
                ? "bg-red-50"
                : variant === "success"
                  ? "bg-green-50"
                  : "bg-brand-600/10"
            }`}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900">{popup.title}</h3>
            {popup.message && (
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {popup.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
        {popup.type === "confirm" && (
          <button
            onClick={() => popup.resolve(false)}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            {popup.cancelLabel}
          </button>
        )}
        <button
          autoFocus
          onClick={() => popup.resolve(true)}
          className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            variant === "danger"
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              : variant === "success"
                ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                : "bg-brand-600 hover:bg-brand-700 focus:ring-brand-600"
          }`}
        >
          {popup.confirmLabel || "Aceptar"}
        </button>
      </div>
    </div>
  );
}

export function usePopups() {
  const ctx = useContext(PopupsContext);
  if (!ctx) throw new Error("usePopups debe usarse dentro de <PopupsProvider>");
  return ctx;
}