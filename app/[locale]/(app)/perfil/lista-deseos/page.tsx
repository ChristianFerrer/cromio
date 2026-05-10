import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IconLink } from "@/components/ui/IconBtn";
import { WishlistGrid } from "@/components/profile/WishlistGrid";

export default async function ListaDeseosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("user_wishlist")
    .select("sticker_n, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const stickerNumbers = (rows ?? []).map((r) => r.sticker_n);

  return (
    <main className="px-5 pb-10 pt-14">
      <div className="flex items-center gap-2">
        <IconLink href="/perfil" ariaLabel="Volver al perfil">
          <ChevronLeft size={18} strokeWidth={2} />
        </IconLink>
        <h1 className="font-display text-2xl">Lista de deseos</h1>
      </div>
      <p className="mt-1 text-xs text-text-2">
        Los cromos que quieres conseguir. Toca cualquiera para verlo y
        compartirlo, o pulsa el corazón para quitarlo.
      </p>

      {stickerNumbers.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-line bg-gradient-to-b from-paper to-bone px-6 py-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
            <Heart size={22} strokeWidth={2.2} fill="currentColor" />
          </div>
          <h2 className="mt-3 font-display text-lg">Tu lista está vacía</h2>
          <p className="mt-1 max-w-xs text-xs leading-snug text-text-2">
            Abre cualquier cromo desde el álbum y pulsa "Añadir a deseos" para
            empezar a marcar los que te faltan o más quieres conseguir.
          </p>
          <Link
            href="/album"
            className="mt-4 rounded-md bg-green-500 px-4 py-2.5 text-xs font-bold text-white shadow-sh1"
          >
            Ir al álbum
          </Link>
        </div>
      ) : (
        <WishlistGrid initialNumbers={stickerNumbers} />
      )}
    </main>
  );
}
