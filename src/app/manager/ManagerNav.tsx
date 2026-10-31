"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, UserPlus } from "lucide-react";

const LINKS = [
  { href: "/manager", label: "Visão geral", Icon: LayoutDashboard },
  { href: "/manager/cadastros", label: "Cadastros", Icon: UserPlus },
  { href: "/manager/grade", label: "Grade horária", Icon: CalendarDays },
];

export function ManagerNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Área do gestor" className="mb-6 flex flex-wrap gap-2 border-b border-line pb-3">
      {LINKS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
              active ? "bg-brand text-on-brand" : "text-ink hover:bg-brand-soft"
            }`}
          >
            <Icon size={16} aria-hidden /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
