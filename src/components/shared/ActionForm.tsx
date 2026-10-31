"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import type { FormState } from "@/lib/manager-actions";

/** Formulário ligado a uma server action: mostra a mensagem de retorno e limpa os campos só em caso de sucesso. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "",
  resetOnSuccess = true,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
  /** false mantém os valores após salvar (útil para lançar vários itens seguidos). */
  resetOnSuccess?: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={ref}
      className={`space-y-3 text-sm ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await action(null, fd);
          setState(result);
          if (result?.ok && resetOnSuccess) ref.current?.reset();
        });
      }}
    >
      {children}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand px-4 py-2 font-bold text-on-brand disabled:opacity-50"
      >
        {pending ? "Salvando…" : submitLabel}
      </button>
      <p role="status" className={`font-bold ${state?.ok ? "text-success" : "text-attention"}`}>
        {state?.message}
      </p>
    </form>
  );
}

/** Remoção em dois cliques (o viewer não mostra confirm()): "Remover" → "Confirmar". */
export function RemoveButton({ action, label }: { action: () => Promise<void>; label: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  return armed ? (
    <span className="inline-flex shrink-0 gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(action)}
        className="rounded-full bg-attention px-2 py-0.5 text-xs font-bold text-on-brand disabled:opacity-50"
      >
        Confirmar
      </button>
      <button type="button" onClick={() => setArmed(false)} className="rounded-full px-2 py-0.5 text-xs font-bold text-muted">
        Cancelar
      </button>
    </span>
  ) : (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setArmed(true)}
      className="shrink-0 rounded-full p-1 text-muted hover:bg-attention-soft hover:text-attention"
    >
      <Trash2 size={14} aria-hidden />
    </button>
  );
}
