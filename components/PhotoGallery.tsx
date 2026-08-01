"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CouplePhoto, CoupleProfile } from "@/lib/types";
import { Camera, Trash2, Loader2, ImageOff } from "lucide-react";

const UPLOADER_KEY = "couple-photos-uploader";

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<CouplePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [me, setMe] = useState<string>("");
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
    fetchPhotos();

    const saved = localStorage.getItem(UPLOADER_KEY);
    if (saved) setMe(saved);

    const channel = supabase
      .channel("couple_photos_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "couple_photos" },
        (payload) => {
          setPhotos((prev) => [payload.new as CouplePhoto, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "couple_photos" },
        (payload) => {
          setPhotos((prev) =>
            prev.filter((p) => p.id !== (payload.old as CouplePhoto).id)
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "couple_profile" },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchProfile() {
    const { data } = await supabase
      .from("couple_profile")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) setProfile(data as CoupleProfile);
  }

  async function fetchPhotos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("couple_photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setPhotos(data as CouplePhoto[]);
    setLoading(false);
  }

  function confirmIdentity(name: string) {
    setMe(name);
    localStorage.setItem(UPLOADER_KEY, name);
    setShowIdentityModal(false);
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  function handleUploadClick() {
    if (!me) {
      setShowIdentityModal(true);
      return;
    }
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !me) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("couple-photos")
      .upload(path, file);

    if (uploadError) {
      alert("Lỗi khi upload ảnh: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("couple-photos")
      .getPublicUrl(path);

    const { error: insertError } = await supabase.from("couple_photos").insert({
      image_url: publicUrlData.publicUrl,
      storage_path: path,
      uploaded_by: me,
    });

    if (insertError) {
      alert("Lỗi khi lưu ảnh: " + insertError.message);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(photo: CouplePhoto) {
    if (!confirm("Xoá ảnh này?")) return;
    await supabase.storage.from("couple-photos").remove([photo.storage_path]);
    const { error } = await supabase
      .from("couple_photos")
      .delete()
      .eq("id", photo.id);
    if (error) {
      alert("Lỗi khi xoá: " + error.message);
    }
  }

  const partner1 = profile?.partner1_name || "Bạn";
  const partner2 = profile?.partner2_name || "em bò";

  const latestFor = (name: string) =>
    photos.find((p) => p.uploaded_by === name) || null;

  const cards = [
    { name: partner1, ringClass: "ring-coral" },
    { name: partner2, ringClass: "ring-ink" },
  ];

  return (
    <div className="w-full mt-10 text-left">
      <div className="flex items-center justify-between mb-2.5 sm:mb-4">
        <h2 className="font-display italic text-lg sm:text-2xl text-ink">
          Realtime
        </h2>
        <button
          onClick={handleUploadClick}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 bg-coral hover:bg-coral-dark text-paper text-[11px] sm:text-sm font-semibold px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg border-2 border-ink shadow-[3px_3px_0_0_#1A1A1A] transition-colors shrink-0 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Camera size={15} />
          )}
          {uploading ? "Đang tải..." : "Đăng ảnh"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {loading ? (
        <p className="text-charcoal/60 font-mono text-sm">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {cards.map((card) => {
            const photo = latestFor(card.name);
            return (
              <div
                key={card.name}
                className="paper-card rounded-lg border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] overflow-hidden flex flex-col"
              >
                <div className="px-2.5 sm:px-3 pt-2 sm:pt-3 pb-1.5 sm:pb-2 flex items-center justify-between">
                  <span className="text-[11px] sm:text-sm font-semibold text-ink truncate">
                    {card.name}
                  </span>
                  {photo && (
                    <button
                      onClick={() => handleDelete(photo)}
                      className="text-charcoal/40 hover:text-coral-dark transition-colors shrink-0"
                      aria-label="Xoá ảnh"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {photo ? (
                  <>
                    <div className="h-24 sm:h-40 w-full bg-charcoal/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.image_url}
                        alt={`Ảnh mới nhất của ${card.name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="px-2.5 sm:px-3 py-1.5 sm:py-2.5">
                      {photo.caption && (
                        <p className="text-[10px] sm:text-sm text-charcoal/80 mb-0.5 sm:mb-1 line-clamp-1 sm:line-clamp-2">
                          {photo.caption}
                        </p>
                      )}
                      <p className="text-[9px] sm:text-xs text-charcoal/45 font-mono">
                        {timeAgo(photo.created_at)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-24 sm:h-40 w-full flex flex-col items-center justify-center gap-1.5 text-charcoal/35">
                    <ImageOff size={18} />
                    <span className="text-[9px] sm:text-xs text-center px-2">
                      Chưa có cập nhật
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showIdentityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-ink/40">
          <div className="paper-card rounded-2xl p-6 w-full max-w-xs text-center">
            <p className="font-display italic text-lg text-ink mb-1">
              Bạn là ai vậy?
            </p>
            <p className="text-xs text-charcoal/60 mb-5">
              Chỉ hỏi 1 lần trên thiết bị này thôi nhé.
            </p>
            <div className="flex flex-col gap-2.5">
              {[partner1, partner2].map((name) => (
                <button
                  key={name}
                  onClick={() => confirmIdentity(name)}
                  className="w-full bg-ink hover:bg-charcoal text-paper font-semibold py-2.5 rounded-full transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowIdentityModal(false)}
              className="mt-4 text-xs text-charcoal/50 hover:text-ink transition-colors"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
