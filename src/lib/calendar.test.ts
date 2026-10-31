import { describe, expect, it } from "vitest";
import {
  addDays,
  currentOrNextSchoolDay,
  dayStatus,
  monthWeeks,
  previousSchoolDay,
  schoolDaysBetween,
  type CalendarData,
} from "./calendar";

const WEEKDAYS = [1, 2, 3, 4, 5];
const cal: CalendarData = {
  termStart: "2026-02-02",
  termEnd: "2026-12-11",
  days: [
    { date: "2026-11-02", kind: "HOLIDAY", label: "Finados" },
    { date: "2026-07-13", kind: "RECESS", label: "Recesso de julho" },
    { date: "2026-11-06", kind: "EVENT", label: "Feira de Ciências" },
  ],
};

describe("calendário letivo", () => {
  it("classifica os dias", () => {
    expect(dayStatus("2026-11-03", cal, WEEKDAYS)).toEqual({ school: true, special: undefined });
    expect(dayStatus("2026-10-31", cal, WEEKDAYS)).toMatchObject({ school: false, reason: "NO_LESSONS" });
    expect(dayStatus("2026-11-02", cal, WEEKDAYS)).toMatchObject({ school: false, reason: "HOLIDAY" });
    expect(dayStatus("2026-07-13", cal, WEEKDAYS)).toMatchObject({ school: false, reason: "RECESS" });
    expect(dayStatus("2026-11-06", cal, WEEKDAYS)).toMatchObject({ school: true, special: { label: "Feira de Ciências" } });
    expect(dayStatus("2026-12-14", cal, WEEKDAYS)).toMatchObject({ school: false, reason: "OUT_OF_TERM" });
  });

  it("dia letivo anterior pula fim de semana e feriado", () => {
    // terça 03/11: segunda 02/11 é Finados → volta para sexta 30/10
    expect(previousSchoolDay("2026-11-03", cal, WEEKDAYS)).toBe("2026-10-30");
    expect(previousSchoolDay("2026-10-28", cal, WEEKDAYS)).toBe("2026-10-27");
    expect(previousSchoolDay("2026-10-28", cal, [])).toBeNull();
  });

  it("conta dias letivos de um período", () => {
    // 02/11 a 06/11: Finados não conta, a Feira de Ciências conta
    expect(schoolDaysBetween("2026-11-02", "2026-11-08", cal, WEEKDAYS)).toEqual([
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
    ]);
  });

  it("monta as semanas do mês começando na segunda", () => {
    const weeks = monthWeeks(2026, 11);
    expect(weeks[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]); // 01/11/2026 é domingo
    expect(weeks.at(-1)?.[0]).toBe("2026-11-30");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("dia das aulas para o lembrete: hoje ou o próximo dia letivo", () => {
    expect(currentOrNextSchoolDay("2026-11-03", cal, WEEKDAYS)).toBe("2026-11-03");
    // sábado 31/10 → domingo → segunda 02/11 é Finados → terça 03/11
    expect(currentOrNextSchoolDay("2026-10-31", cal, WEEKDAYS)).toBe("2026-11-03");
    expect(currentOrNextSchoolDay("2026-12-12", cal, WEEKDAYS)).toBeNull(); // depois do fim do período
  });
});
