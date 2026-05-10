import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { NotificationsRoot } from "@/components/notifications/NotificationsRoot";
import { loadUnreadByChat } from "@/lib/chat/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_location")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.home_location) redirect("/onboarding");

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
