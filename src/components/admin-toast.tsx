"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";

type ToastType = "success" | "error";
type StoredToast = { type: ToastType; message: string; at: number };
type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const STORAGE_KEY = "admin-toast-last";
const EVENT = "admin-toast";
const TTL = 4500;

let cachedRaw: string | null = null;
let cachedToast: StoredToast | null = null;

function readToast(): StoredToast | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      if (cachedToast && Date.now() - cachedToast.at > TTL) {
        sessionStorage.removeItem(STORAGE_KEY);
        cachedRaw = null;
        cachedToast = null;
        return null;
      }
      return cachedToast;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedToast = null;
      return null;
    }
    const data = JSON.parse(raw) as StoredToast;
    if (!data?.message || Date.now() - data.at > TTL) {
      sessionStorage.removeItem(STORAGE_KEY);
      cachedRaw = null;
      cachedToast = null;
      return null;
    }
    cachedToast = data;
    return cachedToast;
  } catch {
    cachedRaw = null;
    cachedToast = null;
    return null;
  }
}

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  const timer = window.setInterval(onChange, 400);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.clearInterval(timer);
  };
}

function push(type: ToastType, message: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ type, message, at: Date.now() }));
  cachedRaw = null;
  cachedToast = null;
  emit();
}

const api: ToastApi = {
  success: (message) => push("success", message),
  error: (message) => push("error", message),
};

export function useAdminToast() {
  return api;
}

function AdminToastViewport() {
  const toast = useSyncExternalStore(subscribe, readToast, () => null);
  return (
    <div data-admin-toast-root="" className="pointer-events-none fixed top-20 right-5 z-[80] flex w-[min(360px,calc(100%-24px))] flex-col gap-2">
      {toast ? (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm shadow-2xl ${
            toast.type === "success"
              ? "border-emerald-400/20 bg-[#10241c] text-emerald-200"
              : "border-rose-400/20 bg-[#2a1218] text-rose-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <CircleAlert size={16} className="mt-0.5 shrink-0" />}
          <span className="leading-5">{toast.message}</span>
        </div>
      ) : null}
    </div>
  );
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AdminToastViewport />
    </>
  );
}

export function AdminToastForm({
  action,
  success = "操作成功",
  className,
  confirm,
  children,
}: {
  action: (formData: FormData) => Promise<void | { error?: string }> | void;
  success?: string;
  className?: string;
  confirm?: string;
  children: ReactNode;
}) {
  const toast = useAdminToast();
  return (
    <form
      className={className}
      action={async (formData) => {
        if (confirm && !window.confirm(confirm)) return;
        try {
          const result = await action(formData);
          if (result?.error) {
            toast.error(result.error);
            return;
          }
          toast.success(success);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "操作失败");
        }
      }}
    >
      {children}
    </form>
  );
}
