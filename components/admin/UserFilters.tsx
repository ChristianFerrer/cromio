"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";

type FilterKey = "plan" | "status" | "location" | "adminsOnly" | "sort" | "dir";

export function UserFilters({
  initialSearch,
}: {
  initialSearch: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("admin.users");
  const [search, setSearch] = useState(initialSearch);
  const [sheetOpen, setSheetOpen] = useState(false);

  const setParam = useCallback(
    (key: FilterKey | "search" | "page", value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      if (key !== "page") next.delete("page");
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("search", search.trim() || null);
  };

  const plan = params.get("plan") ?? "any";
  const status = params.get("status") ?? "any";
  const location = params.get("location") ?? "any";
  const adminsOnly = params.get("adminsOnly") === "1";
  const sort = params.get("sort") ?? "createdAt";
  const dir = params.get("dir") ?? "desc";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <form onSubmit={onSubmit} className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-2"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-green-700"
        />
      </form>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-text"
      >
        <SlidersHorizontal size={14} /> {t("filters")}
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg">{t("filters")}</h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setSheetOpen(false)}
                className="grid h-8 w-8 place-items-center rounded text-text-2"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <FilterGroup
                label={t("filter.plan")}
                value={plan}
                onChange={(v) => setParam("plan", v === "any" ? null : v)}
                options={[
                  { v: "any", l: t("filter.any") },
                  { v: "free", l: t("filter.free") },
                  { v: "pro", l: t("filter.pro") },
                ]}
              />
              <FilterGroup
                label={t("columns.status")}
                value={status}
                onChange={(v) => setParam("status", v === "any" ? null : v)}
                options={[
                  { v: "any", l: t("filter.any") },
                  { v: "active", l: t("filter.active") },
                  { v: "banned", l: t("filter.banned") },
                ]}
              />
              <FilterGroup
                label={t("filter.hasLocation")}
                value={location}
                onChange={(v) => setParam("location", v === "any" ? null : v)}
                options={[
                  { v: "any", l: t("filter.any") },
                  { v: "has", l: t("filter.hasLocation") },
                  { v: "missing", l: t("filter.noLocation") },
                ]}
              />
              <label className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2">
                <input
                  type="checkbox"
                  checked={adminsOnly}
                  onChange={(e) =>
                    setParam("adminsOnly", e.target.checked ? "1" : null)
                  }
                />
                {t("filter.admins")}
              </label>
              <FilterGroup
                label={t("sort.label")}
                value={sort}
                onChange={(v) => setParam("sort", v === "createdAt" ? null : v)}
                options={[
                  { v: "createdAt", l: t("sort.createdAt") },
                  { v: "lastActivity", l: t("sort.lastActivity") },
                  { v: "rating", l: t("sort.rating") },
                  { v: "tradesCount", l: t("sort.tradesCount") },
                ]}
              />
              <FilterGroup
                label="Dir"
                value={dir}
                onChange={(v) => setParam("dir", v === "desc" ? null : v)}
                options={[
                  { v: "desc", l: "↓" },
                  { v: "asc", l: "↑" },
                ]}
              />
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-5 h-10 w-full rounded-md bg-green-700 text-sm font-bold text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={`rounded-md border px-2.5 py-1 text-xs ${
              value === o.v
                ? "border-green-700 bg-green-50 font-bold text-green-700"
                : "border-line bg-white text-text-2"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
