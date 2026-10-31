import { describe, expect, it } from "vitest";
import {
  MENTOR_HISTORY,
  MENTOR_MIN_EXPLANATIONS,
  createSpeechFilter,
  earnsMentorXp,
  tidySpeech,
  fallbackOpener,
  openerMessages,
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
  it("a abertura pede uma pergunta específica e o que o aluno sabe ou acha difícil", () => {
    const [, instruction] = openerMessages(ctx);
    expect(instruction.content).toMatch(/pergunta curiosa e específica sobre "Fotossíntese"/);
    expect(instruction.content).toMatch(/o que já sabe ou qual parte/);
  });

  it("as aberturas prontas variam e citam aluno e tema", () => {
    const all = new Set([0, 1, 2].map((v) => fallbackOpener(ctx, v)));
    expect(all.size).toBe(3);
    for (const line of all) expect(line).toMatch(/Lia.*Fotossíntese|Fotossíntese.*Lia/);
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

  it("respostas degeneradas ('!!!!!!…') são cortadas no streaming e no acabamento", () => {
    const filter = createSpeechFilter();
    const out = ["Vale revisar as formas pod", "em mud!!!!", "!!!!!!!!!!!!!!!!!!!!!!", " lixo"].map(filter).join("");
    expect(out).toBe("Vale revisar as formas podem mud!!!!");
    expect(tidySpeech("Vale a pena revisar mud!!!!!!!!!!!!!!!!!!!!")).toBe("Vale a pena revisar mud!");
    expect(tidySpeech("Que legal!!! E agora?")).toBe("Que legal!!! E agora?");
  });

  it("o filtro tira ações entre asteriscos e emojis, mesmo quebrados entre pedaços do streaming", () => {
    const filter = createSpeechFilter();
    const out = ["Que legal! *bate as asi", "nhas* Você explicou bem 🌱☀️. *cur", "iosa* E agora?"].map(filter).join("");
    expect(tidySpeech(out)).toBe("Que legal! Você explicou bem. E agora?");
  });
});
