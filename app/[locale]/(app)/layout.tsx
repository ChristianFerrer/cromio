import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
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
      <div className="relative mx-auto flex min-h-dvh w-full max-w-screen-xl bg-bone md:gap-0">
        <SideNav />
        <div className="relative mx-auto w-full max-w-[430px] pb-20 md:max-w-[760px] md:pb-6">
          {children}
        </div>
        <BottomNav />
      </div>
    </NotificationsRoot>
  );
}
