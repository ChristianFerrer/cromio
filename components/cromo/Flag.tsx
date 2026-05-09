import type { Country } from "@/lib/types";

export function Flag({
  country,
  size = 24,
  rounded = true,
}: {
  country: Country | undefined;
  size?: number;
  rounded?: boolean;
}) {
  if (!country) return null;
  const { dir, colors, dot } = country.flag;
  const radius = rounded ? Math.round(size / 6) : 0;

  if (dir === "h") {
    return (
      <div
        style={{ width: size, height: size, borderRadius: radius }}
        className="overflow-hidden border border-black/10"
      >
        {colors.map((c, i) => (
          <div
            key={i}
            style={{ background: c, height: `${100 / colors.length}%` }}
          />
        ))}
        {dot && (
          <div
            className="absolute"
            style={{
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: "50%",
              background: dot,
              transform: `translate(${size * 0.35}px, -${size * 0.65}px)`,
            }}
          />
        )}
      </div>
    );
  }

  if (dir === "v") {
    return (
      <div
        style={{ width: size, height: size, borderRadius: radius }}
        className="flex overflow-hidden border border-black/10"
      >
        {colors.map((c, i) => (
          <div
            key={i}
            style={{ background: c, width: `${100 / colors.length}%`, height: "100%" }}
          />
        ))}
      </div>
    );
  }

  if (dir === "cross") {
    return (
      <div
        style={{ width: size, height: size, borderRadius: radius, background: colors[0] }}
        className="relative overflow-hidden border border-black/10"
      >
        <div className="absolute inset-y-0 left-1/2 w-[18%] -translate-x-1/2" style={{ background: colors[1] }} />
        <div className="absolute inset-x-0 top-1/2 h-[18%] -translate-y-1/2" style={{ background: colors[1] }} />
      </div>
    );
  }

  if (dir === "d") {
    return (
      <div
        style={{ width: size, height: size, borderRadius: radius, background: colors[0] }}
        className="relative overflow-hidden border border-black/10"
      >
        <div
          className="absolute"
          style={{
            width: size * 0.55,
            height: size * 0.55,
            background: colors[1] ?? colors[0],
            top: "22%",
            left: "22%",
            transform: "rotate(45deg)",
          }}
        />
        {colors[2] && (
          <div
            className="absolute"
            style={{
              width: size * 0.22,
              height: size * 0.22,
              background: colors[2],
              top: "39%",
              left: "39%",
              borderRadius: "50%",
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, borderRadius: radius, background: colors[0] }}
      className="relative overflow-hidden border border-black/10"
    >
      {colors[1] && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: size * 0.5,
            height: size * 0.5,
            background: colors[1],
          }}
        />
      )}
    </div>
  );
}
