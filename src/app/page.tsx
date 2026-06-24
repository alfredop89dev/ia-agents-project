"use client";

import { useState, useEffect, useCallback } from "react";
import type { Conversation, Message, FreeModel, ConvData, FileAttachment } from "@/lib/types";
import { toConversation, FREE_DAILY_LIMIT } from "@/lib/types";
import { useDebounce } from "@/hooks/useDebounce";
import { useChatStream } from "@/hooks/useChatStream";
import { useToast } from "@/hooks/useToast";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MessageList from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import StatusBar from "@/components/ModelInfoBar";
import LoadingScreen from "@/components/LoadingScreen";
import LoadingBar from "@/components/LoadingBar";
import ToastContainer from "@/components/Toast";
import WelcomeScreen from "@/components/WelcomeScreen";
import { useSession } from "@/hooks/useSession";

function safeJsonParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatStreamError(message: string): string {
  let parsed: Record<string, unknown> | null = null;
  try { parsed = JSON.parse(message); } catch { /* not json */ }

  const errBody = parsed?.error as Record<string, unknown> | undefined;
  const errCode = errBody?.code as number | undefined;
  const errText = errBody?.message as string | undefined;
  const metadata = errBody?.metadata as Record<string, unknown> | undefined;

  if (errCode === 429) {
    const raw = metadata?.raw as string | undefined;
    const retryAfter = metadata?.retry_after_seconds as number | undefined;
    const lines = [
      "**Límite de tasa excedido** — el proveedor restringió temporalmente el acceso.\n",
    ];
    if (raw) {
      const clean = raw.replace(/:\d+\s*$/, "").trim();
      lines.push(`> ${clean}`);
    }
    if (retryAfter) {
      lines.push(`\n⏱ Reintentar en ~${retryAfter} segundos`);
    }
    lines.push(
      "\n**Sugerencias:**",
      "- Esperá unos segundos y volvé a intentar",
      "- Probá con otro modelo (selector arriba o abajo)",
      "- Agregá tu propia API key en [OpenRouter](https://openrouter.ai/settings/integrations) para aumentar los límites",
    );
    return lines.join("\n");
  }

  return errText ?? message;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [freeModels, setFreeModels] = useState<FreeModel[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dailyLimit");
      return saved ? Number(saved) : FREE_DAILY_LIMIT;
    }
    return FREE_DAILY_LIMIT;
  });
  const [initError, setInitError] = useState(false);

  const { userName, ready, login, logout } = useSession();
  const chatStream = useChatStream();
  const toast = useToast();

  const loadConversations = useCallback(() => {
    setInitError(false);
    fetch("/api/conversations")
      .then((r) => (r.ok ? r.json() : Promise.reject("Error al cargar conversaciones")))
      .then((data: ConvData[]) => {
        const convs = data.map(toConversation);
        setConversations(convs);
        if (convs.length > 0) {
          setActiveId(convs[0].id);
          return;
        }
        return fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }).then((r) => (r.ok ? r.json() : null) as Promise<ConvData | null>);
      })
      .then((created) => {
        if (!created?._id) return;
        const conv = toConversation(created);
        setConversations([conv]);
        setActiveId(conv.id);
      })
      .catch(() => setInitError(true));
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadConversations);

    fetch("/api/models")
      .then((r) => r.json())
      .then((data: FreeModel[]) => {
        if (Array.isArray(data)) setFreeModels(data);
      })
      .catch(console.error);
  }, [loadConversations]);

  const activeConv = conversations.find((c) => c.id === activeId);

  const persistModel = useCallback(
    (model: string) => {
      if (!activeId) return;
      fetch(`/api/conversations/${activeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      }).catch(console.error);
    },
    [activeId],
  );

  const debouncedPersistModel = useDebounce(persistModel, 500);

  const persistMaxCompletionTokens = useCallback(
    (val: number) => {
      if (!activeId) return;
      fetch(`/api/conversations/${activeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxCompletionTokens: val }),
      }).catch(console.error);
    },
    [activeId],
  );

  const debouncedPersistMaxTokens = useDebounce(persistMaxCompletionTokens, 500);

  const handleModelChange = useCallback(
    (model: string) => {
      if (!activeId) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, model } : c)),
      );
      debouncedPersistModel(model);
    },
    [activeId, debouncedPersistModel],
  );

  const handleMaxCompletionTokensChange = useCallback(
    (val: number) => {
      if (!activeId) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, maxCompletionTokens: val } : c)),
      );
      debouncedPersistMaxTokens(val);
    },
    [activeId, debouncedPersistMaxTokens],
  );

  const handleDailyLimitChange = useCallback((val: number) => {
    setDailyLimit(val);
    localStorage.setItem("dailyLimit", String(val));
  }, []);

  const handleSystemPromptChange = useCallback(
    (val: string) => {
      if (!activeId) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, systemPrompt: val } : c)),
      );
      fetch(`/api/conversations/${activeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: val }),
      }).catch(() => toast.addToast("Error al guardar el rol del agente", "error"));
    },
    [activeId, toast],
  );

  const handleSubmit = useCallback(
    async (text: string, fileList: File[]) => {
      if ((!text.trim() && fileList.length === 0) || isLoading || !activeId) return;

      setIsLoading(true);
      setRequestCount((c) => c + 1);

      let uploadedFiles: FileAttachment[] = [];

      if (fileList.length > 0) {
        try {
          const results = await Promise.all(
            Array.from(fileList).map(async (f) => {
              const formData = new FormData();
              formData.append("file", f);
              const res = await fetch("/api/upload", { method: "POST", body: formData });
              if (!res.ok) throw new Error("Error al subir archivo");
              return res.json() as Promise<FileAttachment>;
            }),
          );
          uploadedFiles = results;
        } catch {
          setIsLoading(false);
          toast.addToast("Error al subir archivos", "error");
          return;
        }
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        files: uploadedFiles,
        createdAt: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, userMsg] }
            : c,
        ),
      );

      const assistantId = crypto.randomUUID();

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { id: assistantId, role: "assistant" as const, content: "", createdAt: new Date() },
                ],
              }
            : c,
        ),
      );

      const supportsVision = freeModels.find((m) => m.id === activeConv?.model)?.supportsVision ?? false;

      try {
        await chatStream.startStream("/api/chat", {
          conversationId: activeId,
          message: text.trim() || "(archivo adjunto)",
          files: uploadedFiles,
          supportsVision,
        }, {
          onToken: (content) => {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantId ? { ...m, content: m.content + content } : m,
                      ),
                    }
                  : c,
              ),
            );
          },
          onDone: (data) => {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === data.id
                  ? {
                      ...c,
                      id: data.id,
                      tokensUsed: data.tokensUsed,
                      model: data.model,
                      title: data.title,
                      messages: c.messages.map((m) =>
                        m.id === assistantId ? { ...m, content: m.content } : m,
                      ),
                    }
                  : c,
              ),
            );
            if (activeId !== data.id) setActiveId(data.id);
          },
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeId
                ? { ...c, messages: c.messages.filter((m) => m.id !== assistantId) }
                : c,
            ),
          );
          return;
        }

        const msg = error instanceof Error ? error.message : "Error al conectar con la IA";
        const formatted = formatStreamError(msg);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: [
                    ...c.messages.filter((m) => m.id !== assistantId),
                    { id: crypto.randomUUID(), role: "assistant", content: formatted, createdAt: new Date() },
                  ],
                }
              : c,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeId, isLoading, freeModels, activeConv, chatStream, toast],
  );

  const handleNewConversation = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Error al crear conversación");

      const text = await res.text();
      const data: ConvData | null = safeJsonParse(text) as ConvData | null;
      if (!data?._id) throw new Error("Respuesta inválida del servidor");

      const conv = toConversation(data);
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
    } catch {
      toast.addToast("Error al crear conversación", "error");
    }
  }, [toast]);

  const handleDelete = useCallback(
    async (id: string) => {
      const remaining = conversations.filter((c) => c.id !== id);
      const willDeleteActive = id === activeId;

      setConversations((prev) => prev.filter((c) => c.id !== id));

      try {
        await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      } catch {
        toast.addToast("Error al eliminar conversación", "error");
      }

      if (willDeleteActive) {
        if (remaining.length > 0) {
          setActiveId(remaining[0].id);
        } else {
          handleNewConversation();
        }
      }
    },
    [activeId, conversations, handleNewConversation, toast],
  );

  if (!ready) return null;
  if (!userName) return <WelcomeScreen onLogin={login} />;

  if (!activeConv) {
    if (initError) {
      return (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-page font-mono text-sm text-caption">
          <svg className="h-8 w-8 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs">! error loading conversations</p>
          <button
            onClick={loadConversations}
            className="cursor-pointer border border-accent bg-accent/10 px-3 py-1 text-xs text-accent transition-colors hover:bg-accent/20"
          >
            [ retry ]
          </button>
        </div>
      );
    }
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-dvh flex-col bg-page">
      <Sidebar
        conversations={conversations}
        activeId={activeId!}
        onSelect={setActiveId}
        onNew={handleNewConversation}
        onDelete={handleDelete}
        onSystemPromptChange={handleSystemPromptChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        onLogout={logout}
      />

      <Header
        title={activeConv.title}
        model={activeConv.model}
        models={freeModels}
        onModelChange={handleModelChange}
        onMenuClick={() => setSidebarOpen(true)}
      />

      {isLoading && <LoadingBar />}

      <MessageList messages={activeConv.messages} model={activeConv.model} models={freeModels} />

      <ChatInput
        onSubmit={handleSubmit}
        disabled={isLoading}
        isStreaming={chatStream.isStreaming}
        onStop={chatStream.stopStream}
      />

      <StatusBar
        model={activeConv.model}
        tokensUsed={activeConv.tokensUsed}
        contextLength={freeModels.find((m) => m.id === activeConv.model)?.contextLength ?? activeConv.maxTokens}
        requestCount={requestCount}
        dailyLimit={dailyLimit}
        maxCompletionTokens={activeConv.maxCompletionTokens}
        onModelChange={handleModelChange}
        onMaxCompletionTokensChange={handleMaxCompletionTokensChange}
        onDailyLimitChange={handleDailyLimitChange}
        availableModels={freeModels}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
