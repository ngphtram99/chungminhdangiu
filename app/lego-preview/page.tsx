"use client";

import { t, locale } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CoupleProfile } from "@/lib/types";
import { Heart } from "lucide-react";

function daysTogether(anniversary: string): number {
  const start = new Date(anniversary + "T00:00:00");
  const today = new Date();
  const diff = today.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function LegoPreviewPage() {
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
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setProfile(data as CoupleProfile);
    setLoading(false);
  }

  if (loading) return null;

  const days = profile?.anniversary_date ? daysTogether(profile.anniversary_date) : null;

  return (
    <main
      className="w-full min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: "#F0DEC5",
        backgroundImage:
          "radial-gradient(circle at 12px 12px, rgba(255,255,255,0.55) 0 5px, rgba(0,0,0,0.08) 5px 6px, transparent 6px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        <div
          className="lego-block lego-scallop-top w-full px-5 sm:px-8 pt-8 sm:pt-10 pb-7 sm:pb-9 flex flex-col items-center gap-5"
          style={{ ["--lego-fill" as string]: "#D6779A" }}
        >
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <LegoAvatar
              name={t(profile?.partner1_name || "Bạn")}
              url={profile?.partner1_avatar_url}
              fill="#1A1A1A"
            />
            <Heart size={28} className="fill-white text-white shrink-0" />
            <LegoAvatar
              name={t(profile?.partner2_name || "Người yêu")}
              url={profile?.partner2_avatar_url}
              fill="#E8D2AC"
            />
          </div>

          <div
            className="lego-block flex flex-col items-center px-5 py-3 w-full"
            style={{ ["--lego-fill" as string]: "#E8D2AC" }}
          >
            {days !== null ? (
              <>
                <span className="text-3xl sm:text-4xl font-black text-[#1A1A1A] leading-none">
                  {days.toLocaleString(locale())}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#1A1A1A]/70 tracking-wide mt-1 uppercase">
                  {t("ngày bên nhau")}
                </span>
              </>
            ) : (
              <span className="text-xs text-[#1A1A1A]/60">{t("Chưa có ngày kỷ niệm")}</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function LegoAvatar({
  name,
  url,
  fill,
}: {
  name: string;
  url: string | null | undefined;
  fill: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex flex-col items-center gap-1 mt-2">
      <div
        className="lego-block w-20 h-20 sm:w-28 sm:h-28 overflow-hidden flex items-center justify-center shrink-0"
        style={{ ["--lego-fill" as string]: fill }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl sm:text-3xl font-black text-white">{initial}</span>
        )}
      </div>
      <span className="text-xs sm:text-sm font-bold text-white max-w-[90px] truncate mt-1">
        {name}
      </span>
    </div>
  );
}
