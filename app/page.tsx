"use client";

import Link from "next/link";
import {
  MapPinned,
  Heart,
  CalendarDays,
  Shuffle,
  Settings,
} from "lucide-react";
import CoupleHeader from "@/components/CoupleHeader";

const CATEGORIES = [
  { label: "Inlove", href: "/", icon: Heart, ready: true, current: true },
  { label: "Note lịch", href: "/calendar", icon: CalendarDays, ready: false },
  { label: "DS quán đã đi", href: "/places", icon: MapPinned, ready: true },
  { label: "Random quán", href: "/random", icon: Shuffle, ready: false },
  { label: "Cài đặt", href: "/settings", icon: Settings, ready: false },
];

export default function Home() {
  return (
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-8 pb-12 pt-16 sm:pt-24 flex flex-col items-center text-center">
      <div className="flex items-center gap-2 text-coral-dark font-mono text-xs tracking-widest uppercase mb-3">
        <MapPinned size={14} />
        <span>Chungminhdangiu</span>
      </div>
      <h1 className="font-display italic text-4xl sm:text-5xl font-semibold text-ink leading-tight mb-10">
        Những nơi tụi mình
        <br />
        đã và sẽ ghé qua
      </h1>

      <CoupleHeader />

      <div className="grid grid-cols-5 gap-1.5 sm:gap-3 w-full mt-8">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;

          const content = (
            <div
              className={`flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl py-3 sm:py-5 px-1 border transition-colors h-full ${
                cat.current
                  ? "bg-ink border-ink text-paper"
                  : cat.ready
                  ? "paper-card border-charcoal/10 hover:border-coral cursor-pointer text-charcoal"
                  : "bg-charcoal/5 border-charcoal/5 opacity-50 cursor-not-allowed text-charcoal"
              }`}
            >
              <Icon
                size={16}
                className={`sm:hidden ${
                  cat.current
                    ? "text-paper"
                    : cat.ready
                    ? "text-coral-dark"
                    : "text-charcoal/40"
                }`}
              />
              <Icon
                size={22}
                className={`hidden sm:block ${
                  cat.current
                    ? "text-paper"
                    : cat.ready
                    ? "text-coral-dark"
                    : "text-charcoal/40"
                }`}
              />
              <span className="text-[9px] sm:text-xs font-medium leading-tight">
                {cat.label}
              </span>
              {!cat.ready && !cat.current && (
                <span className="text-[7px] sm:text-[10px] font-mono text-charcoal/40 leading-none">
                  Sắp có
                </span>
              )}
            </div>
          );

          return cat.ready && !cat.current ? (
            <Link key={cat.label} href={cat.href}>
              {content}
            </Link>
          ) : (
            <div key={cat.label}>{content}</div>
          );
        })}
      </div>
    </main>
  );
}
