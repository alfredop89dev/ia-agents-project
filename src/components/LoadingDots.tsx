"use client";

import { memo } from "react";

const LoadingDots = memo(function LoadingDots() {
  return (
    <span className="inline-flex font-mono text-xs text-subtle">
      <span className="animate-blink">_</span>
    </span>
  );
});

export default LoadingDots;
