import { describe, expect, it } from "vitest";
import { rankClassrooms } from "./ranking";

describe("ranking das turmas", () => {
  it("ordena por pontuação e calcula quanto falta para subir", () => {
    const r = rankClassrooms([
      { id: "a", name: "4º Ano A", score: 135 },
      { id: "b", name: "5º Ano B", score: 210 },
      { id: "c", name: "3º Ano C", score: 60 },
    ]);
    expect(r.map((x) => [x.name, x.position, x.gapToNext])).toEqual([
      ["5º Ano B", 1, null],
      ["4º Ano A", 2, 75],
      ["3º Ano C", 3, 75],
    ]);
  });

  it("empates dividem a posição e a próxima pula", () => {
    const r = rankClassrooms([
      { id: "a", name: "B", score: 100 },
      { id: "b", name: "A", score: 100 },
      { id: "c", name: "C", score: 40 },
      { id: "d", name: "D", score: 200 },
    ]);
    expect(r.map((x) => [x.name, x.position, x.gapToNext])).toEqual([
      ["D", 1, null],
      ["A", 2, 100],
      ["B", 2, 100],
      ["C", 4, 60],
    ]);
  });
});
