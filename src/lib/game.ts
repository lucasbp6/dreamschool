// Regras de gamificação da Dreams School (ver AGENTS.md, seção 1).
// Funções puras: recebem o estado atual e devolvem o novo estado, sem tocar no banco.
// XP e tijolinhos só crescem — nenhuma função aqui subtrai progresso.

export const ROLES = ["STUDENT", "TEACHER", "PARENT", "MANAGER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Aluno",
  TEACHER: "Professor",
  PARENT: "Pais",
  MANAGER: "Gestor",
};

export const ROLE_PATHS: Record<Role, string> = {
  STUDENT: "/student",
  TEACHER: "/teacher",
  PARENT: "/parent",
  MANAGER: "/manager",
};

export const POSITIVE_XP = 10;
export const POSITIVE_BRICKS = 10;
export const MAINTENANCE_PER_ATTENTION = 5;
export const RECOVERY_BONUS_XP = 5;
export const STREAK_BONUS_BRICKS = 5;

// ---------- Pets ----------

// O desenho de cada pet fica em src/components/shared/PetArt.tsx.
export const PET_TYPES = ["CAT", "OWL", "BEAR", "BUNNY", "FOX", "DOG", "DRAGON"] as const;
export type PetType = (typeof PET_TYPES)[number];

export const PET_INFO: Record<PetType, { label: string }> = {
  CAT: { label: "Gatinho" },
  OWL: { label: "Corujinha" },
  BEAR: { label: "Ursinho" },
  BUNNY: { label: "Coelhinho" },
  FOX: { label: "Raposinha" },
  DOG: { label: "Cachorrinho" },
  DRAGON: { label: "Dragãozinho" },
};

export type Mood = "HAPPY" | "NEUTRAL" | "TIRED";

export const MOOD_INFO: Record<Mood, { label: string }> = {
  HAPPY: { label: "Radiante" },
  NEUTRAL: { label: "Tranquilo" },
  TIRED: { label: "Precisando de cuidado" },
};

const PET_LEVELS = [
  { level: 1, name: "Filhote", min: 0 },
  { level: 2, name: "Jovem", min: 50 },
  { level: 3, name: "Guardião", min: 150 },
];

// ---------- Construção da turma ----------

export const BUILDING_TYPES = ["TREEHOUSE", "CASTLE", "SPACE_BASE", "OBSERVATORY"] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

// Os estágios acompanham a arte em public/art/buildings/<tema>-<nível>.png.
export const BUILDING_INFO: Record<
  BuildingType,
  { label: string; stages: [string, string, string]; repairTask: string }
> = {
  TREEHOUSE: {
    label: "Casa na Árvore",
    stages: ["Primeiras Tábuas", "Cabana de Madeira", "Mansão na Copa"],
    repairTask: "Reforçar os galhos da Casa na Árvore",
  },
  CASTLE: {
    label: "Castelo",
    stages: ["Primeira Muralha", "Forte de Pedra", "Castelo Real"],
    repairTask: "Arrumar o jardim do Castelo",
  },
  SPACE_BASE: {
    label: "Estação Espacial",
    stages: ["Plataforma de Lançamento", "Foguete em Montagem", "Foguete Estelar"],
    repairTask: "Consertar a janelinha do Foguete",
  },
  OBSERVATORY: {
    label: "Observatório",
    stages: ["Fundação", "Cúpula em Obras", "Observatório Estelar"],
    repairTask: "Limpar a lente do telescópio",
  },
};

export function buildingArt(type: BuildingType, level: number) {
  return `/art/buildings/${type.toLowerCase()}-${level}.png`;
}

const BUILDING_LEVELS = [
  { level: 1, min: 0 },
  { level: 2, min: 100 },
  { level: 3, min: 300 },
];

// ---------- Categorias de eventos ----------

export const POSITIVE_CATEGORIES = {
  TASK: "Tarefa concluída",
  COLLAB: "Colaboração",
  BEHAVIOR: "Bom comportamento",
} as const;
export type PositiveCategory = keyof typeof POSITIVE_CATEGORIES;

export const ATTENTION_CATEGORIES = {
  INTERRUPTION: { label: "Interrupção de aula", mission: "Participar com respeito na próxima atividade" },
  MISSING_TASK: { label: "Tarefa não entregue", mission: "Entregar a próxima tarefa" },
} as const;
export type AttentionCategory = keyof typeof ATTENTION_CATEGORIES;

// ---------- Níveis ----------

export type LevelInfo = {
  level: number;
  name: string;
  /** Pontos dentro do nível atual. */
  current: number;
  /** Pontos necessários para o próximo nível (null no nível máximo). */
  needed: number | null;
  /** Progresso de 0 a 1 até o próximo nível (1 no nível máximo). */
  progress: number;
};

