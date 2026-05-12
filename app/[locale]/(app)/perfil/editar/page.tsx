import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "@/components/profile/EditProfileForm";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("alias, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <EditProfileForm
      userId={user.id}
      initial={{
        alias: profile?.alias ?? "",
        display_name: profile?.display_name ?? "",
      }}
    />
  );
}
