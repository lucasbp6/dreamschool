"use server";

// Mensagens: o responsável começa a conversa; os dois lados respondem. Toda ação confere se quem está
// agindo (no papel informado) participa da conversa.
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { getActingUser } from "./session";
import { parentRecipients } from "./messages-data";
import type { Role } from "./game";

export type MessageResult = { ok: boolean; message: string; conversationId?: string };

const MAX_BODY = 2000;

async function participant(conversationId: string, role: Role) {
  const me = await getActingUser(role);
  const c = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!c) return null;
  const side = c.parentId === me.id ? "parent" : c.recipientId === me.id ? "recipient" : null;
  return side ? { me, c, side } : null;
}

export async function startConversation(
  recipientId: string,
  studentId: string,
  subject: string,
  body: string,
): Promise<MessageResult> {
  const parent = await getActingUser("PARENT");
  const cleanSubject = subject.trim().slice(0, 120);
  const cleanBody = body.trim().slice(0, MAX_BODY);
  if (!cleanSubject) return { ok: false, message: "Escreva um assunto." };
  if (!cleanBody) return { ok: false, message: "Escreva a mensagem." };
  if (!(await parentRecipients(parent.id)).some((r) => r.id === recipientId))
    return { ok: false, message: "Escolha um professor dos seus filhos ou a gestão da escola." };
  const child = studentId ? await db.user.findFirst({ where: { id: studentId, parentId: parent.id } }) : null;

  const now = new Date();
  const c = await db.conversation.create({
    data: {
      subject: cleanSubject,
      parentId: parent.id,
      recipientId,
      studentId: child?.id ?? null,
      parentReadAt: now,
      messages: { create: { body: cleanBody, authorId: parent.id, createdAt: now } },
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Mensagem enviada!", conversationId: c.id };
}

export async function replyConversation(role: Role, conversationId: string, body: string): Promise<MessageResult> {
  const p = await participant(conversationId, role);
  if (!p) return { ok: false, message: "Conversa não encontrada." };
  const cleanBody = body.trim().slice(0, MAX_BODY);
  if (!cleanBody) return { ok: false, message: "Escreva a mensagem." };
  const now = new Date();
  await db.$transaction([
    db.conversationMessage.create({ data: { conversationId, authorId: p.me.id, body: cleanBody, createdAt: now } }),
    db.conversation.update({
      where: { id: conversationId },
      data: p.side === "parent" ? { parentReadAt: now } : { recipientReadAt: now },
    }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Resposta enviada!", conversationId };
}

export async function markConversationRead(role: Role, conversationId: string) {
  const p = await participant(conversationId, role);
  if (!p) return;
  await db.conversation.update({
    where: { id: conversationId },
    // Ler não é atividade nova: mantém o updatedAt (que ordena a lista).
    data: {
      ...(p.side === "parent" ? { parentReadAt: new Date() } : { recipientReadAt: new Date() }),
      updatedAt: p.c.updatedAt,
    },
    select: { id: true },
  });
  revalidatePath("/", "layout");
}
