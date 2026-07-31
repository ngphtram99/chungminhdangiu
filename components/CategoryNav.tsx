"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPinned,
  Heart,
  CalendarDays,
  Shuffle,
  Settings,
} from "lucide-react";

const CATEGORIES = [
  { label: "Inlove", href: "/", icon: Heart, ready: true },
  { label: "Note lịch", href: "/calendar", icon: CalendarDays, ready: true },
  { label: "DS quán đã đi", href: "/places", icon: MapPinned, ready: true },
  { label: "Random quán", href: "/random", icon: Shuffle, ready: true },
  { label: "Cài đặt", href: "/settings", icon: Settings, ready: false },
];

export default function CategoryNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 paper-card border-t border-charcoal/10 nav-safe-bottom">
      <div className="max-w-3xl mx-auto grid grid-cols-5 gap-1.5 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isCurrent = pathname === cat.href;

          const content = (
            <div
              className={`flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl py-2 sm:py-3 px-1 border transition-colors h-full ${
                isCurrent
                  ? "bg-ink border-ink text-paper"
                  : cat.ready
                  ? "border-transparent hover:bg-charcoal/5 cursor-pointer text-charcoal"
                  : "border-transparent opacity-40 cursor-not-allowed text-charcoal"
              }`}
            >
              <Icon
                size={16}
                className={`sm:hidden ${
                  isCurrent
                    ? "text-paper"
                    : cat.ready
                    ? "text-coral-dark"
                    : "text-charcoal/40"
                }`}
              />
              <Icon
                size={20}
                className={`hidden sm:block ${
                  isCurrent
                    ? "text-paper"
                    : cat.ready
                    ? "text-coral-dark"
                    : "text-charcoal/40"
                }`}
              />
              <span className="text-[9px] sm:text-xs font-medium leading-tight text-center">
                {cat.label}
              </span>
              {!cat.ready && (
                <span className="text-[7px] sm:text-[10px] font-mono text-charcoal/40 leading-none">
                  Sắp có
                </span>
              )}
            </div>
          );

          return cat.ready ? (
            <Link key={cat.label} href={cat.href}>
              {content}
            </Link>
          ) : (
            <div key={cat.label}>{content}</div>
          );
        })}
      </div>
    </nav>
  );
}
