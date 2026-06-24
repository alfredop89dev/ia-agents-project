"use client";

import { memo, useState, useCallback } from "react";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

const CodeBlock = memo(function CodeBlock({ className, children }: Props) {
  const [copied, setCopied] = useState(false);
  const code = String(children ?? "").replace(/\n$/, "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);

  return (
    <div className="group relative">
      {className?.includes("language-") && (
        <button
          onClick={handleCopy}
          className="absolute right-1 top-1 cursor-pointer border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-subtle opacity-0 transition-all duration-200 group-hover:opacity-100 hover:border-accent hover:text-accent"
          aria-label={copied ? "Código copiado" : "Copiar código"}
        >
          {copied ? "copiado" : "copiar"}
        </button>
      )}
      <code className={className}>{children}</code>
    </div>
  );
});

export default CodeBlock;
