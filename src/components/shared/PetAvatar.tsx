import { MOOD_INFO, PET_INFO, petLevel, type Mood, type PetType } from "@/lib/game";

const SIZES = {
  sm: "h-14 w-14 text-3xl",
  md: "h-24 w-24 text-5xl",
  lg: "h-40 w-40 text-8xl",
  xl: "h-44 w-44 text-[6.5rem] sm:h-52 sm:w-52 sm:text-[8rem]",
};
const LEVEL_RING = ["ring-brand-soft", "ring-sky", "ring-brand"];
const LEVEL_ACCESSORY = ["", "🎒", "👑"];

/** Pet do aluno: o tamanho do anel e o acessório mostram o nível; a animação mostra o humor. */
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
  const anim = mood === "HAPPY" ? "pet-happy" : mood === "TIRED" ? "pet-tired" : "";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-brand-soft ring-4 ${LEVEL_RING[lvl.level - 1]} ${SIZES[size]}`}
      role="img"
      aria-label={`${info.label} nível ${lvl.level} (${lvl.name}), humor: ${moodInfo.label}`}
    >
      <span className={`select-none leading-none ${anim}`} aria-hidden>
        {info.emoji}
      </span>
      {LEVEL_ACCESSORY[lvl.level - 1] && (
        <span aria-hidden className="absolute -top-2 -right-1 text-[0.45em]">
          {LEVEL_ACCESSORY[lvl.level - 1]}
        </span>
      )}
      <span
        aria-hidden
        className="absolute -bottom-1 -left-1 rounded-full border border-line bg-surface px-1 text-[0.35em] leading-tight"
      >
        {moodInfo.emoji}
      </span>
    </div>
  );
}
