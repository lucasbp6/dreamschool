import { MOOD_INFO, PET_INFO, petLevel, type Mood, type PetType } from "@/lib/game";
import { PetArt } from "./PetArt";

const SIZES = {
  sm: "h-14 w-14",
  md: "h-24 w-24",
  lg: "h-40 w-40",
  xl: "h-44 w-44 sm:h-52 sm:w-52",
};
const LEVEL_RING = ["ring-line", "ring-sky/60", "ring-brand/70"];

/** Marca de nível: estrelinha (nível 2) ou coroinha (nível 3), no mesmo traço dos pets. */
function LevelMark({ level }: { level: number }) {
  if (level < 2) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="absolute -top-1 -right-1 h-[28%] w-[28%] drop-shadow-sm">
      <circle cx={12} cy={12} r={11} fill="#fffdf7" stroke="#e6ddcc" strokeWidth={1.2} />
      {level === 2 ? (
        <path d="M12 5.5l1.9 3.9 4.3.6-3.1 3 .7 4.3L12 15.3 8.2 17.3l.7-4.3-3.1-3 4.3-.6Z" fill="#d9b864" />
      ) : (
        <path d="M5.5 16.5 L6.5 8.5 L9.5 11.5 L12 6.5 L14.5 11.5 L17.5 8.5 L18.5 16.5 Z" fill="#d9b864" stroke="#b8963f" strokeWidth={0.8} strokeLinejoin="round" />
      )}
    </svg>
  );
}

/** Pet do aluno: a ilustração muda com o humor; o anel e a marca no canto mostram o nível. */
export function PetAvatar({
  petType,
  xp,
  mood,
  size = "md",
}: {
  petType: string;
  xp: number;
  mood: string;
  size?: keyof typeof SIZES;
}) {
  const info = PET_INFO[petType as PetType] ?? PET_INFO.CAT;
  const lvl = petLevel(xp);
  const moodInfo = MOOD_INFO[mood as Mood] ?? MOOD_INFO.NEUTRAL;
  const anim = mood === "HAPPY" ? "pet-happy" : mood === "TIRED" ? "pet-tired" : "pet-idle";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-surface ring-4 ${LEVEL_RING[lvl.level - 1]} ${SIZES[size]}`}
      role="img"
      aria-label={`${info.label} nível ${lvl.level} (${lvl.name}), humor: ${moodInfo.label}`}
    >
      <PetArt petType={petType} mood={mood} className={`h-[88%] w-[88%] ${anim}`} />
      <LevelMark level={lvl.level} />
    </div>
  );
}
