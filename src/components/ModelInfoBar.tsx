"use client";

import { useState, useCallback } from "react";
import { FREE_DAILY_LIMIT, type FreeModel } from "@/lib/types";

const VERBOSITY = [
  { label: "Baja", value: 512, desc: "Respuestas cortas — más requests disponibles" },
  { label: "Media", value: 2048, desc: "Balanceado" },
  { label: "Alta", value: 8192, desc: "Respuestas largas — menos requests" },
] as const;

type StatusBarProps = {
  model: string;
  tokensUsed: number;
  contextLength: number;
  requestCount: number;
  dailyLimit?: number;
  maxCompletionTokens: number;
  onModelChange?: (model: string) => void;
  onMaxCompletionTokensChange?: (val: number) => void;
  onDailyLimitChange?: (val: number) => void;
  availableModels?: FreeModel[];
};

export default function StatusBar({
  model,
  tokensUsed,
  contextLength,
  requestCount,
  dailyLimit = FREE_DAILY_LIMIT,
  maxCompletionTokens,
  onModelChange,
  onMaxCompletionTokensChange,
  onDailyLimitChange,
  availableModels,
}: StatusBarProps) {
  const [editingLimit, setEditingLimit] = useState(false);

  const pct = contextLength > 0 ? (tokensUsed / contextLength) * 100 : 0;
  const overflow = pct > 100;

  const remaining = Math.max(dailyLimit - requestCount, 0);
  const rlRatio = requestCount / dailyLimit;
  const nearLimit = rlRatio > 0.8;

  const handleLimitKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    },
    [],
  );

  return (
    <div className="flex items-center gap-0 border-t border-border bg-surface font-mono text-xs text-subtle overflow-x-auto">
      <div className="flex items-center gap-3 px-3 py-1.5 min-w-0">
        {availableModels && onModelChange ? (
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="cursor-pointer appearance-none border-0 bg-transparent px-0 py-0 font-mono text-xs text-caption outline-none hover:text-body"
            aria-label="Modelo"
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="truncate text-caption">{model}</span>
        )}
      </div>

      <div className="flex items-center gap-3 px-3 py-1.5 border-l border-border">
        <span className="whitespace-nowrap" title={`${tokensUsed.toLocaleString("es-AR")} / ${contextLength.toLocaleString("es-AR")} tokens`}>
          ctx: <span className={overflow ? "text-red-400" : pct > 80 ? "text-yellow-400" : "text-caption"}>{Math.round(pct)}%</span>
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 border-l border-border">
        {VERBOSITY.map((v) => (
          <button
            key={v.value}
            onClick={() => onMaxCompletionTokensChange?.(v.value)}
            title={v.desc}
            aria-label={`Verbosidad ${v.label}`}
            aria-pressed={maxCompletionTokens === v.value}
            className={`cursor-pointer border-0 bg-transparent px-1 py-0 font-mono text-xs transition-colors ${
              maxCompletionTokens === v.value
                ? "text-accent"
                : "text-subtle hover:text-caption"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 border-l border-border ml-auto">
        <span className={`whitespace-nowrap ${nearLimit ? "text-red-400" : "text-subtle"}`}>
          rate:
        </span>
        {editingLimit ? (
          <input
            autoFocus
            type="number"
            min={1}
            max={10000}
            value={dailyLimit}
            onChange={(e) => onDailyLimitChange?.(Number(e.target.value))}
            onBlur={() => setEditingLimit(false)}
            onKeyDown={handleLimitKeyDown}
            className="w-10 border border-accent bg-elevated px-1 py-0 text-right font-mono text-xs text-body outline-none"
            aria-label="Límite diario"
          />
        ) : (
          <button
            onClick={() => setEditingLimit(true)}
            title="Click para cambiar el límite diario"
            className={`cursor-pointer whitespace-nowrap font-mono text-xs hover:text-body ${nearLimit ? "text-red-400" : "text-caption"}`}
          >
            {remaining}/{dailyLimit}
          </button>
        )}
      </div>
    </div>
  );
}
