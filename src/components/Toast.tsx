"use client";

import { motion, AnimatePresence } from "motion/react";
import type { Toast, ToastType } from "@/hooks/useToast";

const PREFIX: Record<ToastType, string> = {
  success: "✓",
  error: "✗",
  info: "i",
};

const COLORS: Record<ToastType, string> = {
  success: "border-emerald-600 text-emerald-400",
  error: "border-red-600 text-red-400",
  info: "border-indigo-600 text-indigo-400",
};

type Props = {
  toasts: Toast[];
  onRemove: (id: string) => void;
};

export default function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed bottom-14 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-1.5">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className={`flex items-center gap-2 border bg-page px-3 py-1.5 font-mono text-xs ${COLORS[t.type]}`}
          >
            <span>{PREFIX[t.type]}</span>
            <span>{t.message}</span>
            <button
              onClick={() => onRemove(t.id)}
              className="ml-1 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              x
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
