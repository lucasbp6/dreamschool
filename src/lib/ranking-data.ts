// Dados do ranking das turmas: geral (tijolinhos acumulados) e da semana (tijolinhos ganhos nos últimos 7 dias).
import { db } from "./db";
import { now } from "./clock";
import { BUILDING_INFO, buildingArt, buildingLevel, type BuildingType } from "./game";
import { rankClassrooms, type RankRow } from "./ranking";

export type RankedClass = RankRow<{
  id: string;
  name: string;
  score: number;
  buildingLabel: string;
  stageName: string;
  art: string;
  students: number;
}>;

export async function loadClassRanking(schoolId: string) {
  const since = new Date(now().getTime() - 7 * 24 * 60 * 60 * 1000);
  const classrooms = await db.classroom.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      bricks: true,
      buildingType: true,
      _count: { select: { students: true } },
      events: { where: { createdAt: { gte: since } }, select: { bricksDelta: true } },
    },
  });

  const base = classrooms.map((c) => {
    const type = (c.buildingType in BUILDING_INFO ? c.buildingType : "TREEHOUSE") as BuildingType;
    const lvl = buildingLevel(c.bricks, type);
    return {
      id: c.id,
      name: c.name,
      buildingLabel: BUILDING_INFO[type].label,
      stageName: lvl.name,
      art: buildingArt(type, lvl.level),
      students: c._count.students,
      bricks: c.bricks,
      week: c.events.reduce((s, e) => s + e.bricksDelta, 0),
    };
  });

  const pick = (c: (typeof base)[number], score: number) => ({
    id: c.id,
    name: c.name,
    buildingLabel: c.buildingLabel,
    stageName: c.stageName,
    art: c.art,
    students: c.students,
    score,
  });
  return {
    overall: rankClassrooms(base.map((c) => pick(c, c.bricks))) as RankedClass[],
    weekly: rankClassrooms(base.map((c) => pick(c, c.week))) as RankedClass[],
  };
}
