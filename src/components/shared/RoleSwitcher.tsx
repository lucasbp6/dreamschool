"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { Briefcase, GraduationCap, Heart, School } from "lucide-react";
import { switchUser } from "@/lib/actions";
import { ROLES, ROLE_LABELS, ROLE_PATHS, type Role } from "@/lib/game";

type DemoUser = { id: string; name: string; role: Role };

const ROLE_ICONS = { STUDENT: GraduationCap, TEACHER: School, PARENT: Heart, MANAGER: Briefcase };

/** Demo Mode: alterna instantaneamente entre os papéis e os usuários de exemplo. */
export function RoleSwitcher({ users, currentUserId }: { users: DemoUser[]; currentUserId: string | null }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const activeRole = ROLES.find((r) => pathname.startsWith(ROLE_PATHS[r]));
  const sameRole = users.filter((u) => u.role === activeRole);
  const selected = sameRole.find((u) => u.id === currentUserId) ?? sameRole[0];

  const go = (userId: string) => startTransition(() => switchUser(userId));

  return (
    <div className={`flex flex-wrap items-center gap-2 ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      <span className="rounded-full bg-attention-soft px-2 py-0.5 text-xs font-bold text-attention">Modo demo</span>
      <nav aria-label="Trocar perfil" className="flex flex-wrap gap-1 rounded-full bg-brand-soft p-1">
        {ROLES.map((role) => {
          const Icon = ROLE_ICONS[role];
          const first = users.find((u) => u.role === role);
          const active = role === activeRole;
          return (
            <button
              key={role}
              disabled={!first}
              aria-current={active ? "page" : undefined}
              onClick={() => first && go(first.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition ${
                active ? "bg-brand text-on-brand shadow" : "text-ink hover:bg-surface"
              }`}
            >
              <Icon size={16} aria-hidden /> {ROLE_LABELS[role]}
            </button>
          );
        })}
      </nav>
      {activeRole && sameRole.length > 1 && (
        <label className="flex items-center gap-1 text-sm">
          <span className="sr-only">Usuário</span>
          <select
            value={selected?.id}
            onChange={(e) => go(e.target.value)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 font-semibold text-ink"
          >
            {sameRole.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
