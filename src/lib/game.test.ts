import { describe, expect, it } from "vitest";
import {
  FEEDBACK_STREAK_XP,
  applyAttention,
  applyPositive,
  attendanceRate,
  buildingLevel,
  completeFeedbackDay,
  currentFeedbackStreak,
  firstName,
  gradeAverage,
  petLevel,
  type ClassroomState,
  type PetState,
} from "./game";

const pet: PetState = { xp: 40, mood: "NEUTRAL", recoveryMission: null };
const room: ClassroomState = { bricks: 95, maintenanceNeeded: 0, streak: 2, lastStreakDay: "2026-10-30" };

describe("níveis", () => {
  it("pet muda de nível em 50 e 150 XP", () => {
    expect(petLevel(49).name).toBe("Filhote");
    expect(petLevel(50).name).toBe("Jovem");
    expect(petLevel(149).level).toBe(2);
    expect(petLevel(150).name).toBe("Guardião");
    expect(petLevel(500).progress).toBe(1);
  });

  it("construção muda de nível em 100 e 300 tijolinhos", () => {
    expect(buildingLevel(99, "CASTLE").name).toBe("Primeira Muralha");
    expect(buildingLevel(100, "CASTLE").name).toBe("Forte de Pedra");
    expect(buildingLevel(300, "OBSERVATORY").name).toBe("Observatório Estelar");
    expect(buildingLevel(150, "TREEHOUSE").progress).toBe(0.25);
  });
});

describe("ação positiva", () => {
  it("dá XP, deixa o pet radiante e soma tijolinhos com bônus de sequência no 1º do dia", () => {
    const r = applyPositive(pet, room, "2026-10-31");
    expect(r.pet).toEqual({ xp: 50, mood: "HAPPY", recoveryMission: null });
    expect(r.bricksGained).toBe(15);
    expect(r.classroom.streak).toBe(3);
  });

  it("não repete o bônus de sequência no mesmo dia", () => {
    const r = applyPositive(pet, { ...room, lastStreakDay: "2026-10-31" }, "2026-10-31");
    expect(r.bricksGained).toBe(10);
    expect(r.classroom.streak).toBe(2);
  });

  it("paga a manutenção antes de somar tijolinhos e pausa a sequência enquanto houver reparo", () => {
    const r = applyPositive(pet, { ...room, maintenanceNeeded: 15 }, "2026-10-31");
    expect(r.maintenanceRepaired).toBe(10);
    expect(r.classroom.maintenanceNeeded).toBe(5);
    expect(r.classroom.bricks).toBe(95);
    expect(r.streakAdvanced).toBe(false);

    const r2 = applyPositive(pet, r.classroom, "2026-10-31");
    expect(r2.maintenanceRepaired).toBe(5);
    expect(r2.classroom.maintenanceNeeded).toBe(0);
    expect(r2.bricksGained).toBe(5 + 5);
  });

  it("concluir a missão de recuperação dá bônus de superação", () => {
    const r = applyPositive({ ...pet, mood: "TIRED", recoveryMission: "Entregar a próxima tarefa" }, room, "2026-10-31");
    expect(r.recovered).toBe(true);
    expect(r.xpGained).toBe(15);
    expect(r.pet.mood).toBe("HAPPY");
  });
});

describe("ponto de atenção", () => {
  it("nunca reduz XP nem tijolinhos", () => {
    const r = applyAttention(pet, room, "MISSING_TASK");
    expect(r.pet.xp).toBe(pet.xp);
    expect(r.classroom.bricks).toBe(room.bricks);
    expect(r.pet.mood).toBe("TIRED");
    expect(r.pet.recoveryMission).toBe("Entregar a próxima tarefa");
    expect(r.classroom.maintenanceNeeded).toBe(5);
  });

  it("mantém a missão já ativa e acumula reparo", () => {
    const first = applyAttention(pet, room, "MISSING_TASK");
    const second = applyAttention(first.pet, first.classroom, "INTERRUPTION");
    expect(second.mission).toBe("Entregar a próxima tarefa");
    expect(second.classroom.maintenanceNeeded).toBe(10);
  });
});

describe("ofensiva de avaliações", () => {
  it("começa em 1 e dá bônus pequeno", () => {
    const r = completeFeedbackDay({ feedbackStreak: 0, lastFeedbackDay: null }, "2026-10-26", "2026-10-23");
    expect(r).toEqual({ feedbackStreak: 1, lastFeedbackDay: "2026-10-26", xpBonus: FEEDBACK_STREAK_XP });
  });

  it("continua se o dia letivo anterior foi completo (sexta → segunda)", () => {
    const r = completeFeedbackDay({ feedbackStreak: 4, lastFeedbackDay: "2026-10-23" }, "2026-10-26", "2026-10-23");
    expect(r.feedbackStreak).toBe(5);
  });

  it("recomeça se pulou um dia letivo, sem tirar XP", () => {
    const r = completeFeedbackDay({ feedbackStreak: 4, lastFeedbackDay: "2026-10-21" }, "2026-10-26", "2026-10-23");
    expect(r.feedbackStreak).toBe(1);
    expect(r.xpBonus).toBeGreaterThan(0);
  });

  it("não dá bônus duas vezes no mesmo dia", () => {
    const r = completeFeedbackDay({ feedbackStreak: 2, lastFeedbackDay: "2026-10-26" }, "2026-10-26", "2026-10-23");
    expect(r).toEqual({ feedbackStreak: 2, lastFeedbackDay: "2026-10-26", xpBonus: 0 });
  });

  it("ofensiva exibida zera só depois de perder um dia letivo", () => {
    const s = { feedbackStreak: 3, lastFeedbackDay: "2026-10-23" };
    expect(currentFeedbackStreak(s, "2026-10-26", "2026-10-23")).toBe(3);
    expect(currentFeedbackStreak(s, "2026-10-27", "2026-10-26")).toBe(0);
  });
});

describe("boletim", () => {
  it("normaliza notas para 0–10", () => {
    expect(gradeAverage([{ score: 8, maxScore: 10 }, { score: 15, maxScore: 20 }])).toBeCloseTo(7.75);
    expect(gradeAverage([])).toBeNull();
  });

  it("atraso conta como presença", () => {
    expect(attendanceRate(["PRESENT", "LATE", "ABSENT", "PRESENT"])).toBe(0.75);
  });

  it("primeiro nome", () => {
    expect(firstName("João Pedro Almeida")).toBe("João");
  });
});
