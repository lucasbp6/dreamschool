import { getActingUser } from "@/lib/session";
import { loadConversations, unreadCount } from "@/lib/messages-data";
import { MessagesPanel } from "@/components/shared/MessagesPanel";
import { PageHeader, pluralize } from "@/components/shared/ui";

export default async function ManagerMessagesPage() {
  const manager = await getActingUser("MANAGER");
  const conversations = await loadConversations(manager.id, "MANAGER");
  const unread = unreadCount(conversations);
  return (
    <div>
      <PageHeader
        title="Mensagens dos responsáveis"
        subtitle={unread > 0 ? `${pluralize(unread, "conversa nova", "conversas novas")}` : "Nenhuma conversa nova."}
      />
      <MessagesPanel role="MANAGER" conversations={conversations} />
    </div>
  );
}
