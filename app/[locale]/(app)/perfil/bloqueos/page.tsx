import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IconLink } from "@/components/ui/IconBtn";
import { BlocksList } from "@/components/profile/BlocksList";

export default async function BloqueosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: blocks } = await supabase
    .from("user_blocks")
    .select(
      `blocked_id, created_at,
       blocked:profiles!user_blocks_blocked_id_fkey (id, alias, display_name, avatar_url, color)`,
    )
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  type BlockRow = {
    blocked_id: string;
    created_at: string;
    blocked: {
      id: string;
      alias: string;
      display_name: string | null;
      avatar_url: string | null;
      color: string | null;
    } | null;
  };

  const rows: BlockRow[] = (blocks ?? []).map((b) => ({
    blocked_id: b.blocked_id,
    created_at: b.created_at,
    blocked: Array.isArray(b.blocked) ? b.blocked[0] ?? null : b.blocked,
  }));

  return (
    <main className="px-5 pb-10 pt-14">
      <div className="flex items-center gap-2">
        <IconLink href="/perfil" ariaLabel="Volver al perfil">
          <ChevronLeft size={18} strokeWidth={2} />
        </IconLink>
        <h1 className="font-display text-2xl">Bloqueos</h1>
      </div>
      <p className="mt-1 text-xs text-text-2">
        Aquí están los coleccionistas que has bloqueado. No los verás en el mapa,
        en la búsqueda ni en tus chats.
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-line bg-gradient-to-b from-paper to-bone px-6 py-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700">
            <ShieldOff size={22} strokeWidth={2.2} />
          </div>
          <h2 className="mt-3 font-display text-lg">No has bloqueado a nadie</h2>
          <p className="mt-1 max-w-xs text-xs leading-snug text-text-2">
            Si alguna conversación se vuelve incómoda, puedes bloquear desde el
            menú de su perfil. Lo encontrarás aquí para gestionarlo.
          </p>
        </div>
      ) : (
        <BlocksList rows={rows} />
      )}
    </main>
  );
}
