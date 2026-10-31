// Pets desenhados em SVG no estilo das referências (rostos planos, cores pastel, manchinhas claras
// ao redor dos olhos e um acessório na cabeça). A expressão muda com o humor.
import type { ReactNode } from "react";
import type { Mood, PetType } from "@/lib/game";

const INK = "#3a2d4f";

type Palette = { body: string; light: string; dark: string };

const PALETTES: Record<PetType, Palette> = {
  CAT: { body: "#8f6bbd", light: "#a98bd3", dark: "#6f4f9a" },
  OWL: { body: "#5c9bb4", light: "#86b8cc", dark: "#3f7890" },
  BEAR: { body: "#b9628e", light: "#d184a9", dark: "#94466f" },
  BUNNY: { body: "#9d93c9", light: "#bdb4dd", dark: "#7d73ab" },
  FOX: { body: "#cf8e66", light: "#f2e2cc", dark: "#a86a47" },
  DOG: { body: "#ae8d74", light: "#d2b9a2", dark: "#8a6c56" },
  DRAGON: { body: "#6fa597", light: "#9cc3b8", dark: "#4e8273" },
};

/** Franja de pelo: zigue-zague de (x1,y) a (x2,y) com dentes de altura h. */
function fringe(x1: number, x2: number, y: number, h: number, teeth: number) {
  const step = (x2 - x1) / teeth;
  let d = `M${x1} ${y}`;
  for (let i = 0; i < teeth; i++) d += ` L${x1 + step * (i + 0.5)} ${y + h} L${x1 + step * (i + 1)} ${y}`;
  return d + " Z";
}

function Eyes({ mood, patch, wide = false }: { mood: Mood; patch: string; wide?: boolean }) {
  const xs = wide ? [44, 76] : [46, 74];
  return (
    <g>
      {xs.map((x) => (
        <ellipse key={`p${x}`} cx={x} cy={66} rx={wide ? 13 : 11} ry={wide ? 12 : 9.5} fill={patch} />
      ))}
      {xs.map((x) =>
        mood === "HAPPY" ? (
          <path key={x} d={`M${x - 6} 69 Q${x} 60 ${x + 6} 69`} stroke={INK} strokeWidth={3.6} fill="none" strokeLinecap="round" />
        ) : mood === "TIRED" ? (
          <path key={x} d={`M${x - 6} 68 Q${x} 71 ${x + 6} 68`} stroke={INK} strokeWidth={3.2} fill="none" strokeLinecap="round" />
        ) : (
          <path key={x} d={`M${x - 6} 64 A6 6 0 0 0 ${x + 6} 64 Z`} fill={INK} />
        ),
      )}
    </g>
  );
}

function Mouth({ mood, y = 80 }: { mood: Mood; y?: number }) {
  if (mood === "TIRED") return <path d={`M55 ${y + 1} Q60 ${y - 1} 65 ${y + 1}`} stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
  return (
    <path
      d={`M52 ${y} Q56 ${y + (mood === "HAPPY" ? 6 : 4)} 60 ${y} Q64 ${y + (mood === "HAPPY" ? 6 : 4)} 68 ${y}`}
      stroke={INK}
      strokeWidth={2.4}
      fill="none"
      strokeLinecap="round"
    />
  );
}

function Nose({ y = 74 }: { y?: number }) {
  return <path d={`M56 ${y} L64 ${y} L60 ${y + 5} Z`} fill={INK} opacity={0.85} />;
}

function Blush({ mood }: { mood: Mood }) {
  if (mood !== "HAPPY") return null;
  return (
    <g fill="#e79ab6" opacity={0.55}>
      <ellipse cx={36} cy={80} rx={6} ry={3.5} />
      <ellipse cx={84} cy={80} rx={6} ry={3.5} />
    </g>
  );
}

function Sleepy({ mood }: { mood: Mood }) {
  if (mood !== "TIRED") return null;
  return (
    <g fill="none" stroke="#7d73ab" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 24 h8 l-8 9 h8" />
      <path d="M9 10 h6 l-6 7 h6" />
    </g>
  );
}

