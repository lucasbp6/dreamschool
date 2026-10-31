// Peças visuais reaproveitadas por todas as áreas.
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card rounded-3xl border border-line bg-surface p-5 shadow-sm ${className}`}>{children}</section>;
}

export function CardTitle({ icon, children, aside }: { icon?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
        {icon}
        {children}
      </h2>
      {aside}
    </div>
  );
}

const BAR_TONES = {
  brand: "bg-brand",
  success: "bg-success",
  sky: "bg-sky",
  attention: "bg-attention",
};

export function ProgressBar({
  value,
  label,
  tone = "brand",
}: {
  value: number;
  label: string;
  tone?: keyof typeof BAR_TONES;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-3 w-full overflow-hidden rounded-full bg-brand-soft"
    >
      <div className={`h-full rounded-full ${BAR_TONES[tone]} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const BADGE_TONES = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  attention: "bg-attention-soft text-attention",
  sky: "bg-sky-soft text-sky",
};

export function Badge({ children, tone = "brand" }: { children: ReactNode; tone?: keyof typeof BADGE_TONES }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card rounded-2xl border border-line bg-surface p-4">
      <div className="text-sm font-semibold text-muted">{label}</div>
      <div className="mt-1 text-3xl font-extrabold text-ink tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
  );
}
