"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const params = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const hrefFor = (n: number) => {
    const next = new URLSearchParams(params.toString());
    if (n === 1) next.delete("page");
    else next.set("page", String(n));
    return `?${next.toString()}`;
  };

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between text-sm"
    >
      <Link
        href={hrefFor(prev)}
        aria-disabled={page === 1}
        className={`inline-flex items-center gap-1 rounded-md border border-line bg-white px-3 py-1.5 ${
          page === 1 ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronLeft size={14} /> Prev
      </Link>
      <span className="text-text-2">
        {page} / {totalPages}
      </span>
      <Link
        href={hrefFor(next)}
        aria-disabled={page === totalPages}
        className={`inline-flex items-center gap-1 rounded-md border border-line bg-white px-3 py-1.5 ${
          page === totalPages ? "pointer-events-none opacity-40" : ""
        }`}
      >
        Next <ChevronRight size={14} />
      </Link>
    </nav>
  );
}
