import Image from "next/image";
import { Flame, Hammer } from "lucide-react";
import {
  BUILDING_INFO,
  MOOD_INFO,
  PET_INFO,
  buildingArt,
  buildingLevel,
  firstName,
  petLevel,
  type BuildingType,
  type Mood,
  type PetType,
} from "@/lib/game";
import { Cloud, CloudBank, Sparkle } from "./Decor";
import { PetAvatar } from "./PetAvatar";
import { ProgressBar } from "./ui";

type ScenePet = { petType: string; petName: string; xp: number; mood: string };
type SceneClassroom = { name: string; buildingType: string; bricks: number; maintenanceNeeded: number; streak: number };

const SPEECH: Record<Mood, (name: string) => string> = {
  HAPPY: () => "Oba! Estou radiante hoje!",
  NEUTRAL: () => "Vamos aprender algo novo hoje?",
  TIRED: (name) => `Estou cansadinho… ${name}, me ajuda com a missão?`,
};

/**
 * Cenário lúdico no estilo das ilustrações: céu creme-lavanda, nuvens e brilhos, o pet em destaque
 * (opcional), a construção da turma na sua ilha de nuvem e os pets da turma no banco de nuvens.
 */
export function WorldScene({
  pet,
  ownerName,
  classroom,
  parade,
}: {
  pet?: ScenePet;
  ownerName?: string;
  classroom: SceneClassroom;
  parade?: (ScenePet & { id: string; ownerName: string })[];
}) {
  const type = (classroom.buildingType in BUILDING_INFO ? classroom.buildingType : "TREEHOUSE") as BuildingType;
  const building = BUILDING_INFO[type];
  const bLvl = buildingLevel(classroom.bricks, type);
  const repairing = classroom.maintenanceNeeded > 0;

  return (
    <section
      aria-label={pet ? `Mundo de ${pet.petName}` : `Construção da ${classroom.name}`}
      className="card relative overflow-hidden rounded-[2rem] border border-line scene-sky shadow-sm"
    >
      {/* Enfeites */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Cloud className="cloud absolute top-6 left-0 w-28 opacity-90" />
        <Cloud className="cloud-slow absolute top-24 left-0 w-20 opacity-80" tone="scene-cloud-blue" />
        <Sparkle className="twinkle absolute top-6 right-10 h-6 w-6" />
        <Sparkle className="twinkle absolute top-20 left-[30%] h-4 w-4 [animation-delay:0.8s]" />
        <Sparkle className="twinkle absolute top-10 right-[38%] h-3 w-3 [animation-delay:1.6s]" />
      </div>

      <div className={`relative grid items-end gap-6 px-5 pt-6 pb-4 ${pet ? "md:grid-cols-2" : ""}`}>
        {pet && <PetSpot pet={pet} ownerName={ownerName} />}

        <div className="flex flex-col items-center text-center">
          <div className="mb-2 rounded-2xl bg-surface/90 px-4 py-2 shadow-sm">
            <div className="text-xs font-bold text-muted">
              {building.label} da {classroom.name}
            </div>
            <div className="text-lg font-extrabold text-ink">
              Nível {bLvl.level} · {bLvl.name}
            </div>
          </div>
          <div className={`relative w-full ${pet ? "max-w-sm" : "max-w-md"} ${repairing ? "" : "pet-idle"}`}>
            <Image
              src={buildingArt(type, bLvl.level)}
              alt={`${building.label}: ${bLvl.name}${repairing ? ", precisando de reparo" : ""}`}
              width={340}
              height={300}
              priority
              className={`mx-auto h-auto w-full ${repairing ? "opacity-85 saturate-75" : ""}`}
            />
            {repairing && (
              <span className="absolute right-2 bottom-6 inline-flex items-center gap-1 rounded-full bg-attention-soft px-2.5 py-1 text-xs font-extrabold text-attention shadow-sm">
                <Hammer size={12} aria-hidden /> Em reparo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Banco de nuvens com os pets e o placar da construção */}
      <div className="relative -mt-4">
        <CloudBank className="block h-12 w-full" />
        <div className="bg-[var(--cloud)] px-5 pb-5">
          {parade && parade.length > 0 && (
            <ul aria-label="Pets da turma" className="mb-4 flex flex-wrap justify-center gap-3">
              {parade.map((p) => (
                <li key={p.id} className="flex w-24 flex-col items-center text-center">
                  <PetAvatar petType={p.petType} xp={p.xp} mood={p.mood} size="sm" />
                  <span className="mt-1 rounded-full bg-surface/90 px-2 text-xs font-bold text-ink">{p.petName}</span>
                  <span className="text-[0.7rem] leading-tight font-semibold text-ink">{p.ownerName}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mx-auto max-w-xl rounded-2xl bg-surface/95 p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-1 text-sm font-bold text-ink tabular-nums">
              <span>{classroom.bricks} tijolinhos</span>
              <span className="text-muted">
                {bLvl.needed !== null
                  ? `faltam ${bLvl.needed - bLvl.current} para ${building.stages[bLvl.level]}`
                  : "nível máximo!"}
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={bLvl.progress} label="Progresso da construção" tone="sky" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
              {repairing ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-attention-soft px-2.5 py-0.5 text-attention">
                  <Hammer size={12} aria-hidden /> Reparo da Turma: {building.repairTask} ({classroom.maintenanceNeeded} pts)
                </span>
              ) : (
                <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-success">✓ Construção em ordem</span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 ${repairing ? "bg-attention-soft text-attention" : "bg-brand-soft text-brand"}`}
              >
                <Flame size={12} aria-hidden /> Sequência da turma: {classroom.streak} dia(s){repairing ? " · pausada" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PetSpot({ pet, ownerName }: { pet: ScenePet; ownerName?: string }) {
  const lvl = petLevel(pet.xp);
  const mood = (pet.mood in MOOD_INFO ? pet.mood : "NEUTRAL") as Mood;
  const species = PET_INFO[pet.petType as PetType]?.label ?? "Pet";
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-3 max-w-xs rounded-2xl bg-surface px-4 py-2 text-sm font-bold text-ink shadow-sm">
        {SPEECH[mood](ownerName ? firstName(ownerName) : "amigo")}
        <span aria-hidden className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-surface" />
      </div>
      <PetAvatar petType={pet.petType} xp={pet.xp} mood={pet.mood} size="xl" />
      <div className="mt-3 w-full max-w-xs rounded-2xl bg-surface/95 p-3 shadow-sm">
        <div className="text-xs font-bold text-muted">
          {species}
          {ownerName ? ` de ${firstName(ownerName)}` : ""}
        </div>
        <div className="text-2xl font-extrabold text-ink">{pet.petName}</div>
        <div className="mt-1 flex flex-wrap justify-center gap-1 text-xs font-bold">
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">
            Nível {lvl.level} · {lvl.name}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 ${mood === "TIRED" ? "bg-attention-soft text-attention" : "bg-success-soft text-success"}`}
          >
            {MOOD_INFO[mood].label}
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar value={lvl.progress} label="XP do pet" />
          <div className="mt-1 text-xs text-muted tabular-nums">
            {pet.xp} XP
            {lvl.needed !== null ? ` · faltam ${lvl.needed - lvl.current} para o próximo nível` : " · nível máximo!"}
          </div>
        </div>
      </div>
    </div>
  );
}
