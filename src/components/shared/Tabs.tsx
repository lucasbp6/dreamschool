"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type TabItem = { id: string; label: string; icon?: ReactNode; badge?: ReactNode; content: ReactNode };

/** Abas acessíveis (setas do teclado); a aba ativa fica no #hash para sobreviver ao recarregar. */
export function Tabs({ tabs, label }: { tabs: TabItem[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (tabs.some((t) => t.id === fromHash)) setActive(fromHash);
    // Só na montagem: depois disso a aba é controlada pelos cliques.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (id: string, focus = false) => {
    setActive(id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
    if (focus) buttons.current[id]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === active);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length].id, true);
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="mb-5 flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1.5 shadow-sm"
      >
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                buttons.current[t.id] = el;
              }}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold transition ${
                selected ? "bg-brand text-on-brand shadow" : "text-ink hover:bg-brand-soft"
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={t.id !== active}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
