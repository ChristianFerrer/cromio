import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pushNewUserToAdmins } from "@/lib/admin/push-new-user";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/album";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Detect first-time sign-in (OAuth signup or email-confirmation
      // landing): users whose auth row was created in the last minute
      // are brand new and we should ping the admins.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.created_at) {
        const ageMs = Date.now() - new Date(user.created_at).getTime();
        if (ageMs < 60_000) {
          await pushNewUserToAdmins({
            newUserId: user.id,
            newUserEmail: user.email ?? null,
          });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
