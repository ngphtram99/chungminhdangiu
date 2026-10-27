"use client";

import { t } from "@/lib/i18n";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { CoupleProfile } from "@/lib/types";
import { X, Upload } from "lucide-react";

export default function EditCoupleModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: CoupleProfile | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [partner1Name, setPartner1Name] = useState(
    initial?.partner1_name || "Bạn"
  );
  const [partner2Name, setPartner2Name] = useState(
    initial?.partner2_name || "Người yêu"
  );
  const [partner1Avatar, setPartner1Avatar] = useState(
    initial?.partner1_avatar_url || ""
  );
  const [partner2Avatar, setPartner2Avatar] = useState(
    initial?.partner2_avatar_url || ""
  );
  const [anniversary, setAnniversary] = useState(
    initial?.anniversary_date || ""
  );
  const [background, setBackground] = useState(
    (initial as (CoupleProfile & { background_url?: string | null }) | null)?.background_url || ""
  );
  const [bgPreview, setBgPreview] = useState("");
  const [uploading, setUploading] = useState<"p1" | "p2" | "bg" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(
    file: File,
    which: "p1" | "p2"
  ) {
    setUploading(which);
    setError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${which}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      if (which === "p1") setPartner1Avatar(data.publicUrl);
      else setPartner2Avatar(data.publicUrl);
    } catch (err: any) {
      setError(
        t("Upload ảnh thất bại. Kiểm tra lại đã tạo bucket 'avatars' trong Supabase Storage chưa (xem README.md).")
      );
      console.error(err);
    } finally {
      setUploading(null);
    }
  }

  async function handleUploadBackground(file: File) {
    const preview = URL.createObjectURL(file);
    setBgPreview(preview);
    setUploading("bg");
    setError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `bg-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setBackground(data.publicUrl);
    } catch (err) {
      setError(t("Upload ảnh thất bại. Thử lại nhé."));
      console.error(err);
    } finally {
      setUploading(null);
      setBgPreview("");
      URL.revokeObjectURL(preview);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      partner1_name: partner1Name.trim() || "Bạn",
      partner2_name: partner2Name.trim() || "Người yêu",
      partner1_avatar_url: partner1Avatar || null,
      partner2_avatar_url: partner2Avatar || null,
      anniversary_date: anniversary || null,
      background_url: background || null,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = initial
      ? await supabase.from("couple_profile").update(payload).eq("id", initial.id)
      : await supabase.from("couple_profile").insert(payload);

    if (saveError) {
      setError(t("Lỗi khi lưu: ") + saveError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-dark/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="paper-card text-charcoal w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/10 sticky top-0 paper-card">
          <h2 className="font-display text-xl font-semibold">{t("Sửa hồ sơ hai người")}</h2>
          <button
            onClick={onClose}
            aria-label={t("Đóng")}
            className="p-1.5 rounded-full hover:bg-charcoal/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <AvatarField
            label={t("Ảnh của bạn")}
            name={partner1Name}
            onNameChange={setPartner1Name}
            avatarUrl={partner1Avatar}
            uploading={uploading === "p1"}
            onFile={(f) => handleUpload(f, "p1")}
          />

          <AvatarField
            label={t("Ảnh người yêu")}
            name={partner2Name}
            onNameChange={setPartner2Name}
            avatarUrl={partner2Avatar}
            uploading={uploading === "p2"}
            onFile={(f) => handleUpload(f, "p2")}
          />

          <BackgroundField
            url={background}
            preview={bgPreview}
            uploading={uploading === "bg"}
            onFile={handleUploadBackground}
            onClear={() => setBackground("")}
          />

          <label className="flex flex-col gap-1.5 text-sm font-medium text-charcoal/90">
            <span>{t("Ngày yêu nhau (để đếm số ngày bên nhau)")}</span>
            <input
              type="date"
              value={anniversary}
              onChange={(e) => setAnniversary(e.target.value)}
              className="input"
            />
          </label>

          {error && <p className="text-xs text-coral-dark">{error}</p>}

          <button
            type="submit"
            disabled={saving || uploading !== null}
            className="mt-1 w-full py-3 rounded-lg bg-ink hover:bg-ink-light text-paper font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? t("Đang lưu...") : t("Lưu hồ sơ")}
          </button>
        </form>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(43, 37, 48, 0.2);
          background: #ffffff;
          font-family: var(--font-inter);
          font-size: 0.9rem;
        }
        .input:focus {
          border-color: #c98fb0;
        }
      `}</style>
    </div>
  );
}

function AvatarField({
  label,
  name,
  onNameChange,
  avatarUrl,
  uploading,
  onFile,
}: {
  label: string;
  name: string;
  onNameChange: (v: string) => void;
  avatarUrl: string;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  const inputId = `avatar-${label.replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center gap-4">
      <label
        htmlFor={inputId}
        className="relative w-16 h-16 rounded-full bg-lilac overflow-hidden shrink-0 cursor-pointer flex items-center justify-center group"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Upload size={18} className="text-ink/50" />
        )}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-center justify-center">
          <Upload
            size={16}
            className="text-paper opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </label>
      <div className="flex-1 flex flex-col gap-1.5">
        <span className="text-xs font-medium text-charcoal/70">
          {label} {uploading && t("(đang tải lên...)")}
        </span>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t("Tên")}
          className="input"
        />
      </div>
    </div>
  );
}

function BackgroundField({
  url,
  preview,
  uploading,
  onFile,
  onClear,
}: {
  url: string;
  preview: string;
  uploading: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const shown = preview || url;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-charcoal/70">
        {t("Ảnh nền khung (không bắt buộc)")}
      </span>
      <label
        htmlFor="couple-background-upload"
        className="relative h-28 rounded-lg border border-dashed border-charcoal/25 overflow-hidden cursor-pointer flex items-center justify-center text-sm text-charcoal/60 hover:border-ink hover:text-ink transition-colors"
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt=""
            className={`w-full h-full object-cover ${uploading ? "opacity-50" : ""}`}
          />
        ) : (
          <span className="inline-flex items-center gap-2">
            <Upload size={15} />
            {t("Chọn ảnh nền")}
          </span>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-paper border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <input
          id="couple-background-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </label>
      {url && !uploading && (
        <button
          type="button"
          onClick={onClear}
          className="self-start inline-flex items-center gap-1.5 text-xs font-medium text-charcoal/70 hover:text-ink"
        >
          <X size={13} />
          {t("Xoá ảnh nền")}
        </button>
      )}
    </div>
  );
}
