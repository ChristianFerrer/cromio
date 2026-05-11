"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode, AnchorHTMLAttributes } from "react";

type Variant = "outline" | "solid" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  outline: "border border-line bg-white text-text hover:bg-paper",
  solid: "bg-green-500 text-white hover:bg-green-700",
  ghost: "bg-transparent text-text-2 hover:bg-paper",
};

const SIZES: Record<Size, string> = {
  // 44x44 minimum tap target per HIG; visual icon stays smaller via the
  // child SVG size.
  sm: "h-10 w-10",
  md: "h-11 w-11",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
};

export function IconBtn({
  variant = "outline",
  size = "md",
  ariaLabel,
  className = "",
  children,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      {...props}
      className={`grid shrink-0 place-items-center rounded-card transition-colors disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconLink({
  href,
  variant = "outline",
  size = "md",
  ariaLabel,
  className = "",
  children,
  ...props
}: CommonProps & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      {...props}
      className={`grid shrink-0 place-items-center rounded-card transition-colors ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
