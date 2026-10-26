"use client";

import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CoupleProfile } from "@/lib/types";

function breakdownDuration(anniversary: string) {
  const start = new Date(anniversary + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  let days = today.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    ).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const weeks = Math.floor(days / 7);
  const remainderDays = days % 7;

  return { years, months, weeks, days: remainderDays };
}

export default function LoveDuration() {
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    const { data } = await supabase
      .from("couple_profile")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) setProfile(data as CoupleProfile);
    setLoading(false);
  }

  if (loading) return null;
  if (!profile?.anniversary_date) return null;

  const { years, months, weeks, days } = breakdownDuration(
    profile.anniversary_date
  );

  const units = [
    { value: years, label: t("Năm") },
    { value: months, label: t("Tháng") },
    { value: weeks, label: t("Tuần") },
    { value: days, label: t("Ngày") },
  ];

  return (
    <div className="paper-card rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] px-4 sm:px-8 py-5 sm:py-6 mt-6 sm:mt-8 w-full">
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {units.map((u) => (
          <div
            key={u.label}
            className="flex flex-col items-center justify-center"
          >
            <span className="font-display text-xl sm:text-3xl font-semibold text-ink leading-none">
              {u.value}
            </span>
            <span className="text-[10px] sm:text-xs text-charcoal/60 font-mono tracking-wide mt-1.5">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
