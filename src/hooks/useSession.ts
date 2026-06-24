"use client";

import { useState, useEffect, useCallback } from "react";

export function useSession() {
  const [userName, setUserName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("userName");
    queueMicrotask(() => {
      if (saved) setUserName(saved);
      setReady(true);
    });
  }, []);

  const login = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem("userName", trimmed);
    setUserName(trimmed);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("userName");
    setUserName(null);
  }, []);

  return { userName, ready, login, logout };
}
