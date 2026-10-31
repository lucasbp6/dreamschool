import { Flame, GraduationCap, Sparkles, Star, Sunrise } from "lucide-react";

type EventItem = {
  id: string;
  type: string;
  category: string;
  note: string | null;
  xpDelta: number;
  bricksDelta: number;
  createdAt: Date;
  student?: { name: string };
};

const STYLE = {
  POSITIVE: { Icon: Star, tone: "bg-success-soft text-success", title: "Conquista" },
  ATTENTION: { Icon: Sunrise, tone: "bg-attention-soft text-attention", title: "Ponto de Atenção" },
  RECOVERY: { Icon: Sparkles, tone: "bg-brand-soft text-brand", title: "Superação" },
  STREAK: { Icon: Flame, tone: "bg-brand-soft text-brand", title: "Ofensiva" },
  MENTOR: { Icon: GraduationCap, tone: "bg-sky-soft text-sky", title: "Mentoria" },
} as const;

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** Histórico acolhedor: conquistas, pontos de atenção e superações. */
export function EventList({ events, showStudent = false }: { events: EventItem[]; showStudent?: boolean }) {
  if (events.length === 0) return <p className="text-sm text-muted">Nenhum registro ainda.</p>;
  return (
    <ul className="space-y-2">
      {events.map((e) => {
        const s = STYLE[e.type as keyof typeof STYLE] ?? STYLE.POSITIVE;
        return (
          <li key={e.id} className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2 p-3">
            <span className={`mt-0.5 rounded-full p-1.5 ${s.tone}`}>
              <s.Icon size={16} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <div className="font-bold text-ink">
                {showStudent && e.student ? `${e.student.name} · ` : ""}
                {s.title}: {e.category}
              </div>
              {e.note && (
                <div className="text-muted">{e.type === "ATTENTION" ? `Missão de Cuidado: ${e.note}` : e.note}</div>
              )}
              <div className="text-xs text-muted">
                {fmt.format(e.createdAt)}
                {e.xpDelta > 0 && ` · +${e.xpDelta} XP`}
                {e.bricksDelta > 0 && ` · +${e.bricksDelta} tijolinhos`}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
