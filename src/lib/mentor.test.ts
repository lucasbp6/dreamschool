import { describe, expect, it } from "vitest";
import {
  MENTOR_HISTORY,
  MENTOR_MIN_EXPLANATIONS,
  earnsMentorXp,
  greeting,
  petReplyMessages,
  recapMessages,
  type MentorContext,
  type MentorTurn,
} from "./mentor";

const ctx: MentorContext = {
  petName: "Sábia",
  petType: "OWL",
  studentName: "Lia Fernandes Costa",
  subjectName: "Ciências",
  topic: "Fotossíntese",
};

describe("mentor do pet", () => {
  it("o pet cumprimenta o aluno pelo primeiro nome e cita o tema", () => {
    expect(greeting(ctx)).toContain("Lia");
    expect(greeting(ctx)).toContain("Fotossíntese");
  });

  it("o prompt coloca o pet como aprendiz que corrige com gentileza", () => {
    const [system] = petReplyMessages(ctx, []);
    expect(system.role).toBe("system");
    expect(system.content).toMatch(/aprendiz/);
    expect(system.content).toMatch(/informação correta/);
    expect(system.content).toMatch(/Fotossíntese/);
    expect(system.content).toMatch(/Não dê só pistas/);
    expect(system.content).toMatch(/transcritas automaticamente/);
  });

  it("aluno vira 'user' e pet vira 'assistant', só com o histórico recente", () => {
    const history: MentorTurn[] = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 ? "PET" : "STUDENT",
      content: `m${i}`,
    }));
    const msgs = petReplyMessages(ctx, history);
    expect(msgs).toHaveLength(MENTOR_HISTORY + 1);
    expect(msgs.at(-1)).toEqual({ role: "assistant", content: "m29" });
    expect(msgs.at(-2)).toEqual({ role: "user", content: "m28" });
  });

  it("o fechamento inclui a conversa e pede correção do que ficou errado", () => {
    const msgs = recapMessages(ctx, [{ role: "STUDENT", content: "As plantas comem terra." }]);
    expect(msgs[1].content).toContain("Lia: As plantas comem terra.");
    expect(msgs[1].content).toMatch(/versão correta/);
  });

  it("XP só com explicações suficientes e uma vez por dia", () => {
    expect(earnsMentorXp(MENTOR_MIN_EXPLANATIONS - 1, false)).toBe(false);
    expect(earnsMentorXp(MENTOR_MIN_EXPLANATIONS, false)).toBe(true);
    expect(earnsMentorXp(MENTOR_MIN_EXPLANATIONS + 2, true)).toBe(false);
  });
});
