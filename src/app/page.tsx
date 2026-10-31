import Image from "next/image";
import Link from "next/link";
import { Briefcase, GraduationCap, Heart, School } from "lucide-react";
import { BUILDING_INFO, BUILDING_TYPES, buildingArt } from "@/lib/game";
import { Sparkle } from "@/components/shared/Decor";
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
    text: "Reconheça conquistas, faça a chamada, lance notas e fale com as famílias.",
  },
  { href: "/parent", Icon: Heart, title: "Sou Família", text: "Acompanhe o pet, o boletim e os recados da escola." },
  { href: "/manager", Icon: Briefcase, title: "Sou Gestor", text: "Cadastre turmas, monte a grade e veja o engajamento." },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="grid items-center gap-6 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <p className="text-sm font-extrabold tracking-wider text-brand uppercase">Dreams School</p>
          <h1 className="mt-2 text-4xl font-extrabold text-ink sm:text-5xl">Escola dos Sonhos</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Cada aluno cuida de um pet que cresce com o seu engajamento, e cada turma constrói junta o seu cantinho nas
            nuvens. Aqui ninguém perde progresso: todo deslize vira uma missão de cuidado.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/student" className="rounded-full bg-brand px-5 py-2.5 font-extrabold text-on-brand shadow-sm">
              Entrar como aluno
            </Link>
            <Link href="/teacher" className="rounded-full border border-line bg-surface px-5 py-2.5 font-extrabold text-ink">
              Sou professor
            </Link>
          </div>
        </div>
        <div className="relative order-1 md:order-2">
          <Sparkle className="twinkle absolute top-4 left-4 h-6 w-6" />
          <Sparkle className="twinkle absolute right-6 bottom-10 h-5 w-5 [animation-delay:1s]" />
          <Image
            src="/art/school.png"
            alt="Escola dos sonhos sendo construída nas nuvens, com a faixa Bem-vindo Dream School"
            width={572}
            height={595}
            priority
            className="mx-auto h-auto w-full max-w-md [mask-image:radial-gradient(closest-side,black_80%,transparent)]"
          />
        </div>
      </section>

      <section aria-labelledby="construcoes">
        <h2 id="construcoes" className="mb-3 text-xl font-extrabold text-ink">
          O que sua turma pode construir
        </h2>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {BUILDING_TYPES.map((t) => (
            <li key={t} className="card rounded-3xl border border-line bg-surface p-3 text-center shadow-sm">
              <Image src={buildingArt(t, 3)} alt="" width={200} height={180} className="mx-auto h-32 w-auto" />
              <div className="mt-2 font-extrabold text-ink">{BUILDING_INFO[t].label}</div>
              <div className="text-xs text-muted">{BUILDING_INFO[t].stages.join(" → ")}</div>
            </li>
          ))}
        </ul>
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
