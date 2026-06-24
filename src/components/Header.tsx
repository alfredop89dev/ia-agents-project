"use client";

import { memo } from "react";
import type { FreeModel } from "@/lib/types";

type Props = {
  title: string;
  model: string;
  models: FreeModel[];
  onModelChange: (model: string) => void;
  onMenuClick: () => void;
};

function shortModelName(full: string, models: FreeModel[]): string {
  const found = models.find((m) => m.id === full);
  const name = found?.name ?? full.replace(/:free$/, "").split("/").pop() ?? full;
  const parts = name.split(": ");
  return parts.length > 1 ? parts[1] : name;
}

const Header = memo(function Header({ title, model, models, onModelChange, onMenuClick }: Props) {
  const modelName = shortModelName(model, models);

  return (
    <div className="flex items-center gap-2 border-b border-border bg-page px-3 py-1.5 font-mono text-xs">
      <button
        onClick={onMenuClick}
        className="cursor-pointer text-subtle transition-colors hover:text-body"
        aria-label="Abrir menú de conversaciones"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <span className="truncate text-caption">
        <span className="text-subtle">~/</span>
        {title}
        <span className="ml-2 text-subtle">—</span>
        <span className="ml-2 text-accent">{modelName}</span>
      </span>

      <div className="ml-auto flex items-center gap-2">
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="cursor-pointer appearance-none border border-border bg-surface px-2 py-0.5 font-mono text-xs text-caption outline-none transition-colors focus:border-accent"
          aria-label="Modelo"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

export default Header;
