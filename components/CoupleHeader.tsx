"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CoupleProfile } from "@/lib/types";
import { Pencil, Heart } from "lucide-react";
import EditCoupleModal from "./EditCoupleModal";

function daysTogether(anniversary: string): number {
  const start = new Date(anniversary + "T00:00:00");
  const today = new Date();
  const diff = today.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export default function CoupleHeader() {
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    const { data, error } = await supabase
      .from("couple_profile")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as CoupleProfile);
    }
    setLoading(false);
  }

  if (loading) return null;

  const days = profile?.anniversary_date
    ? daysTogether(profile.anniversary_date)
    : null;

  return (
    <div className="paper-card rounded-2xl px-4 sm:px-6 py-3 sm:py-5 mb-4 sm:mb-8 flex flex-col sm:flex-row items-center sm:items-stretch gap-3 sm:gap-6 w-full">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-center sm:justify-start">
        <Avatar
          name={profile?.partner1_name || "Bạn"}
          url={profile?.partner1_avatar_url}
          ringClass="ring-coral"
        />
        <Heart size={16} className="fill-coral text-coral shrink-0 sm:hidden" />
        <Heart
          size={20}
          className="fill-coral text-coral shrink-0 hidden sm:block"
        />
        <Avatar
          name={profile?.partner2_name || "Người yêu"}
          url={profile?.partner2_avatar_url}
          ringClass="ring-ink"
        />
      </div>

      <div className="flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-charcoal/10 pt-2 sm:pt-0 sm:pl-6 min-w-[140px] sm:min-w-[160px]">
        {days !== null ? (
          <>
            <span className="font-display text-xl sm:text-3xl font-semibold text-ink leading-none">
              {days.toLocaleString("vi-VN")}
            </span>
            <span className="text-[10px] sm:text-xs text-charcoal/60 font-mono tracking-wide mt-1">
              ngày bên nhau
            </span>
          </>
        ) : (
          <span className="text-xs text-charcoal/50 text-center">
            Chưa có ngày kỷ niệm
          </span>
        )}
      </div>

      <button
        onClick={() => setModalOpen(true)}
        aria-label="Sửa hồ sơ hai người"
        className="self-center sm:self-start p-1.5 sm:p-2 rounded-full hover:bg-charcoal/10 text-charcoal/60 hover:text-ink transition-colors"
      >
        <Pencil size={14} className="sm:hidden" />
        <Pencil size={16} className="hidden sm:block" />
      </button>

      {modalOpen && (
        <EditCoupleModal
          initial={profile}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchProfile();
          }}
        />
      )}
    </div>
  );
}

function Avatar({
  name,
  url,
  ringClass,
}: {
  name: string;
  url: string | null | undefined;
  ringClass: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
      <div
        className={`w-10 h-10 sm:w-16 sm:h-16 rounded-full ring-2 ring-offset-2 ring-offset-paper ${ringClass} overflow-hidden bg-lilac flex items-center justify-center shrink-0`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-base sm:text-xl text-ink">
            {initial}
          </span>
        )}
      </div>
      <span className="text-[10px] sm:text-xs font-medium text-charcoal/80 max-w-[80px] truncate">
        {name}
      </span>
    </div>
  );
}
