"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { IconBtn } from "./IconBtn";

export function Sheet({
  title,
  onClose,
  children,
  maxHeight = "85vh",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
}) {
  // Lock body scroll while the sheet is open and close on Escape.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80] flex items-end justify-center"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
      />
      <div
        className="relative mx-auto w-full max-w-[430px] rounded-t-2xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-sh3 animate-slide-down md:max-w-[480px] md:rounded-2xl md:mb-8"
        style={{ maxHeight }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">{title}</h2>
          <IconBtn
            ariaLabel="Cerrar"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            <X size={14} strokeWidth={2.2} />
          </IconBtn>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 80px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
