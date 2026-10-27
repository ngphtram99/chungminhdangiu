"use client";

import { readCache, loadProfile } from "@/lib/cache";
import { t, locale } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { CoupleProfile } from "@/lib/types";
import { Pencil, Heart } from "lucide-react";
import EditCoupleModal from "./EditCoupleModal";

function daysTogether(anniversary: string): number {
  const start = new Date(anniversary + "T00:00:00");
  const today = new Date();
  const diff = today.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

type ProfileWithBg = CoupleProfile & { background_url?: string | null };

export default function CoupleHeader() {
  const [profile, setProfile] = useState<ProfileWithBg | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const cached = readCache<CoupleProfile>("profile");
    if (cached) {
      setProfile(cached);
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const data = await loadProfile();
    if (data) setProfile(data);
    setLoading(false);
  }

  if (loading) return null;

  const background = profile?.background_url || null;

  const days = profile?.anniversary_date
    ? daysTogether(profile.anniversary_date)
    : null;

  return (
    <div className="paper-card rounded-xl border-[3px] border-ink shadow-[5px_5px_0_0_#1A1A1A] px-4 sm:px-8 py-5 sm:py-7 mb-5 sm:mb-8 flex flex-col items-center gap-4 sm:gap-5 w-full relative isolate">
      {background && (
        <div
          className="absolute inset-0 -z-10 rounded-[inherit] overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={background}
            alt=""
            decoding="async"
            className="w-full h-full object-cover"
          />
          {/* lớp phủ để chữ vẫn dễ đọc */}
          <div className="absolute inset-0 bg-paper/75" />
        </div>
      )}
      <button
        onClick={() => setModalOpen(true)}
        aria-label={t("Sửa hồ sơ hai người")}
        className="absolute top-2.5 right-2.5 p-1.5 rounded-md hover:bg-charcoal/10 text-charcoal/60 hover:text-ink transition-colors"
      >
        <Pencil size={15} />
      </button>

      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <Avatar
          name={t(profile?.partner1_name || "Bạn")}
          url={profile?.partner1_avatar_url}
          ringClass="ring-coral"
        />
        <Heart size={22} className="fill-coral text-coral shrink-0 sm:hidden" />
        <Heart
          size={30}
          className="fill-coral text-coral shrink-0 hidden sm:block"
        />
        <Avatar
          name={t(profile?.partner2_name || "Người yêu")}
          url={profile?.partner2_avatar_url}
          ringClass="ring-ink"
        />
      </div>

      <div className="flex flex-col items-center border-t-[3px] border-ink/10 pt-3 sm:pt-4 w-full">
        {days !== null ? (
          <>
            <span className="font-display text-2xl sm:text-4xl font-semibold text-ink leading-none">
              {days.toLocaleString(locale())}
            </span>
            <span className="text-[10px] sm:text-xs text-charcoal/60 font-mono tracking-wide mt-1">
              {t("ngày bên nhau")}
            </span>
          </>
        ) : (
          <span className="text-xs text-charcoal/50 text-center">
            {t("Chưa có ngày kỷ niệm")}
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
