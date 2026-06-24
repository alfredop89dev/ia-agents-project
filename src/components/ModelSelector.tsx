"use client";

import { memo } from "react";
import type { FreeModel } from "@/lib/types";

type Props = {
  value: string;
  onChange: (model: string) => void;
  models: FreeModel[];
  className?: string;
};

const ModelSelector = memo(function ModelSelector({ value, onChange, models, className = "" }: Props) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`cursor-pointer appearance-none truncate border border-border bg-surface pr-8 text-xs text-caption outline-none transition-colors focus:border-indigo-500 ${className}`}
        aria-label="Modelo"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-caption"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
});

export default ModelSelector;
