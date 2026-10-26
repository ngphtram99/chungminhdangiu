"use client";

import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Place, PlaceStatus, STATUS_LABEL, CATEGORY_PRESETS } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { HCMC_DISTRICTS } from "@/lib/geo";
import { X, Trash2, Upload, Navigation, Download } from "lucide-react";

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
  district: string;
  lat: number | null;
  lng: number | null;
  category: string;
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
  district: "",
  lat: null,
  lng: null,
  category: "",
};

export default function AddEditPlaceModal({
  initial,
  onClose,
  onSave,
  lockedStatus,
}: {
  initial: Place | null;
  onClose: () => void;
  onSave: (values: PlaceFormValues) => Promise<void>;
  lockedStatus?: PlaceStatus;
}) {
  const [values, setValues] = useState<PlaceFormValues>(EMPTY);
  const [pending, setPending] = useState<{ id: string; preview: string }[]>([]);
  const uploading = pending.length > 0;
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCustomDistrict, setIsCustomDistrict] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      const initialDistrict = initial.district || "";
      const isKnownDistrict = HCMC_DISTRICTS.includes(initialDistrict);
      setIsCustomDistrict(!!initialDistrict && !isKnownDistrict);

      const initialCategory = initial.category || "";
      const isKnownCategory = CATEGORY_PRESETS.includes(initialCategory);
      setIsCustomCategory(!!initialCategory && !isKnownCategory);

      setValues({
        name: initial.name,
        address: initial.address,
        maps_link: initial.maps_link || "",
        status: lockedStatus || initial.status,
        visited_date: initial.visited_date || "",
        rating: initial.rating || 0,
        notes: initial.notes || "",
        photo_links: initial.photo_links || [],
        added_by: initial.added_by || "",
        district: initialDistrict,
        lat: initial.lat ?? null,
        lng: initial.lng ?? null,
        category: initialCategory,
      });
    } else {
      setIsCustomDistrict(false);
      setIsCustomCategory(false);
      setValues({ ...EMPTY, status: lockedStatus || EMPTY.status });
    }
  }, [initial, lockedStatus]);

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocationError(t("Trình duyệt không hỗ trợ định vị."));
      return;
    }
    setGettingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValues((v) => ({
          ...v,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setGettingLocation(false);
      },
      () => {
        setLocationError(
          t("Không lấy được vị trí. Kiểm tra đã cho phép quyền định vị chưa.")
        );
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleUploadPhotos(files: FileList) {
    setUploadError(null);

    await Promise.all(
      Array.from(files).map(async (file) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const preview = URL.createObjectURL(file);
        setPending((p) => [...p, { id, preview }]);

        try {
          const ext = file.name.split(".").pop();
          const path = `${id}.${ext}`;
          const { error } = await supabase.storage
            .from("place-photos")
            .upload(path, file, { cacheControl: "31536000" });
          if (error) throw error;

          const { data } = supabase.storage.from("place-photos").getPublicUrl(path);
          setValues((v) => ({
            ...v,
            photo_links: [...v.photo_links, data.publicUrl],
          }));
        } catch (err) {
          setUploadError(t("Upload ảnh thất bại. Thử lại nhé."));
          console.error(err);
        } finally {
          setPending((p) => p.filter((x) => x.id !== id));
          URL.revokeObjectURL(preview);
        }
      })
    );
  }

  const removePhoto = (idx: number) => {
    setValues((v) => ({
      ...v,
      photo_links: v.photo_links.filter((_, i) => i !== idx),
    }));
  };

  function toggleSelectPhoto(idx: number) {
    setSelectedPhotos((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  function removeSelectedPhotos() {
    setValues((v) => ({
      ...v,
      photo_links: v.photo_links.filter((_, i) => !selectedPhotos.includes(i)),
    }));
    setSelectedPhotos([]);
  }

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
            {initial ? t("Sửa địa điểm") : t("Thêm địa điểm mới")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("Đóng")}
            className="p-1.5 rounded-full hover:bg-charcoal/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <Field label={t("Tên địa điểm")} required>
            <input
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder={t("Vd: Cafe Đắng, quận 1")}
              className="input"
              required
            />
          </Field>

          <Field label={t("Địa chỉ")} required>
            <input
              value={values.address}
              onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
              placeholder={t("Vd: 12 Lý Tự Trọng, Quận 1, TP.HCM")}
              className="input"
              required
            />
          </Field>

          <Field label={t("Quận / Tỉnh / Quốc gia")}>
            <select
              value={isCustomDistrict ? "__custom__" : values.district}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setIsCustomDistrict(true);
                  setValues((v) => ({ ...v, district: "" }));
                } else {
                  setIsCustomDistrict(false);
                  setValues((v) => ({ ...v, district: e.target.value }));
                }
              }}
              className="input"
            >
              <option value="">{t("-- Chọn quận --")}</option>
              {HCMC_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value="__custom__">{t("Khác (tự nhập)")}</option>
            </select>
            {isCustomDistrict && (
              <input
                value={values.district}
                onChange={(e) => setValues((v) => ({ ...v, district: e.target.value }))}
                placeholder={t("Vd: Đà Lạt, Nha Trang, Nhật Bản...")}
                className="input mt-2"
                autoFocus
              />
            )}
          </Field>

          <Field label={t("Link Google Maps (không bắt buộc)")}>
            <input
              value={values.maps_link}
              onChange={(e) => setValues((v) => ({ ...v, maps_link: e.target.value }))}
              placeholder="https://maps.app.goo.gl/..."
              className="input"
            />
          </Field>

          <Field label={t("Vị trí (không bắt buộc)")}>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={gettingLocation}
              className="flex items-center justify-center gap-2 border border-dashed border-charcoal/25 rounded-lg py-2.5 text-sm text-charcoal/60 hover:border-ink hover:text-ink transition-colors disabled:opacity-60"
            >
              <Navigation size={15} />
              {gettingLocation
                ? t("Đang lấy vị trí...")
                : values.lat != null
                ? t("Đã lưu vị trí hiện tại ✓")
                : t("Lấy vị trí hiện tại (khi đang đứng ở địa điểm)")}
            </button>
            {locationError && (
              <p className="text-xs text-coral-dark mt-1">{locationError}</p>
            )}
          </Field>

          {!lockedStatus && (
            <Field label={t("Trạng thái")}>
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
                    {t(STATUS_LABEL[s])}
                  </button>
                ))}
              </div>
            </Field>
          )}

          <Field label={t("Phân loại")}>
            <select
              value={isCustomCategory ? "__custom__" : values.category}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setIsCustomCategory(true);
                  setValues((v) => ({ ...v, category: "" }));
                } else {
                  setIsCustomCategory(false);
                  setValues((v) => ({ ...v, category: e.target.value }));
                }
              }}
              className="input"
            >
              <option value="">{t("-- Chọn phân loại --")}</option>
              <option value="Ăn uống">🍜 {t("Ăn uống")}</option>
              <option value="Cà phê">☕ {t("Cà phê")}</option>
              <option value="Giải trí">🎈 {t("Giải trí")}</option>
              <option value="Nhà thờ">⛪ {t("Nhà thờ")}</option>
              <option value="__custom__">{t("Khác (tự nhập)")}</option>
            </select>
            {isCustomCategory && (
              <input
                value={values.category}
                onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
                placeholder={t("Vd: Xem phim, Dạo phố, Mua sắm...")}
                className="input mt-2"
                autoFocus
              />
            )}
          </Field>

          {values.status === "visited" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("Ngày đã đi")}>
                <input
                  type="date"
                  value={values.visited_date}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, visited_date: e.target.value }))
                  }
                  className="input"
                />
              </Field>
              <Field label={t("Đánh giá")}>
                <select
                  value={values.rating}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, rating: Number(e.target.value) }))
                  }
                  className="input"
                >
                  <option value={0}>{t("Chưa chấm")}</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <Field label={t("Ghi chú")}>
            <textarea
              value={values.notes}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
              placeholder={t("Món ngon, kỷ niệm, lưu ý...")}
              rows={3}
              className="input resize-none"
            />
          </Field>

          <Field label={t("Ảnh mô tả địa điểm")}>
            <label
              htmlFor="place-photo-upload"
              className="flex items-center justify-center gap-2 border border-dashed border-charcoal/25 rounded-lg py-3 text-sm text-charcoal/60 cursor-pointer hover:border-ink hover:text-ink transition-colors"
            >
              <Upload size={15} />
              {t("Chọn ảnh từ máy (chọn được nhiều ảnh)")}
              <input
                id="place-photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
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
            {(values.photo_links.length > 0 || pending.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {values.photo_links.map((link, i) => {
                  const isSel = selectedPhotos.includes(i);
                  return (
                    <div
                      key={link}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        isSel ? "border-coral" : "border-transparent"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setLightboxPhoto(link)}
                        className="w-full h-full block"
                        aria-label={t("Phóng to ảnh")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={link} alt="" className="w-full h-full object-cover" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSelectPhoto(i)}
                        aria-label={isSel ? t("Bỏ chọn ảnh") : t("Chọn ảnh")}
                        className={`absolute top-1 right-1 w-5 h-5 rounded-full border-2 border-paper flex items-center justify-center text-[10px] leading-none text-paper ${
                          isSel ? "bg-coral" : "bg-ink/50"
                        }`}
                      >
                        {isSel ? "✓" : ""}
                      </button>
                    </div>
                  );
                })}
                {pending.map((p) => (
                  <div key={p.id} className="relative w-16 h-16 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.preview} alt="" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                ))}
                {selectedPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={removeSelectedPhotos}
                    className="w-full text-left inline-flex items-center gap-1.5 text-charcoal/70 hover:text-ink text-xs font-medium mt-1"
                  >
                    <Trash2 size={13} />
                    {t("Bỏ {n} ảnh đã chọn", { n: selectedPhotos.length })}
                  </button>
                )}
              </div>
            )}
          </Field>

          <Field label={t("Người thêm (không bắt buộc)")}>
            <input
              value={values.added_by}
              onChange={(e) => setValues((v) => ({ ...v, added_by: e.target.value }))}
              placeholder={t("Vd: An hoặc Bình")}
              className="input"
            />
          </Field>

          <button
            type="submit"
            disabled={saving || uploading}
            className="mt-2 w-full py-3 rounded-lg bg-coral hover:bg-coral-dark text-paper font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? t("Đang lưu...") : uploading ? t("Đang tải ảnh...") : initial ? t("Lưu thay đổi") : t("Thêm địa điểm")}
          </button>
        </form>
      </div>

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 px-5"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-2 mb-2">
              <a
                href={lightboxPhoto}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-coral hover:bg-coral-dark text-paper text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-full transition-colors"
              >
                <Download size={14} />
                {t("Tải về")}
              </a>
              <button
                onClick={() => setLightboxPhoto(null)}
                aria-label={t("Đóng")}
                className="p-2 rounded-full bg-paper/90 hover:bg-paper text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxPhoto}
              alt={t("Ảnh địa điểm")}
              className="w-full max-h-[75vh] object-contain rounded-xl border-[3px] border-paper"
            />
          </div>
        </div>
      )}

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
