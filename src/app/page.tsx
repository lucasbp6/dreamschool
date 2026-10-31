import Link from "next/link";
import { Briefcase, GraduationCap, Heart, School } from "lucide-react";
import { Card } from "@/components/shared/ui";

const AREAS = [
  {
    href: "/student",
    Icon: GraduationCap,
    title: "Sou Aluno",
    text: "Cuide do seu pet, ganhe XP e ajude a turma a construir.",
  },
  {
    href: "/teacher",
    Icon: School,
    title: "Sou Professor",
    text: "Reconheça conquistas, registre pontos de atenção e fale com as famílias.",
  },
  { href: "/parent", Icon: Heart, title: "Sou Família", text: "Acompanhe o pet, as conquistas e os recados da escola." },
  { href: "/manager", Icon: Briefcase, title: "Sou Gestor", text: "Veja o engajamento de todas as turmas da escola." },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-brand p-8 text-on-brand shadow-lg sm:p-12">
        <p className="text-sm font-bold uppercase tracking-wider opacity-90">Dreams School</p>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Escola dos Sonhos</h1>
        <p className="mt-3 max-w-2xl text-lg opacity-95">
          Cada aluno tem um pet que evolui com o seu engajamento, e cada turma constrói junta a sua Casa na Árvore,
          Castelo, Estação Espacial ou Vila Sustentável. Aqui ninguém perde progresso: todo deslize vira uma missão de
          cuidado.
        </p>
        <div className="mt-6 flex gap-3 text-5xl" aria-hidden>
          <span className="pet-happy">🐉</span>
          <span>🦉</span>
          <span>🏰</span>
          <span>🛰️</span>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AREAS.map(({ href, Icon, title, text }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition group-hover:-translate-y-1 group-hover:shadow-md">
              <Icon className="text-brand" size={28} aria-hidden />
              <h2 className="mt-3 text-lg font-extrabold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
