import { PlaceStatus, STATUS_LABEL } from "@/lib/types";

type TabValue = PlaceStatus | "all";

const TABS: { value: TabValue; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "visited", label: STATUS_LABEL.visited },
  { value: "want_to_go", label: STATUS_LABEL.want_to_go },
  { value: "not_yet", label: STATUS_LABEL.not_yet },
];

export default function StatusTabs({
  active,
  onChange,
  counts,
}: {
  active: TabValue;
  onChange: (v: TabValue) => void;
  counts: Record<TabValue, number>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`shrink-0 px-4 py-2 rounded-full font-body text-sm font-medium border transition-colors ${
              isActive
                ? "bg-ink text-paper border-ink"
                : "bg-paper/50 text-charcoal/70 border-charcoal/15 hover:border-ink hover:text-ink"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 font-mono text-xs opacity-70">
              {counts[tab.value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
