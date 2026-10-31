import { describe, expect, it } from "vitest";
import { canEvaluate, completedDays, computeFeedbackStreak, isDayComplete, type LessonsOn, type RatedOn } from "./feedback-rules";

// Segunda a sexta com Matemática (mat) e Português (por); 02/11/2026 é feriado (Finados).
const HOLIDAYS = new Set(["2026-11-02"]);
const lessonsOn: LessonsOn = (d) => {
  const wd = new Date(`${d}T12:00:00`).getDay();
  return wd >= 1 && wd <= 5 && !HOLIDAYS.has(d) ? ["mat", "por"] : [];
};
const ratings = (map: Record<string, string[]>): RatedOn => (d) => new Set(map[d] ?? []);

describe("prazo de avaliação", () => {
  it("vale no dia da aula e no dia seguinte", () => {
    expect(canEvaluate("2026-10-30", "2026-10-30")).toBe(true);
    expect(canEvaluate("2026-10-30", "2026-10-31")).toBe(true);
    expect(canEvaluate("2026-10-30", "2026-11-01")).toBe(false);
    expect(canEvaluate("2026-11-03", "2026-11-02")).toBe(false); // aula futura
  });
});

describe("ofensiva por dias completos", () => {
  it("dia só conta quando todas as aulas foram avaliadas", () => {
    const rated = ratings({ "2026-10-29": ["mat"] });
    expect(isDayComplete("2026-10-29", lessonsOn, rated)).toBe(false);
    expect(isDayComplete("2026-10-29", lessonsOn, ratings({ "2026-10-29": ["mat", "por"] }))).toBe(true);
  });

  it("não sobe com avaliação parcial e sobe ao completar o dia", () => {
    const partial = ratings({ "2026-10-29": ["mat", "por"], "2026-10-30": ["mat"] });
    expect(computeFeedbackStreak("2026-10-30", lessonsOn, partial)).toBe(1);
    const full = ratings({ "2026-10-29": ["mat", "por"], "2026-10-30": ["mat", "por"] });
    expect(computeFeedbackStreak("2026-10-30", lessonsOn, full)).toBe(2);
  });

  it("fim de semana e feriado não alteram; dia letivo perdido quebra", () => {
    const r = ratings({ "2026-10-29": ["mat", "por"], "2026-10-30": ["mat", "por"] });
    // terça 03/11, ainda sem avaliar: sábado, domingo e Finados não contam; a ofensiva segue em 2
    expect(computeFeedbackStreak("2026-11-03", lessonsOn, r)).toBe(2);
    // quinta 05/11: a terça ficou incompleta e o prazo dela venceu → quebra
    expect(computeFeedbackStreak("2026-11-05", lessonsOn, r)).toBe(0);
  });

  it("dia de ontem ainda no prazo não quebra e pode ser completado depois", () => {
    const r = ratings({ "2026-10-28": ["mat", "por"], "2026-10-30": ["mat", "por"] });
    // sexta 30/10: a quinta 29 ficou incompleta, mas ainda pode ser avaliada hoje → não quebra
    expect(computeFeedbackStreak("2026-10-30", lessonsOn, r)).toBe(2);
    // no sábado o prazo da quinta venceu: só a sexta conta
    expect(computeFeedbackStreak("2026-10-31", lessonsOn, r)).toBe(1);
  });

  it("lista os dias completos para o calendário", () => {
    const r = ratings({ "2026-10-29": ["mat", "por"], "2026-10-30": ["mat"] });
    expect(completedDays("2026-10-26", "2026-10-31", lessonsOn, r)).toEqual(["2026-10-29"]);
  });
});
