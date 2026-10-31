"use client";

import { useEffect, useState } from "react";

/** Segundos desde que `running` ficou verdadeiro (para mostrar progresso em chamadas de IA). */
export function useElapsed(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    setSeconds(0);
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(id);
  }, [running]);
  return seconds;
}
