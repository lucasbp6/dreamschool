import { describe, expect, it } from "vitest";
import { overlaps, previousSchoolDay, validateSlot, type ExistingSlot } from "./schedule";

const existing: ExistingSlot[] = [
  {
    weekday: 1,
    startTime: "07:30",
    endTime: "08:20",
    classroomId: "4A",
    classroomName: "4º Ano A",
    teacherId: "marina",
    teacherName: "Prof.ª Marina",
    subjectName: "Matemática",
  },
];

describe("grade horária", () => {
  it("aulas encostadas não se sobrepõem", () => {
    expect(overlaps({ weekday: 1, startTime: "07:30", endTime: "08:20" }, { weekday: 1, startTime: "08:20", endTime: "09:10" })).toBe(false);
    expect(overlaps({ weekday: 1, startTime: "07:30", endTime: "08:20" }, { weekday: 1, startTime: "08:00", endTime: "09:00" })).toBe(true);
    expect(overlaps({ weekday: 1, startTime: "07:30", endTime: "08:20" }, { weekday: 2, startTime: "07:30", endTime: "08:20" })).toBe(false);
  });

  it("rejeita horários inválidos", () => {
    const base = { weekday: 2, classroomId: "4A", teacherId: "carlos" };
    expect(validateSlot({ ...base, startTime: "7:30", endTime: "08:20" }, [])).toMatch(/HH:MM/);
    expect(validateSlot({ ...base, startTime: "09:00", endTime: "08:00" }, [])).toMatch(/depois do início/);
    expect(validateSlot({ ...base, weekday: 9, startTime: "07:30", endTime: "08:20" }, [])).toMatch(/dia da semana/);
  });

  it("detecta conflito na mesma turma", () => {
    const msg = validateSlot({ weekday: 1, startTime: "08:00", endTime: "08:50", classroomId: "4A", teacherId: "carlos" }, existing);
    expect(msg).toMatch(/A turma já tem Matemática/);
  });

  it("detecta professor em duas turmas no mesmo horário", () => {
    const msg = validateSlot({ weekday: 1, startTime: "07:30", endTime: "08:20", classroomId: "5B", teacherId: "marina" }, existing);
    expect(msg).toMatch(/Prof.ª Marina já dá Matemática na 4º Ano A/);
  });

  it("aceita aula sem conflito", () => {
    expect(validateSlot({ weekday: 1, startTime: "07:30", endTime: "08:20", classroomId: "5B", teacherId: "carlos" }, existing)).toBeNull();
  });
});

describe("dia letivo anterior", () => {
  it("de segunda volta para sexta", () => {
    expect(previousSchoolDay("2026-10-26", [1, 2, 3, 4, 5])).toBe("2026-10-23");
  });
  it("de quarta volta para terça", () => {
    expect(previousSchoolDay("2026-10-28", [1, 2, 3, 4, 5])).toBe("2026-10-27");
  });
  it("sem aulas não há dia anterior", () => {
    expect(previousSchoolDay("2026-10-28", [])).toBeNull();
  });
});
