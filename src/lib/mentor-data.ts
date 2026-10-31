// Acesso às sessões "Ensinar o pet", sempre conferindo que a sessão é do aluno ativo.
import { db } from "./db";
import { getActingUser } from "./session";
import type { MentorContext, MentorTurn } from "./mentor";

export async function loadOwnSession(sessionId: string) {
  const student = await getActingUser("STUDENT");
  const session = await db.mentorSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } }, student: { include: { pet: true } } },
  });
  if (!session || session.studentId !== student.id || !session.student.pet) return null;

  const pet = session.student.pet;
  const ctx: MentorContext = {
    petName: pet.petName,
    petType: pet.petType,
    studentName: session.student.name,
    subjectName: session.subjectName,
    topic: session.topic,
  };
  const history: MentorTurn[] = session.messages.map((m) => ({ role: m.role as MentorTurn["role"], content: m.content }));
  return { session, pet, ctx, history };
}
