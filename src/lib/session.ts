// Autenticação simplificada (Demo Mode): o usuário ativo fica num cookie trocado pelo RoleSwitcher.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { Role } from "./game";

export const SESSION_COOKIE = "ds_user";

export async function getCurrentUser() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  return id ? db.user.findUnique({ where: { id } }) : null;
}

/** Usuário ativo para uma área; se o cookie for de outro papel, usa o primeiro usuário desse papel. */
export async function getActingUser(role: Role) {
  const current = await getCurrentUser();
  if (current?.role === role) return current;
  const fallback = await db.user.findFirst({ where: { role }, orderBy: { name: "asc" } });
  if (!fallback) redirect("/");
  return fallback;
}
