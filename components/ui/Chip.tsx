"use client";

import type { ButtonHTMLAttributes } from "react";

export function Chip({
  active,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-ink text-white"
          : "border border-line bg-white text-text"
      } ${className}`}
    >
      {children}
    </button>
  );
}
