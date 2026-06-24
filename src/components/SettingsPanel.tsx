"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSystemPromptChange: (val: string) => void;
};

export default function SettingsPanel({
  isOpen,
  onClose,
  systemPrompt,
  onSystemPromptChange,
}: Props) {
  const { theme, toggle } = useTheme();
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => panelRef.current?.querySelector<HTMLElement>("textarea")?.focus(), 100);
    } else if (prevFocusRef.current) {
      prevFocusRef.current.focus();
      prevFocusRef.current = null;
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Tab") {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  const handleSave = () => {
    onSystemPromptChange(localPrompt.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          key="settings"
          role="dialog"
          aria-modal="true"
          aria-label="Configuración"
          className="absolute inset-0 z-10 flex flex-col border-l border-border bg-surface font-mono text-xs outline-none"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <h2 className="text-xs uppercase tracking-wider text-body">Settings</h2>
            <button
              onClick={onClose}
              className="cursor-pointer text-subtle transition-colors hover:text-body"
              aria-label="Cerrar configuración"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-caption" htmlFor="system-prompt">
                $ agent_role
              </label>
              <p className="mb-2 text-xs text-subtle">
                define how the agent should behave
              </p>
              <textarea
                id="system-prompt"
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder="e.g.: You are a programming expert responding in Spanish with practical examples."
                rows={6}
                className="w-full resize-none border border-border bg-surface px-2 py-1.5 font-mono text-xs text-body placeholder-body/40 outline-none transition-colors focus:border-accent"
              />
            </div>

            <div className="mt-5">
              <label className="mb-1 block text-xs font-medium text-caption">
                $ theme
              </label>
              <button
                onClick={toggle}
                className="flex cursor-pointer items-center gap-2 border border-border bg-surface px-2 py-1.5 text-xs text-body transition-colors hover:border-accent"
                aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
              >
                {theme === "dark" ? (
                  <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                {theme === "dark" ? "light" : "dark"}
              </button>
            </div>
          </div>

          <div className="border-t border-border px-3 py-2">
            <button
              onClick={handleSave}
              className="w-full cursor-pointer border border-accent bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent transition-colors hover:bg-accent/20"
            >
              [ save ]
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
