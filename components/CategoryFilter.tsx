"use client";

import { CATEGORY_PRESETS } from "@/lib/types";

export type CategoryFilterValue = "all" | "other" | (typeof CATEGORY_PRESETS)[number];

const CATEGORY_CHIPS: { value: CategoryFilterValue; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "Ăn uống", label: "🍜 Ăn uống" },
  { value: "Cà phê", label: "☕ Cà phê" },
  { value: "Giải trí", label: "🎈 Giải trí" },
  { value: "other", label: "Khác" },
];

export function matchesCategory(
  placeCategory: string | null,
  filter: CategoryFilterValue
): boolean {
  if (filter === "all") return true;
  if (filter === "other") {
    return !!placeCategory && !CATEGORY_PRESETS.includes(placeCategory);
  }
  return placeCategory === filter;
}

export default function CategoryFilter({
  active,
  onChange,
}: {
  active: CategoryFilterValue;
  onChange: (v: CategoryFilterValue) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {CATEGORY_CHIPS.map((chip) => {
        const isActive = active === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onChange(chip.value)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border-2 transition-colors ${
              isActive
                ? "bg-ink text-paper border-ink"
                : "paper-card text-charcoal/70 border-ink/20 hover:border-ink"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
