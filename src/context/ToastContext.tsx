"use client";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast, { type ToastData, type ToastType } from "../components/ui/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShowOptions = {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (opts: ShowOptions) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counter = useRef(0);
  const insets  = useSafeAreaInsets();

  const showToast = useCallback(({ type = "info", title, message, duration }: ShowOptions) => {
    const id = `toast-${Date.now()}-${counter.current++}`;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) =>
    showToast({ type: "success", title, message }), [showToast]);

  const error = useCallback((title: string, message?: string) =>
    showToast({ type: "error", title, message }), [showToast]);

  const warning = useCallback((title: string, message?: string) =>
    showToast({ type: "warning", title, message }), [showToast]);

  const info = useCallback((title: string, message?: string) =>
    showToast({ type: "info", title, message }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* Toast overlay — sits above everything, below notch */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 0,
          right: 0,
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
