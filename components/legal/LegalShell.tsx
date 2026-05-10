import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { IconLink } from "@/components/ui/IconBtn";

export function LegalShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="px-5 pb-10 pt-14">
      <div className="flex items-center gap-2">
        <IconLink href="/perfil" ariaLabel="Volver al perfil">
          <ChevronLeft size={18} strokeWidth={2} />
        </IconLink>
        <h1 className="font-display text-2xl">{title}</h1>
      </div>
      {subtitle && <p className="mt-1 text-xs text-text-2">{subtitle}</p>}
      <article className="cromio-legal mt-5 text-sm leading-relaxed text-text">
        {children}
      </article>
      <nav className="mt-8 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-2">
        <Link href="/sobre" className="hover:text-text">Sobre Cromio</Link>
        <span>·</span>
        <Link href="/terminos" className="hover:text-text">Términos</Link>
        <span>·</span>
        <Link href="/privacidad" className="hover:text-text">Privacidad</Link>
      </nav>
    </main>
  );
}
