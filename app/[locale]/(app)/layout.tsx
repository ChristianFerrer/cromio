import { BottomNav } from "@/components/BottomNav";
import { NotificationsRoot } from "@/components/notifications/NotificationsRoot";
import { loadUnreadByChat } from "@/lib/chat/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUnread = await loadUnreadByChat();
  return (
    <NotificationsRoot initialUnread={initialUnread}>
      <div className="relative mx-auto min-h-dvh max-w-[430px] bg-bone pb-20">
        {children}
        <BottomNav />
      </div>
    </NotificationsRoot>
  );
}
