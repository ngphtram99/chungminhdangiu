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
    <div className="paper-card rounded-xl border-[3px] border-ink shadow-[5px_5px_0_0_#1A1A1A] px-4 sm:px-8 py-5 sm:py-7 mb-5 sm:mb-8 flex flex-col items-center gap-4 sm:gap-5 w-full relative">
      <button
        onClick={() => setModalOpen(true)}
        aria-label="Sửa hồ sơ hai người"
        className="absolute top-2.5 right-2.5 p-1.5 rounded-md hover:bg-charcoal/10 text-charcoal/60 hover:text-ink transition-colors"
      >
        <Pencil size={15} />
      </button>

      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <Avatar
          name={profile?.partner1_name || "Bạn"}
          url={profile?.partner1_avatar_url}
          ringClass="ring-coral"
        />
        <Heart size={22} className="fill-coral text-coral shrink-0 sm:hidden" />
        <Heart
          size={30}
          className="fill-coral text-coral shrink-0 hidden sm:block"
        />
        <Avatar
          name={profile?.partner2_name || "Người yêu"}
          url={profile?.partner2_avatar_url}
          ringClass="ring-ink"
        />
      </div>

      <div className="flex flex-col items-center border-t-[3px] border-ink/10 pt-3 sm:pt-4 w-full">
        {days !== null ? (
          <>
            <span className="font-display text-2xl sm:text-4xl font-semibold text-ink leading-none">
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
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] overflow-hidden bg-lilac flex items-center justify-center shrink-0">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-3xl sm:text-5xl text-ink">
            {initial}
          </span>
        )}
      </div>
      <span className="text-xs sm:text-sm font-semibold text-charcoal/85 max-w-[100px] truncate">
        {name}
      </span>
    </div>
  );
}
