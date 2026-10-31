// Ranking das turmas (funções puras). A pontuação são os tijolinhos da construção coletiva.

export type RankInput = { id: string; name: string; score: number };
export type RankRow<T extends RankInput> = T & {
  position: number;
  /** Tijolinhos que faltam para alcançar a turma da posição de cima (null para quem está em 1º). */
  gapToNext: number | null;
};

/** Ordena por pontuação; empates dividem a posição (1º, 2º, 2º, 4º) e são exibidos em ordem alfabética. */
export function rankClassrooms<T extends RankInput>(items: T[]): RankRow<T>[] {
  const sorted = [...items].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "pt-BR"));
  return sorted.map((item, i) => {
    const position = sorted.findIndex((x) => x.score === item.score) + 1;
    const ahead = sorted.slice(0, i).filter((x) => x.score > item.score).at(-1);
    return { ...item, position, gapToNext: ahead ? ahead.score - item.score : null };
  });
}
