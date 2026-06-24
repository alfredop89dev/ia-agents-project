"use client";

import { memo, useState, useCallback } from "react";
import Image from "next/image";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Message } from "@/lib/types";
import CodeBlock from "./CodeBlock";
import LoadingDots from "./LoadingDots";

type Props = {
  message: Message;
};

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "br", "b", "i", "u", "em", "strong", "s", "del", "ins", "mark"],
};

const components: Partial<Components> = {
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full">{children}</table>
    </div>
  ),
  code: ({ className, children }) => {
    const isInline = !className?.includes("language-");
    if (isInline) return <code className={className}>{children}</code>;
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
};

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

const MessageBubble = memo(function MessageBubble({ message }: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const files = message.files ?? [];
  const timestamp = message.createdAt ? relativeTime(new Date(message.createdAt)) : null;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [message.content]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string) =>
    ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(type);

  return (
    <div className={`group relative ${isUser ? "pl-0" : "pl-0"}`}>
      <div className={`font-mono text-sm leading-relaxed ${isUser ? "text-user-text" : "text-body"}`}>
        <div className="flex items-start gap-2">
          <span className={`shrink-0 select-none ${isUser ? "text-accent" : "text-subtle"}`}>
            {isUser ? "$" : ">"}
          </span>
          <div className="min-w-0 flex-1 break-words">
            {files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  isImage(f.type) ? (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={f.url}
                        alt={f.name}
                        width={200}
                        height={192}
                        className="max-h-48 max-w-[200px] border border-border object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 border border-border bg-elevated px-2 py-1 text-xs text-caption transition-colors hover:text-body"
                    >
                      <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="max-w-[100px] truncate">{f.name}</span>
                      <span className="text-subtle">({formatSize(f.size)})</span>
                    </a>
                  )
                ))}
              </div>
            )}

            {isUser ? (
              message.content
            ) : message.content ? (
              <div className="[&_*:first-child]:mt-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
                  components={components}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <LoadingDots />
            )}
          </div>
        </div>

        <div className="mt-0.5 flex items-center gap-3 pl-5">
          {timestamp && (
            <span className="text-xs text-subtle/50">{timestamp}</span>
          )}
          {!isUser && message.content && (
            <button
              onClick={handleCopy}
              className="cursor-pointer text-xs text-subtle/50 opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
              aria-label={copied ? "Copiado" : "Copiar mensaje"}
            >
              {copied ? "[copiado]" : "[copiar]"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;
