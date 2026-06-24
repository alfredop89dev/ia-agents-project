"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Conversation } from "@/lib/types";
import SettingsPanel from "./SettingsPanel";

type SidebarProps = {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSystemPromptChange: (val: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userName: string | null;
  onLogout: () => void;
};

function formatDateLabel(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const day = 86_400_000;

  if (diff < day) return "Hoy";
  if (diff < 2 * day) return "Ayer";
  if (diff < 7 * day) return "Esta semana";
  return "Anterior";
}

function relativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

type Group = { label: string; convs: Conversation[] };

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onSystemPromptChange,
  isOpen,
  onClose,
  userName,
  onLogout,
}: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      sidebarRef.current?.focus();
    } else if (prevFocusRef.current) {
      prevFocusRef.current.focus();
      prevFocusRef.current = null;
      setSearch("");
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (settingsOpen) {
        setSettingsOpen(false);
      } else {
        onClose();
      }
    }
    if (e.key === "Tab") {
      const sidebar = sidebarRef.current;
      if (!sidebar) return;
      const focusable = sidebar.querySelectorAll<HTMLElement>(
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
  }, [settingsOpen, onClose]);

  const activeConv = conversations.find((c) => c.id === activeId);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  const groups: Group[] = useMemo(() => {
    const order = ["Hoy", "Ayer", "Esta semana", "Anterior"];
    const map = new Map<string, Conversation[]>();
    for (const c of filtered) {
      const label = formatDateLabel(new Date(c.createdAt));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(c);
    }
    return order.filter((l) => map.has(l)).map((l) => ({ label: l, convs: map.get(l)! }));
  }, [filtered]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 cursor-pointer bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        ref={sidebarRef}
        tabIndex={-1}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Menú de conversaciones"
        className="fixed left-0 top-0 z-50 flex h-dvh w-72 flex-col border-r border-border bg-surface font-mono text-xs outline-none"
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className="text-xs uppercase tracking-wider text-subtle">Explorer</span>
          <div className="flex-1" />
          <button
            onClick={() => setSettingsOpen(true)}
            className="cursor-pointer text-subtle transition-colors hover:text-body"
            aria-label="Configuración"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="cursor-pointer text-subtle transition-colors hover:text-body"
            aria-label="Cerrar menú"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-3 pt-2">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="filter conversations..."
              className="w-full border border-border bg-surface px-2 py-1.5 font-mono text-xs text-body placeholder-body/40 outline-none transition-colors focus:border-accent"
              aria-label="Buscar conversaciones"
            />
          </div>
        </div>

        <button
          onClick={() => {
            onNew();
            onClose();
          }}
          className="mx-3 mt-2 flex cursor-pointer items-center gap-1.5 border border-dashed border-border px-2 py-1 text-xs text-subtle transition-colors hover:border-accent hover:text-accent"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          new conversation
        </button>

        <nav className="mt-2 flex-1 overflow-y-auto px-1 pb-4" aria-label="Lista de conversaciones">
          {groups.length === 0 ? (
            <div className="mt-4 px-2 text-center text-xs text-subtle">
              {search ? "no matches" : "no conversations yet"}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-1">
                <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium uppercase tracking-wider text-subtle">
                  <span>{group.label}</span>
                  <span className="text-subtle/50">({group.convs.length})</span>
                </div>
                {group.convs.map((conv) => {
                  const isActive = conv.id === activeId;
                  return (
                    <div
                      key={conv.id}
                      className={`group relative flex cursor-pointer items-center gap-1 px-2 py-1 text-xs transition-colors ${
                        isActive
                          ? "bg-elevated text-heading"
                          : "text-subtle hover:bg-elevated/30 hover:text-body"
                      }`}
                      onClick={() => {
                        onSelect(conv.id);
                        onClose();
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(conv.id);
                          onClose();
                        }
                      }}
                      aria-current={isActive ? "true" : undefined}
                      aria-label={`Conversación: ${conv.title}`}
                    >
                      <svg className="h-3 w-3 shrink-0 text-subtle/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate capitalize">{conv.title}</span>
                        <span className="text-subtle/50">{relativeTime(new Date(conv.createdAt))}</span>
                      </div>
                      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(conv.id);
                          }}
                          className="cursor-pointer p-0.5 text-subtle hover:text-red-400"
                          aria-label={`Eliminar ${conv.title}`}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </nav>

        <div className="border-t border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center bg-accent/20 text-xs text-accent">
              {userName?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <span className="flex-1 truncate text-xs text-body">{userName ?? ""}</span>
            <button
              onClick={onLogout}
              className="cursor-pointer text-xs text-subtle transition-colors hover:text-red-400"
              aria-label="Cerrar sesión"
            >
              logout
            </button>
          </div>
        </div>

        <SettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          systemPrompt={activeConv?.systemPrompt ?? ""}
          onSystemPromptChange={onSystemPromptChange}
        />
      </motion.aside>
    </>
  );
}