const SPECIES: Record<PetType, (p: Palette, mood: Mood) => ReactNode> = {
  // Gato roxo com laço e um patinho curioso na cabeça (referência).
  CAT: (p, mood) => (
    <>
      <path d="M28 60 L30 16 L54 40 Z" fill={p.body} />
      <path d="M92 60 L90 16 L66 40 Z" fill={p.body} />
      <path d="M33 48 L34 26 L47 40 Z" fill={p.light} />
      <path d="M87 48 L86 26 L73 40 Z" fill={p.light} />
      <circle cx={60} cy={66} r={32} fill={p.body} />
      <path d="M31 58 L15 62 L28 68 L13 75 L30 79 L22 86 L36 86 Z" fill={p.body} />
      <path d="M89 58 L105 62 L92 68 L107 75 L90 79 L98 86 L84 86 Z" fill={p.body} />
      <Eyes mood={mood} patch={p.light} />
      <Nose />
      <Mouth mood={mood} />
      <Blush mood={mood} />
      <path d="M60 99 L42 90 L42 108 Z M60 99 L78 90 L78 108 Z" fill={p.light} />
      <circle cx={60} cy={99} r={5} fill={p.dark} />
      {/* patinho */}
      <ellipse cx={60} cy={34} rx={11} ry={6.5} fill="#c8b25a" />
      <circle cx={67} cy={28} r={5} fill="#c8b25a" />
      <path d="M71 28 L77 29.5 L71 31 Z" fill="#d79a4e" />
      <circle cx={68} cy={27} r={1} fill={INK} />
    </>
  ),
  // Coruja azul com um brotinho florido (referência).
  OWL: (p, mood) => (
    <>
      <path d="M26 74 C24 38 96 38 94 74 C93 94 78 104 60 104 C42 104 27 94 26 74 Z" fill={p.body} />
      <path d="M28 52 L22 30 L42 44 Z M92 52 L98 30 L78 44 Z" fill={p.body} />
      <path d={fringe(30, 90, 96, 8, 8)} fill={p.light} />
      <Eyes mood={mood} patch={p.light} wide />
      <path d="M54 74 L66 74 L60 84 Z" fill={p.dark} />
      <Blush mood={mood} />
      <ellipse cx={60} cy={42} rx={7} ry={3} fill="#7cb36a" />
      <path d="M60 42 C60 32 62 26 66 20" stroke="#6fa65d" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M61 33 C54 30 50 24 52 18 C58 20 61 26 61 33 Z" fill="#7cb36a" />
      <g transform="translate(70 15)" fill="#d27ba3">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-4.5} rx={2.6} ry={4.5} transform={`rotate(${a})`} />
        ))}
        <circle r={2.3} fill="#f3d27a" />
      </g>
    </>
  ),
  // Ursinho rosa com uma notinha musical (referência).
  BEAR: (p, mood) => (
    <>
      <circle cx={32} cy={42} r={12} fill={p.body} />
      <circle cx={88} cy={42} r={12} fill={p.body} />
      <circle cx={32} cy={42} r={6.5} fill={p.light} />
      <circle cx={88} cy={42} r={6.5} fill={p.light} />
      <path d="M40 92 L80 92 L88 112 L32 112 Z" fill={p.light} />
      <circle cx={60} cy={66} r={33} fill={p.body} />
      <Eyes mood={mood} patch={p.light} />
      <Nose />
      <Mouth mood={mood} />
      <Blush mood={mood} />
      <g fill="#5c9bb4">
        <ellipse cx={54} cy={26} rx={4} ry={3} />
        <ellipse cx={66} cy={23} rx={4} ry={3} />
        <path d="M57.5 26 V12 L69.5 9 V23 h-2.4 V13 L60 15 V26 Z" />
      </g>
    </>
  ),
  // Coelho lilás com estrelinha na orelha.
  BUNNY: (p, mood) => (
    <>
      <ellipse cx={46} cy={26} rx={8} ry={22} fill={p.body} transform="rotate(-10 46 26)" />
      <ellipse cx={74} cy={26} rx={8} ry={22} fill={p.body} transform="rotate(10 74 26)" />
      <ellipse cx={46} cy={28} rx={4} ry={15} fill={p.light} transform="rotate(-10 46 28)" />
      <ellipse cx={74} cy={28} rx={4} ry={15} fill={p.light} transform="rotate(10 74 28)" />
      <circle cx={60} cy={68} r={31} fill={p.body} />
      <path d={fringe(36, 84, 94, 7, 6)} fill={p.body} />
      <Eyes mood={mood} patch={p.light} />
      <ellipse cx={60} cy={75} rx={4} ry={3} fill="#d184a9" />
      <Mouth mood={mood} y={81} />
      <Blush mood={mood} />
      <path d="M80 12 l2.4 5 5.4 .6 -4 3.7 1.1 5.3 -4.9 -2.7 -4.9 2.7 1.1 -5.3 -4 -3.7 5.4 -.6 Z" fill="#e2c46e" />
    </>
  ),
  // Raposa terracota com uma folhinha.
  FOX: (p, mood) => (
    <>
      <path d="M26 58 L28 18 L52 40 Z" fill={p.body} />
      <path d="M94 58 L92 18 L68 40 Z" fill={p.body} />
      <path d="M28 30 L28 18 L38 27 Z M92 30 L92 18 L82 27 Z" fill={p.dark} />
      <path d="M28 52 C28 36 44 34 60 34 C76 34 92 36 92 52 C92 78 76 98 60 102 C44 98 28 78 28 52 Z" fill={p.body} />
      <path d="M30 62 C40 66 50 74 60 102 C70 74 80 66 90 62 C86 86 72 100 60 104 C48 100 34 86 30 62 Z" fill={p.light} />
      <Eyes mood={mood} patch={p.light} />
      <Nose y={78} />
      <Mouth mood={mood} y={85} />
      <Blush mood={mood} />
      <path d="M58 30 C54 20 60 12 70 12 C70 22 64 28 58 30 Z" fill="#7cb36a" />
      <path d="M58 30 L66 17" stroke="#5f9450" strokeWidth={1.6} />
    </>
  ),
  // Cachorro de orelhas caídas com lencinho.
  DOG: (p, mood) => (
    <>
      <circle cx={60} cy={64} r={32} fill={p.body} />
      <path d="M30 42 C18 44 16 70 24 82 C32 80 36 62 36 48 Z" fill={p.dark} />
      <path d="M90 42 C102 44 104 70 96 82 C88 80 84 62 84 48 Z" fill={p.dark} />
      <ellipse cx={60} cy={80} rx={16} ry={11} fill={p.light} />
      <Eyes mood={mood} patch={p.light} />
      <Nose />
      <Mouth mood={mood} y={81} />
      <Blush mood={mood} />
      <path d="M36 94 L84 94 L60 112 Z" fill="#5c9bb4" />
      <circle cx={60} cy={98} r={2} fill="#f2e2cc" />
      <circle cx={52} cy={97} r={1.5} fill="#f2e2cc" />
      <circle cx={68} cy={97} r={1.5} fill="#f2e2cc" />
    </>
  ),
  // Dragãozinho verde-sálvia com chifrinhos e asinhas.
  DRAGON: (p, mood) => (
    <>
      <path d="M26 70 C10 60 8 44 14 36 C22 46 30 50 34 58 Z" fill={p.light} />
      <path d="M94 70 C110 60 112 44 106 36 C98 46 90 50 86 58 Z" fill={p.light} />
      <path d="M44 38 L40 18 L52 34 Z M76 38 L80 18 L68 34 Z" fill="#efe2c6" />
      <path d="M52 34 L56 24 L60 34 L64 24 L68 34 Z" fill={p.dark} />
      <circle cx={60} cy={66} r={31} fill={p.body} />
      <ellipse cx={60} cy={82} rx={15} ry={10} fill={p.light} />
      <Eyes mood={mood} patch={p.light} />
      <circle cx={56} cy={77} r={1.6} fill={INK} />
      <circle cx={64} cy={77} r={1.6} fill={INK} />
      <Mouth mood={mood} y={83} />
      <Blush mood={mood} />
    </>
  ),
};

/** Ilustração do pet (quadrada, 120×120). */
export function PetArt({ petType, mood, className }: { petType: string; mood: string; className?: string }) {
  const type = (petType in SPECIES ? petType : "CAT") as PetType;
  const m = (["HAPPY", "NEUTRAL", "TIRED"].includes(mood) ? mood : "NEUTRAL") as Mood;
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
      {SPECIES[type](PALETTES[type], m)}
      <Sleepy mood={m} />
    </svg>
  );
}
