// Campos de formulário com o mesmo visual em todas as telas.
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const control = "w-full rounded-xl border border-line bg-surface px-3 py-2 font-semibold text-ink";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 font-bold text-muted">
      {label}
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={control} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={control}>
      {children}
    </select>
  );
}
