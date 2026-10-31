import type { Metadata } from "next";
import Link from "next/link";
import { Atkinson_Hyperlegible, Nunito } from "next/font/google";
import "./globals.css";
import { AccessibilityBar } from "@/components/shared/AccessibilityBar";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import type { Role } from "@/lib/game";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const atkinson = Atkinson_Hyperlegible({ variable: "--font-atkinson", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Escola dos Sonhos",
  description: "Plataforma gamificada que conecta alunos, professores, pais e gestores.",
};

// Aplica as preferências de acessibilidade antes da pintura, evitando "piscar".
const a11yScript = `try{var p=JSON.parse(localStorage.getItem("ds-a11y")||"{}");var c=document.documentElement.classList;if(p.hc)c.add("hc");if(p.dyslexic)c.add("dyslexic");if(p.fs)c.add("fs-"+p.fs)}catch(e){}`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [users, current] = await Promise.all([
    db.user.findMany({ select: { id: true, name: true, role: true }, orderBy: { name: "asc" } }),
    getCurrentUser(),
  ]);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: a11yScript }} />
      </head>
      <body className={`${nunito.variable} ${atkinson.variable} antialiased min-h-screen`}>
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
          <AccessibilityBar />
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-ink">
              <span aria-hidden className="text-2xl">🌈</span> Escola dos Sonhos
            </Link>
            <RoleSwitcher
              users={users.map((u) => ({ ...u, role: u.role as Role }))}
              currentUserId={current?.id ?? null}
            />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
