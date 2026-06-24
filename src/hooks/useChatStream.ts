"use client";

import { useState, useRef, useCallback } from "react";

type StreamEvents = {
  onToken: (content: string) => void;
  onDone: (data: { id: string; tokensUsed: number; model: string; title: string }) => void;
};

export function useChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (
    url: string,
    body: object,
    events: StreamEvents,
  ) => {
    abortRef.current = new AbortController();
    setIsStreaming(true);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        let parsed: Record<string, unknown> | null = null;
        try { parsed = JSON.parse(text); } catch { /* ignore */ }
        throw new Error((parsed?.error as string) ?? "Error en el chat");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No se pudo leer la respuesta");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === "token") {
              events.onToken(event.content);
            } else if (event.type === "done") {
              events.onDone(event);
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { isStreaming, startStream, stopStream };
}
