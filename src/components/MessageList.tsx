"use client";

import { useEffect, useRef } from "react";
import type { Message, FreeModel } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import WelcomeMessage from "./WelcomeMessage";

type Props = {
  messages: Message[];
  model: string;
  models: FreeModel[];
};

export default function MessageList({ messages, model, models }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 150;
      isNearBottomRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <main
      ref={containerRef}
      className="flex flex-1 flex-col overflow-y-auto bg-page"
      role="log"
      aria-label="Mensajes"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-0 px-4 py-4">
        {messages.length === 0 ? (
          <WelcomeMessage model={model} models={models} />
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`py-2 ${i < messages.length - 1 ? "border-b border-border/30" : ""}`}
            >
              <MessageBubble message={msg} />
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </main>
  );
}