function levelFor(value: number, levels: { level: number; min: number }[], names: string[]): LevelInfo {
  let i = 0;
  while (i + 1 < levels.length && value >= levels[i + 1].min) i++;
  const next = levels[i + 1];
  const current = value - levels[i].min;
  const needed = next ? next.min - levels[i].min : null;
  return {
    level: levels[i].level,
    name: names[i],
    current,
    needed,
    progress: needed ? current / needed : 1,
  };
}

export function petLevel(xp: number): LevelInfo {
  return levelFor(xp, PET_LEVELS, PET_LEVELS.map((l) => l.name));
}

export function buildingLevel(bricks: number, type: BuildingType): LevelInfo {
  return levelFor(bricks, BUILDING_LEVELS, BUILDING_INFO[type].stages);
}

// ---------- Ações ----------

export type PetState = { xp: number; mood: Mood; recoveryMission: string | null };
export type ClassroomState = {
  bricks: number;
  maintenanceNeeded: number;
  streak: number;
  lastStreakDay: string | null;
};

export type PositiveResult = {
  pet: PetState;
  classroom: ClassroomState;
  xpGained: number;
  bricksGained: number;
  maintenanceRepaired: number;
  recovered: boolean;
  streakAdvanced: boolean;
};

/** Ação positiva: +10 XP e humor HAPPY para o aluno; +10 tijolinhos para a turma (manutenção é paga primeiro). */
export function applyPositive(pet: PetState, classroom: ClassroomState, today: string): PositiveResult {
  const recovered = pet.recoveryMission !== null;
  const xpGained = POSITIVE_XP + (recovered ? RECOVERY_BONUS_XP : 0);

  const maintenanceRepaired = Math.min(classroom.maintenanceNeeded, POSITIVE_BRICKS);
  const maintenanceNeeded = classroom.maintenanceNeeded - maintenanceRepaired;
  let bricksGained = POSITIVE_BRICKS - maintenanceRepaired;

  // Sequência: avança uma vez por dia, apenas sem manutenção pendente (fica pausada, nunca zera).
  const streakAdvanced = maintenanceNeeded === 0 && classroom.lastStreakDay !== today;
  if (streakAdvanced) bricksGained += STREAK_BONUS_BRICKS;

  return {
    pet: { xp: pet.xp + xpGained, mood: "HAPPY", recoveryMission: null },
    classroom: {
      bricks: classroom.bricks + bricksGained,
      maintenanceNeeded,
      streak: classroom.streak + (streakAdvanced ? 1 : 0),
      lastStreakDay: streakAdvanced ? today : classroom.lastStreakDay,
    },
    xpGained,
    bricksGained,
    maintenanceRepaired,
    recovered,
    streakAdvanced,
  };
}

export type AttentionResult = { pet: PetState; classroom: ClassroomState; mission: string };

/** Ponto de Atenção: sem perda de XP/tijolinhos. Pet fica TIRED com Missão de Recuperação; turma ganha reparo. */
export function applyAttention(
  pet: PetState,
  classroom: ClassroomState,
  category: AttentionCategory,
): AttentionResult {
  const mission = pet.recoveryMission ?? ATTENTION_CATEGORIES[category].mission;
  return {
    pet: { xp: pet.xp, mood: "TIRED", recoveryMission: mission },
    classroom: { ...classroom, maintenanceNeeded: classroom.maintenanceNeeded + MAINTENANCE_PER_ATTENTION },
    mission,
  };
}

/** Data local no formato YYYY-MM-DD. */
export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---------- Ofensiva de avaliações ----------
// Regras de prazo e de dias completos em src/lib/feedback-rules.ts.

/** Bônus de XP (só para o pet) ao completar a avaliação de todas as aulas de um dia letivo. */
export const FEEDBACK_STREAK_XP = 3;

// ---------- Boletim ----------

export const ATTENDANCE_STATUS = {
  PRESENT: { label: "Presente", short: "P" },
  LATE: { label: "Atraso", short: "A" },
  ABSENT: { label: "Falta", short: "F" },
} as const;
export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;

/** Média de 0 a 10, normalizando cada nota pela nota máxima da avaliação. */
export function gradeAverage(grades: { score: number; maxScore: number }[]): number | null {
  if (grades.length === 0) return null;
  return grades.reduce((s, g) => s + (g.score / g.maxScore) * 10, 0) / grades.length;
}

/** Frequência de 0 a 1 (atraso conta como presença). */
export function attendanceRate(statuses: string[]): number | null {
  if (statuses.length === 0) return null;
  return statuses.filter((s) => s !== "ABSENT").length / statuses.length;
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0];
}
