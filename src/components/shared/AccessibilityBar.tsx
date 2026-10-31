"use client";

import { useEffect, useState } from "react";
import { Accessibility, AArrowDown, AArrowUp, Contrast, Type } from "lucide-react";

type Prefs = { hc?: boolean; dyslexic?: boolean; fs?: 0 | 1 | 2 };
const KEY = "ds-a11y";

function readPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function apply(p: Prefs) {
  const c = document.documentElement.classList;
  c.toggle("hc", !!p.hc);
  c.toggle("dyslexic", !!p.dyslexic);
  c.remove("fs-1", "fs-2");
  if (p.fs) c.add(`fs-${p.fs}`);
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function AccessibilityBar() {
  const [prefs, setPrefs] = useState<Prefs>({});
  useEffect(() => setPrefs(readPrefs()), []);

  const update = (next: Prefs) => {
    setPrefs(next);
    apply(next);
  };
  const fs = prefs.fs ?? 0;
  const btn =
    "inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 font-semibold hover:bg-brand-soft aria-pressed:bg-brand aria-pressed:text-on-brand aria-pressed:border-brand disabled:opacity-40";

  return (
    <div className="border-b border-line bg-surface-2">
      <div
        role="toolbar"
        aria-label="Acessibilidade"
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-1.5 text-xs text-ink"
      >
        <span className="mr-1 inline-flex items-center gap-1 font-bold text-muted">
          <Accessibility size={14} aria-hidden /> Acessibilidade
        </span>
        <button className={btn} aria-pressed={!!prefs.hc} onClick={() => update({ ...prefs, hc: !prefs.hc })}>
          <Contrast size={14} aria-hidden /> Alto contraste
        </button>
        <button
          className={btn}
          aria-pressed={!!prefs.dyslexic}
          onClick={() => update({ ...prefs, dyslexic: !prefs.dyslexic })}
        >
          <Type size={14} aria-hidden /> Fonte para dislexia
        </button>
        <button
          className={btn}
          aria-label="Diminuir fonte"
          disabled={fs === 0}
          onClick={() => update({ ...prefs, fs: (fs - 1) as Prefs["fs"] })}
        >
          <AArrowDown size={14} aria-hidden /> A-
        </button>
        <button
          className={btn}
          aria-label="Aumentar fonte"
          disabled={fs === 2}
          onClick={() => update({ ...prefs, fs: (fs + 1) as Prefs["fs"] })}
        >
          <AArrowUp size={14} aria-hidden /> A+
        </button>
      </div>
    </div>
  );
}
