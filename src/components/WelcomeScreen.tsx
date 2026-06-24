"use client";

import { useState } from "react";
import { motion } from "motion/react";

type Props = {
  onLogin: (name: string) => void;
};

export default function WelcomeScreen({ onLogin }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onLogin(name.trim());
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-page px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-8"
      >
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-subtle uppercase">
          <span className="inline-block h-2 w-2 rounded-none bg-accent" />
          <span>IA Agents Project</span>
          <span className="inline-block h-2 w-2 rounded-none bg-accent" />
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          <label className="flex items-center gap-2 font-mono text-sm text-body">
            <span className="text-accent">$</span>
            <span>login</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="username"
            maxLength={30}
            autoFocus
            className="w-64 border border-border bg-transparent px-3 py-2 font-mono text-sm text-body outline-none transition-colors focus:border-accent placeholder:text-subtle/50"
            aria-label="Nombre de usuario"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="mt-1 cursor-pointer border border-accent bg-accent/10 px-4 py-1.5 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            [ enter ]
          </button>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="font-mono text-xs text-subtle"
        >
          type a username to start<span className="animate-blink">_</span>
        </motion.p>
      </motion.div>
    </div>
  );
}
