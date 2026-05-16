import { Radar } from "lucide-react";

type Size = "sm" | "md" | "lg";

const SIZES: Record<
  Size,
  { tile: number; icon: number; radius: number; text: string }
> = {
  sm: { tile: 28, icon: 19, radius: 8, text: "text-xl" },
  md: { tile: 40, icon: 26, radius: 10, text: "text-3xl" },
  lg: { tile: 64, icon: 43, radius: 14, text: "text-5xl" },
};

// Logo de Cromio: chip verde con el glifo Radar (mismo lucide-icon
// que el tab del bottomNav y el icono de la app). Reemplaza el PNG
// radar_cromio.png para que el branding sea consistente y escalable
// en cualquier tamaño sin pérdida de calidad.
export function Logo({
  size = "md",
  withWordmark = true,
  className = "",
}: {
  size?: Size;
  withWordmark?: boolean;
  className?: string;
}) {
  const { tile, icon, radius, text } = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="grid shrink-0 place-items-center bg-green-500 text-white shadow-sh1"
        style={{
          width: tile,
          height: tile,
          borderRadius: radius,
        }}
      >
        <Radar size={icon} strokeWidth={2.4} aria-hidden />
      </span>
      {withWordmark && (
        <span className={`font-display tracking-tight text-text ${text}`}>
          CROMIO
        </span>
      )}
    </span>
  );
}
