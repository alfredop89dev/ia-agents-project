"use client";

import { memo, useRef, useEffect, useCallback, useState } from "react";

const ACCEPTED_TYPES = [
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "text/plain", "text/csv",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

type Props = {
  onSubmit: (text: string, files: File[]) => Promise<void>;
  disabled: boolean;
  isStreaming: boolean;
  onStop: () => void;
};

const ChatInput = memo(function ChatInput({ onSubmit, disabled, isStreaming, onStop }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest("form");
      form?.requestSubmit();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const el = textareaRef.current;
    if ((!el?.value.trim() && files.length === 0) || disabled) return;
    onSubmit(el?.value.trim() ?? "", files);
    el!.value = "";
    el!.style.height = "auto";
    setFiles([]);
  };

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="border-t border-border bg-page px-3 py-2">
      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 font-mono" role="list" aria-label="Archivos adjuntos">
            {files.map((f, i) => (
              <span
                key={i}
                role="listitem"
                className="flex items-center gap-1 border border-border bg-elevated px-2 py-1 text-xs text-caption"
              >
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="max-w-[120px] truncate">{f.name}</span>
                <span className="text-subtle">({formatSize(f.size)})</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-0.5 cursor-pointer text-subtle hover:text-red-400"
                  aria-label={`Quitar archivo ${f.name}`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2">
          <span className="mt-2 shrink-0 font-mono text-sm text-accent select-none">$</span>
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              placeholder="type your message..."
              disabled={disabled}
              rows={1}
              onInput={resize}
              onKeyDown={handleKeyDown}
              className="w-full border-0 bg-transparent px-0 py-2 font-mono text-sm text-body placeholder-body/40 outline-none resize-none"
              aria-label="Mensaje"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />

          <div className="flex gap-1 pt-1.5">
            <button
              type="button"
              onClick={handleAttach}
              disabled={disabled}
              className="cursor-pointer border border-border px-2 py-1 font-mono text-xs text-subtle transition-colors hover:border-accent hover:text-accent disabled:opacity-30"
              aria-label="Adjuntar archivo"
            >
              [+]
            </button>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="cursor-pointer border border-red-500/50 bg-red-500/10 px-2 py-1 font-mono text-xs text-red-400 transition-colors hover:bg-red-500/20"
                aria-label="Detener generación"
              >
                [stop]
              </button>
            ) : (
              <button
                type="submit"
                disabled={disabled}
                className="cursor-pointer border border-accent bg-accent/10 px-2 py-1 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:opacity-30"
                aria-label="Enviar mensaje"
              >
                [↵]
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
});

export default ChatInput;
