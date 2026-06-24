"use client";

import type { FreeModel } from "@/lib/types";

function shortModelName(full: string, models: FreeModel[]): string {
  const found = models.find((m) => m.id === full);
  const name = found?.name ?? full.replace(/:free$/, "").split("/").pop() ?? full;
  const parts = name.split(": ");
  return parts.length > 1 ? parts[1] : name;
}

type Props = {
  model: string;
  models: FreeModel[];
};

export default function WelcomeMessage({ model, models }: Props) {
  const modelName = shortModelName(model, models);

  return (
    <div className="flex flex-1 items-center justify-center font-mono text-sm text-subtle">
      <div className="text-center">
        <div className="mb-3 text-xs text-subtle/50"># chat initialized with {modelName}</div>
        <div className="text-caption">
          type your message below to start<span className="animate-blink text-accent">_</span>
        </div>
      </div>
    </div>
  );
}
