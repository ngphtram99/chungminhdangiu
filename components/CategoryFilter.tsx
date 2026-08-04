"use client";

import { Place, CATEGORY_PRESETS } from "@/lib/types";

export type CategoryFilterValue = string; // "all" hoặc đúng tên phân loại

export function matchesCategory(
  placeCategory: string | null,
  filter: CategoryFilterValue
): boolean {
  if (filter === "all") return true;
  return placeCategory === filter;
}

export function getExtraCategories(places: Place[]): string[] {
  const set = new Set<string>();
  places.forEach((p) => {
    if (p.category && !CATEGORY_PRESETS.includes(p.category)) {
      set.add(p.category);
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
}

const PRESET_ICON: Record<string, string> = {
  "Ăn uống": "🍜",
  "Cà phê": "☕",
  "Giải trí": "🎈",
};

export default function CategoryFilter({
  active,
  onChange,
  extraCategories = [],
  places,
}: {
  active: CategoryFilterValue;
  onChange: (v: CategoryFilterValue) => void;
  extraCategories?: string[];
  places: Place[];
}) {
  const chips: { value: CategoryFilterValue; label: string }[] = [
    { value: "all", label: "Tất cả" },
    ...CATEGORY_PRESETS.map((c) => ({ value: c, label: `${PRESET_ICON[c] || ""} ${c}` })),
    ...extraCategories.map((c) => ({ value: c, label: `📍 ${c}` })),
  ];

  function countFor(value: CategoryFilterValue): number {
    if (value === "all") return places.length;
    return places.filter((p) => p.category === value).length;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {chips.map((chip) => {
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
            <span className="ml-1 font-mono text-[10px] sm:text-xs opacity-70">
              ({countFor(chip.value)})
            </span>
          </button>
        );
      })}
    </div>
  );
}
