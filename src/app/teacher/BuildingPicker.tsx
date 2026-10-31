"use client";

import { useTransition } from "react";
import Image from "next/image";
import { setBuildingType } from "@/lib/actions";
import { BUILDING_INFO, BUILDING_TYPES, buildingArt } from "@/lib/game";

export function BuildingPicker({ classroomId, current }: { classroomId: string; current: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <fieldset disabled={pending}>
      <legend className="mb-2 text-sm font-bold text-muted">Tema da construção</legend>
      <div className="grid grid-cols-2 gap-2">
        {BUILDING_TYPES.map((type) => {
          const info = BUILDING_INFO[type];
          const active = type === current;
          return (
            <button
              key={type}
              aria-pressed={active}
              onClick={() => startTransition(() => setBuildingType(classroomId, type))}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center text-sm font-bold transition ${
                active ? "border-brand bg-brand-soft text-ink" : "border-line text-muted hover:border-brand"
              }`}
            >
              <Image src={buildingArt(type, 3)} alt="" width={90} height={80} className="h-14 w-auto" />
              {info.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
