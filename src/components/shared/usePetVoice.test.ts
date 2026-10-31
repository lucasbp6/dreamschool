import { describe, expect, it } from "vitest";
import { speakable, splitSentences } from "./usePetVoice";

describe("voz do pet", () => {
  it("separa frases completas do trecho que ainda está chegando", () => {
    expect(splitSentences("Oi, Lia! Que legal. Você pode me exp")).toEqual({
      complete: ["Oi, Lia!", "Que legal."],
      rest: "Você pode me exp",
    });
    expect(splitSentences("Hmm, fiquei com uma dúvida... eu tinha ouvido que ")).toEqual({
      complete: ["Hmm, fiquei com uma dúvida..."],
      rest: "eu tinha ouvido que ",
    });
  });

  it("não lê emojis nem símbolos de formatação", () => {
    expect(speakable("Uau! 🌱 Você é **incrível** ✨")).toBe("Uau! Você é incrível");
  });
});
