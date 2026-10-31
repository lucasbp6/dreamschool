import type { CalendarData } from "../src/lib/calendar";

/** Ano letivo de 2026: feriados nacionais, Carnaval, recesso de julho, Dia do Professor e um evento. */
export const CALENDAR: CalendarData = {
  termStart: "2026-02-02",
  termEnd: "2026-12-11",
  days: [
    { date: "2026-02-16", kind: "RECESS", label: "Carnaval" },
    { date: "2026-02-17", kind: "RECESS", label: "Carnaval" },
    { date: "2026-04-03", kind: "HOLIDAY", label: "Sexta-feira Santa" },
    { date: "2026-04-21", kind: "HOLIDAY", label: "Tiradentes" },
    { date: "2026-05-01", kind: "HOLIDAY", label: "Dia do Trabalho" },
    { date: "2026-06-04", kind: "HOLIDAY", label: "Corpus Christi" },
    ...Array.from({ length: 12 }, (_, i) => ({
      date: `2026-07-${String(13 + i).padStart(2, "0")}`,
      kind: "RECESS",
      label: "Recesso de julho",
    })),
    { date: "2026-09-07", kind: "HOLIDAY", label: "Independência do Brasil" },
    { date: "2026-10-12", kind: "HOLIDAY", label: "Nossa Senhora Aparecida / Dia das Crianças" },
    { date: "2026-10-15", kind: "RECESS", label: "Dia do Professor" },
    { date: "2026-11-02", kind: "HOLIDAY", label: "Finados" },
    { date: "2026-11-06", kind: "EVENT", label: "Feira de Ciências" },
    { date: "2026-11-20", kind: "HOLIDAY", label: "Dia da Consciência Negra" },
  ],
};
