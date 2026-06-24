"use client";

export default function LoadingScreen() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-page font-mono text-xs text-subtle gap-2">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 animate-spin rounded-full border border-subtle border-t-accent" />
        <span>loading conversations...</span>
      </div>
    </div>
  );
}
