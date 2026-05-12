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
    .select("home_location, banned_at")
    .eq("id", user.id)
    .maybeSingle();
  // Banned users get bounced to /banned regardless of onboarding state —
  // otherwise a baneado without home_location loops back to /onboarding.
  // /banned itself short-circuits to /album once the ban is lifted, so a
  // false positive is harmless.
  if (profile?.banned_at) redirect("/banned");
  if (!profile?.home_location) redirect("/onboarding");

  const initialUnread = await loadUnreadByChat();
  return (
    <NotificationsRoot initialUnread={initialUnread}>
      <div
        className="
          relative mx-auto flex w-full max-w-screen-xl bg-bone
          h-dvh flex-col overflow-hidden
          md:h-auto md:min-h-dvh md:flex-row md:overflow-visible md:gap-0
        "
      >
        <SideNav />
        <div
          className="
            relative mx-auto w-full flex-1
            overflow-y-auto overscroll-contain
            max-w-[430px]
            md:flex-none md:basis-auto md:overflow-visible md:overscroll-auto
            md:max-w-[760px] md:pb-6
          "
        >
          {children}
        </div>
        <BottomNav />
      </div>
    </NotificationsRoot>
  );
}
