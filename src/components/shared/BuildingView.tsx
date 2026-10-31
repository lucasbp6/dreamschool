import { Flame, Hammer } from "lucide-react";
import { BUILDING_INFO, buildingLevel, type BuildingType } from "@/lib/game";
import { Badge, ProgressBar } from "./ui";

/** Construção coletiva da turma: estágios, progresso por tijolinhos, reparo e sequência. */
export function BuildingView({
  buildingType,
  bricks,
  maintenanceNeeded,
  streak,
  compact = false,
}: {
  buildingType: string;
  bricks: number;
  maintenanceNeeded: number;
  streak: number;
  compact?: boolean;
}) {
  const type = (buildingType in BUILDING_INFO ? buildingType : "TREEHOUSE") as BuildingType;
  const info = BUILDING_INFO[type];
  const lvl = buildingLevel(bricks, type);

  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className={`flex shrink-0 items-center justify-center rounded-2xl bg-sky-soft ${compact ? "h-16 w-16 text-4xl" : "h-28 w-28 text-7xl"}`}
          role="img"
          aria-label={`${info.label}: ${lvl.name}`}
        >
          <span aria-hidden className={maintenanceNeeded > 0 ? "opacity-70" : ""}>
            {info.emojis[lvl.level - 1]}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-muted">{info.label}</div>
          <div className="text-xl font-extrabold text-ink">
            Nível {lvl.level} · {lvl.name}
          </div>
          <div className="mt-2">
            <ProgressBar value={lvl.progress} label="Progresso da construção" tone="sky" />
          </div>
          <div className="mt-1 text-xs text-muted tabular-nums">
            🧱 {bricks} tijolinhos
            {lvl.needed !== null ? ` · faltam ${lvl.needed - lvl.current} para ${info.stages[lvl.level]}` : " · nível máximo!"}
          </div>
        </div>
      </div>

      {!compact && (
        <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-xs" aria-label="Estágios da construção">
          {info.stages.map((stage, i) => (
            <li
              key={stage}
              className={`rounded-xl border p-2 ${i < lvl.level ? "border-sky bg-sky-soft text-ink" : "border-line text-muted"}`}
            >
              <div aria-hidden className={`text-2xl ${i < lvl.level ? "" : "grayscale opacity-50"}`}>
                {info.emojis[i]}
              </div>
              <div className="font-bold">{stage}</div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {maintenanceNeeded > 0 ? (
          <Badge tone="attention">
            <Hammer size={12} aria-hidden /> Reparo da Turma: {info.repairTask} ({maintenanceNeeded} pts)
          </Badge>
        ) : (
          <Badge tone="success">✓ Construção em ordem</Badge>
        )}
        <Badge tone={maintenanceNeeded > 0 ? "attention" : "brand"}>
          <Flame size={12} aria-hidden /> Sequência: {streak} dia(s){maintenanceNeeded > 0 ? " · pausada" : ""}
        </Badge>
      </div>
    </div>
  );
}
