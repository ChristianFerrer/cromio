"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Kind = "primary" | "primaryVibrant" | "ghost" | "pro";

const STYLES: Record<Kind, string> = {
  primary: "bg-green-700 text-white hover:bg-green-900",
  primaryVibrant: "bg-green-500 text-white hover:bg-green-700 shadow-sh2",
  ghost: "border border-line bg-white text-text hover:bg-paper",
  pro: "bg-gradient-to-br from-gold-light via-gold to-gold-dark text-ink shadow-gold",
};

export function Btn({
  kind = "primary",
  size = "md",
  full = false,
  icon,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: Kind;
  size?: "sm" | "md" | "lg";
  full?: boolean;
  icon?: ReactNode;
}) {
  const sz =
    size === "sm"
      ? "h-9 px-4 text-sm rounded-lg"
      : size === "lg"
        ? "h-14 px-6 text-base rounded-xl"
        : "h-11 px-5 text-sm rounded-lg";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-colors disabled:opacity-50 ${sz} ${STYLES[kind]} ${full ? "w-full" : ""} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
