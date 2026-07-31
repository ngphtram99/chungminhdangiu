"use client";

import { useEffect, useState } from "react";
import { Place, PlaceStatus, STATUS_LABEL } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { X, Trash2, Upload } from "lucide-react";

export type PlaceFormValues = {
  name: string;
  address: string;
  maps_link: string;
  status: PlaceStatus;
  visited_date: string;
  rating: number;
  notes: string;
  photo_links: string[];
  added_by: string;
};

const EMPTY: PlaceFormValues = {
  name: "",
  address: "",
  maps_link: "",
  status: "want_to_go",
  visited_date: "",
  rating: 0,
  notes: "",
  photo_links: [],
  added_by: "",
};

export default function AddEditPlaceModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Place | null;
  onClose: () => void;
  onSave: (values: PlaceFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<PlaceFormValues>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setValues({
        name: initial.name,
        address: initial.address,
        maps_link: initial.maps_link || "",
        status: initial.status,
        visited_date: initial.visited_date || "",
        rating: initial.rating || 0,
        notes: initial.notes || "",
        photo_links: initial.photo_links || [],
        added_by: initial.added_by || "",
      });
    } else {
      setValues(EMPTY);
    }
  }, [initial]);

  async function handleUploadPhotos(files: FileList) {
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from("place-photos")
          .upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("place-photos").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setValues((v) => ({ ...v, photo_links: [...v.photo_links, ...uploaded] }));
    } catch (err) {
      setUploadError(
        "Upload ảnh thất bại. Kiểm tra đã tạo bucket 'place-photos' trong Supabase Storage chưa (xem README.md)."
      );
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  const removePhoto = (idx: number) => {
    setValues((v) => ({
      ...v,
      photo_links: v.photo_links.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim() || !values.address.trim()) return;
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-dark/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="paper-card text-charcoal w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/10 sticky top-0 paper-card">
          <h2 className="font-display text-xl font-semibold">
            {initial ? "Sửa địa điểm" : "Thêm địa điểm mới"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full hover:bg-charcoal/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <Field label="Tên địa điểm" required>
            <input
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="Vd: Cafe Đắng, quận 1"
              className="input"
              required
            />
          </Field>

          <Field label="Địa chỉ" required>
            <input
              value={values.address}
              onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
              placeholder="Vd: 12 Lý Tự Trọng, Quận 1, TP.HCM"
              className="input"
              required
            />
          </Field>

          <Field label="Link Google Maps (không bắt buộc)">
            <input
              value={values.maps_link}
              onChange={(e) => setValues((v) => ({ ...v, maps_link: e.target.value }))}
              placeholder="https://maps.app.goo.gl/..."
              className="input"
            />
          </Field>

          <Field label="Trạng thái">
            <div className="flex gap-2">
              {(Object.keys(STATUS_LABEL) as PlaceStatus[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setValues((v) => ({ ...v, status: s }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    values.status === s
                      ? "bg-ink text-paper border-ink"
                      : "bg-transparent border-charcoal/20 text-charcoal/70 hover:border-ink"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </Field>

          {values.status === "visited" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ngày đã đi">
                <input
                  type="date"
                  value={values.visited_date}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, visited_date: e.target.value }))
                  }
                  className="input"
                />
              </Field>
              <Field label="Đánh giá">
                <select
                  value={values.rating}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, rating: Number(e.target.value) }))
                  }
                  className="input"
                >
                  <option value={0}>Chưa chấm</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <Field label="Ghi chú">
            <textarea
              value={values.notes}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
              placeholder="Món ngon, kỷ niệm, lưu ý..."
              rows={3}
              className="input resize-none"
            />
          </Field>

          <Field label="Ảnh mô tả quán">
            <label
              htmlFor="place-photo-upload"
              className="flex items-center justify-center gap-2 border border-dashed border-charcoal/25 rounded-lg py-3 text-sm text-charcoal/60 cursor-pointer hover:border-ink hover:text-ink transition-colors"
            >
              <Upload size={15} />
              {uploading ? "Đang tải ảnh lên..." : "Chọn ảnh từ máy (chọn được nhiều ảnh)"}
              <input
                id="place-photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUploadPhotos(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            {uploadError && (
              <p className="text-xs text-coral-dark mt-1">{uploadError}</p>
            )}
            {values.photo_links.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {values.photo_links.map((link, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={link} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label="Xoá ảnh"
                      className="absolute inset-0 bg-ink/0 group-hover:bg-ink/50 flex items-center justify-center transition-colors"
                    >
                      <Trash2
                        size={16}
                        className="text-paper opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <Field label="Người thêm (không bắt buộc)">
            <input
              value={values.added_by}
              onChange={(e) => setValues((v) => ({ ...v, added_by: e.target.value }))}
              placeholder="Vd: An hoặc Bình"
              className="input"
            />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full py-3 rounded-lg bg-coral hover:bg-coral-dark text-paper font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : initial ? "Lưu thay đổi" : "Thêm địa điểm"}
          </button>
        </form>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(35, 40, 31, 0.2);
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-charcoal/90">
      <span>
        {label} {required && <span className="text-coral">*</span>}
      </span>
      {children}
    </label>
  );
}
