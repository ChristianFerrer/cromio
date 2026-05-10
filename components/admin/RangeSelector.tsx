"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const OPTIONS = ["24h", "7d", "30d", "90d", "all"] as const;
type Range = (typeof OPTIONS)[number];

export function RangeSelector({ active }: { active: Range }) {
  const params = useSearchParams();
  const t = useTranslations("admin.range");

  const hrefFor = (r: Range) => {
    const next = new URLSearchParams(params.toString());
    if (r === "7d") next.delete("range");
    else next.set("range", r);
    return `?${next.toString()}`;
  };

  return (
    <div
      role="tablist"
      aria-label={t("label")}
      className="sticky top-[68px] z-10 -mx-4 flex gap-1 overflow-x-auto bg-bone/95 px-4 pb-3 pt-1 backdrop-blur md:top-0 md:mx-0 md:px-0"
    >
      {OPTIONS.map((r) => {
        const isActive = r === active;
        return (
          <Link
            key={r}
            href={hrefFor(r)}
            role="tab"
            aria-selected={isActive}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
              isActive
                ? "bg-green-700 text-white"
                : "border border-line bg-white text-text-2"
            }`}
          >
            {t(r)}
          </Link>
        );
      })}
    </div>
  );
}
