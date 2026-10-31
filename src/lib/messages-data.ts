// Mensagens entre responsáveis e professores/gestão: leitura das conversas e destinatários possíveis.
import { db } from "./db";
import type { Role } from "./game";

export type ConversationView = {
  id: string;
  subject: string;
  /** Com quem a pessoa está conversando (o outro lado). */
  withName: string;
  withRole: string;
  studentName: string | null;
  updatedAt: string;
  unread: boolean;
  messages: { id: string; body: string; createdAt: string; mine: boolean; authorName: string }[];
};

export type Recipient = { id: string; label: string };

/** Conversas de um responsável (as que ele começou) ou de um professor/gestor (as que recebeu). */
export async function loadConversations(userId: string, role: Role): Promise<ConversationView[]> {
  const asParent = role === "PARENT";
  const rows = await db.conversation.findMany({
    where: asParent ? { parentId: userId } : { recipientId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      parent: { select: { name: true } },
      recipient: { select: { name: true, role: true } },
      student: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } },
    },
  });
  return rows.map((c) => {
    const last = c.messages.at(-1);
    const readAt = asParent ? c.parentReadAt : c.recipientReadAt;
    return {
      id: c.id,
      subject: c.subject,
      withName: asParent ? c.recipient.name : c.parent.name,
      withRole: asParent ? (c.recipient.role === "MANAGER" ? "Gestão da escola" : "Professor(a)") : "Responsável",
      studentName: c.student?.name ?? null,
      updatedAt: c.updatedAt.toISOString(),
      unread: !!last && last.authorId !== userId && (!readAt || last.createdAt > readAt),
      messages: c.messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
        mine: m.authorId === userId,
        authorName: m.author.name,
      })),
    };
  });
}

/** Para quem um responsável pode escrever: professores das turmas dos filhos e a gestão da escola. */
export async function parentRecipients(parentId: string): Promise<Recipient[]> {
  const parent = await db.user.findUniqueOrThrow({
    where: { id: parentId },
    include: {
      children: {
        include: {
          classroom: { include: { classSubjects: { include: { teacher: true, subject: true } } } },
        },
      },
    },
  });
  const teachers = new Map<string, { name: string; details: Set<string> }>();
  for (const child of parent.children) {
    for (const cs of child.classroom?.classSubjects ?? []) {
      const t = teachers.get(cs.teacherId) ?? { name: cs.teacher.name, details: new Set<string>() };
      t.details.add(`${cs.subject.name} (${child.classroom!.name})`);
      teachers.set(cs.teacherId, t);
    }
  }
  const managers = await db.user.findMany({ where: { schoolId: parent.schoolId, role: "MANAGER" }, orderBy: { name: "asc" } });
  return [
    ...managers.map((m) => ({ id: m.id, label: `${m.name} — Gestão da escola` })),
    ...[...teachers]
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .map(([id, t]) => ({ id, label: `${t.name} — ${[...t.details].join(", ")}` })),
  ];
}

export function unreadCount(conversations: ConversationView[]) {
  return conversations.filter((c) => c.unread).length;
}
