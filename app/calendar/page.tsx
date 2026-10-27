"use client";

import { readCache, writeCache } from "@/lib/cache";
import { t } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarNote } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  ZoomIn,
  ZoomOut,
  Clock,
  Upload,
  Download,
  Loader2,
} from "lucide-react";

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

type ViewMode = "year" | "month";

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [view, setView] = useState<ViewMode>("month");
  const [activeMonth, setActiveMonth] = useState(today.getMonth());
  const [notes, setNotes] = useState<Record<string, CalendarNote>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [placePhotosByDate, setPhotosByDate] = useState<Record<string, { url: string; name: string }[]>>({});
  const [recentNotes, setRecentNotes] = useState<CalendarNote[]>([]);
  const [recentVisible, setRecentVisible] = useState(3);
  const [draftPhotos, setDraftPhotos] = useState<string[]>([]);
  // Ảnh đang tải lên: hiện bản xem trước mờ + vòng xoay (giống phần địa điểm)
  const [pendingPhotos, setPendingPhotos] = useState<{ id: string; preview: string }[]>([]);
  const uploadingPhoto = pendingPhotos.length > 0;
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; name: string } | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);

  useEffect(() => {
    const cachedNotes = readCache<Record<string, CalendarNote>>(`cal:notes:${year}`);
    if (cachedNotes) {
      setNotes(cachedNotes);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const cachedPhotos = readCache<Record<string, { url: string; name: string }[]>>(`cal:photos:${year}`);
    if (cachedPhotos) setPhotosByDate(cachedPhotos);
    const cachedRecent = readCache<CalendarNote[]>("cal:recent");
    if (cachedRecent) setRecentNotes(cachedRecent);
    fetchNotes();
    fetchVisitedPhotos();
    fetchRecentNotes();
    const channel = supabase
      .channel("calendar_notes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_notes" },
        () => {
          fetchNotes();
          fetchRecentNotes();
        }
      )
      .subscribe();
    const placesChannel = supabase
      .channel("calendar_places_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "places" },
        () => fetchVisitedPhotos()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(placesChannel);
    };
  }, [year]);

  async function fetchNotes() {
    const { data, error } = await supabase
      .from("calendar_notes")
      .select("*")
      .gte("note_date", `${year}-01-01`)
      .lte("note_date", `${year}-12-31`);
    if (!error && data) {
      const map: Record<string, CalendarNote> = {};
      (data as CalendarNote[]).forEach((n) => {
        map[n.note_date] = n;
      });
      setNotes(map);
      writeCache(`cal:notes:${year}`, map);
    }
    setLoading(false);
  }

  async function fetchRecentNotes() {
    const { data, error } = await supabase
      .from("calendar_notes")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      setRecentNotes(data as CalendarNote[]);
      writeCache("cal:recent", data);
    }
  }

  async function fetchVisitedPhotos() {
    const { data, error } = await supabase
      .from("places")
      .select("name, visited_date, photo_links")
      .eq("status", "visited")
      .gte("visited_date", `${year}-01-01`)
      .lte("visited_date", `${year}-12-31`);
    if (!error && data) {
      const map: Record<string, { url: string; name: string }[]> = {};
      (data as { name: string; visited_date: string | null; photo_links: string[] | null }[]).forEach((p) => {
        if (!p.visited_date) return;
        const photo = p.photo_links && p.photo_links.length > 0 ? p.photo_links[0] : null;
        if (!photo) return;
        if (!map[p.visited_date]) map[p.visited_date] = [];
        map[p.visited_date].push({ url: photo, name: p.name });
      });
      setPhotosByDate(map);
      writeCache(`cal:photos:${year}`, map);
    }
  }

  function goToNote(note: CalendarNote) {
    const parts = note.note_date.split("-").map(Number);
    const y = parts[0];
    const m = parts[1];
    setYear(y);
    setActiveMonth(m - 1);
    setView("month");
    openDay(note.note_date);
  }

  function openDay(dateKey: string) {
    setSelectedDate(dateKey);
    setDraft(notes[dateKey]?.content || "");
    setDraftPhotos(notes[dateKey]?.photo_links || []);
    setSelectedPhotos([]);
    setUploadError(null);
  }

  async function handleUploadNotePhotos(files: FileList) {
    setUploadError(null);
    await Promise.all(
      Array.from(files).map(async (file) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const preview = URL.createObjectURL(file);
        setPendingPhotos((p) => [...p, { id, preview }]);
        try {
          const ext = file.name.split(".").pop();
          const path = `note-${id}.${ext}`;
          const { error } = await supabase.storage.from("place-photos").upload(path, file);
          if (error) throw error;
          const { data } = supabase.storage.from("place-photos").getPublicUrl(path);
          setDraftPhotos((prev) => [...prev, data.publicUrl]);
        } catch (err) {
          setUploadError(t("Upload ảnh thất bại, thử lại nhé."));
          console.error(err);
        } finally {
          setPendingPhotos((p) => p.filter((x) => x.id !== id));
          URL.revokeObjectURL(preview);
        }
      })
    );
  }

  function toggleSelectPhoto(idx: number) {
    setSelectedPhotos((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  function removeSelectedPhotos() {
    setDraftPhotos((prev) => prev.filter((_, i) => !selectedPhotos.includes(i)));
    setSelectedPhotos([]);
  }

  function removeDraftPhoto(idx: number) {
    setDraftPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  function zoomIntoMonth(m: number) {
    setActiveMonth(m);
    setView("month");
  }

  async function saveNote() {
    if (!selectedDate) return;
    const text = draft.trim();
    setSaving(true);

    if (!text && draftPhotos.length === 0) {
      if (notes[selectedDate]) {
        await supabase.from("calendar_notes").delete().eq("note_date", selectedDate);
      }
    } else if (notes[selectedDate]) {
      await supabase
        .from("calendar_notes")
        .update({ content: text, photo_links: draftPhotos, updated_at: new Date().toISOString() })
        .eq("note_date", selectedDate);
    } else {
      await supabase.from("calendar_notes").insert({
        note_date: selectedDate,
        content: text,
        photo_links: draftPhotos,
      });
    }

    setSaving(false);
    setSelectedDate(null);
  }

  async function deleteNote() {
    if (!selectedDate) return;
    setSaving(true);
    await supabase.from("calendar_notes").delete().eq("note_date", selectedDate);
    setSaving(false);
    setSelectedDate(null);
  }

  const photosByDate = useMemo(() => {
    const merged: Record<string, { url: string; name: string }[]> = {};
    Object.entries(placePhotosByDate).forEach(([d, list]) => {
      merged[d] = [...list];
    });
    Object.entries(notes).forEach(([d, n]) => {
      (n?.photo_links || []).forEach((url) => {
        if (!merged[d]) merged[d] = [];
        merged[d].push({ url, name: t("Ghi chú") });
      });
    });
    return merged;
  }, [placePhotosByDate, notes]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  function goPrevMonth() {
    if (activeMonth === 0) {
      setYear((y) => y - 1);
      setActiveMonth(11);
    } else {
      setActiveMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (activeMonth === 11) {
      setYear((y) => y + 1);
      setActiveMonth(0);
    } else {
      setActiveMonth((m) => m + 1);
    }
  }

  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-8 pt-5 sm:pt-16">
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <button
          onClick={view === "year" ? () => setYear((y) => y - 1) : goPrevMonth}
          className="p-2 rounded-full hover:bg-charcoal/10 text-charcoal/60 hover:text-ink transition-colors"
          aria-label={t("Trước")}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex flex-col items-center gap-1.5">
          <h1 className="font-display italic text-2xl sm:text-4xl font-semibold text-ink text-center">
            {view === "year"
              ? `${year}`
              : `${t(MONTH_NAMES[activeMonth])} ${year}`}
          </h1>
          <button
            onClick={() => setView(view === "year" ? "month" : "year")}
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-coral-dark hover:text-coral border border-coral/30 hover:border-coral rounded-full px-3 py-1 transition-colors"
          >
            {view === "year" ? (
              <>
                <ZoomIn size={13} />
                {t("Xem theo tháng")}
              </>
            ) : (
              <>
                <ZoomOut size={13} />
                {t("Xem cả năm")}
              </>
            )}
          </button>
        </div>

        <button
          onClick={view === "year" ? () => setYear((y) => y + 1) : goNextMonth}
          className="p-2 rounded-full hover:bg-charcoal/10 text-charcoal/60 hover:text-ink transition-colors"
          aria-label="Sau"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {recentNotes.length > 0 && (
        <div className="paper-card rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] p-3 sm:p-5 mb-3 sm:mb-8 max-w-xl mx-auto">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock size={14} className="text-coral-dark" />
            <p className="text-xs sm:text-sm font-semibold text-ink">
              {t("Ghi chú gần đây")}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            {recentNotes.slice(0, recentVisible).map((n) => (
              <button
                key={n.id}
                onClick={() => goToNote(n)}
                className="flex flex-row items-center gap-3 text-left px-2.5 h-11 sm:h-12 rounded-lg hover:bg-coral/10 transition-colors w-full"
              >
                <span className="shrink-0 w-[78px] sm:w-24 text-[11px] sm:text-xs font-mono text-charcoal/50">
                  {n.note_date.split("-").reverse().join("/")}
                </span>
                <span className="flex-1 min-w-0 truncate text-sm sm:text-base text-charcoal">
                  {n.content || t("Ảnh")}
                </span>
                {n.photo_links && n.photo_links.length > 0 && (
                  <span className="shrink-0 flex items-center">
                    {n.photo_links.slice(0, 3).map((url, pi) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" decoding="async"
                        key={pi}
                        src={url}
                        alt=""
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-md border-2 border-paper object-cover"
                        style={{ marginLeft: pi === 0 ? 0 : "-10px", zIndex: 10 - pi }}
                      />
                    ))}
                    {n.photo_links.length > 3 && (
                      <span className="ml-1.5 text-xs font-mono text-charcoal/60">
                        +{n.photo_links.length - 3}
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
            {(recentNotes.length > recentVisible || recentVisible > 3) && (
              <div className="flex items-center justify-center gap-4 pt-1">
                {recentNotes.length > recentVisible && (
                  <button
                    type="button"
                    onClick={() => setRecentVisible((v) => v + 10)}
                    className="text-xs font-mono text-coral-dark hover:text-coral transition-colors"
                  >
                    {t("Xem thêm")} ({Math.min(10, recentNotes.length - recentVisible)})
                  </button>
                )}
                {recentVisible > 3 && (
                  <button
                    type="button"
                    onClick={() => setRecentVisible(3)}
                    className="text-xs font-mono text-charcoal/60 hover:text-ink transition-colors"
                  >
                    {t("Thu gọn")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-charcoal/60 font-mono text-sm text-center">{t("Đang tải...")}</p>
      ) : view === "year" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-6">
          {months.map((m) => {
            const cells = getMonthGrid(year, m);
            return (
              <div key={m} className="paper-card rounded-lg border-2 border-ink p-2.5 sm:p-4">
                <button
                  onClick={() => zoomIntoMonth(m)}
                  className="w-full flex items-center justify-center gap-1.5 mb-2 group"
                >
                  <p className="font-display italic text-sm sm:text-base text-ink group-hover:text-coral-dark transition-colors">
                    {t(MONTH_NAMES[m])}
                  </p>
                  <ZoomIn
                    size={11}
                    className="text-charcoal/30 group-hover:text-coral-dark transition-colors"
                  />
                </button>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {WEEKDAY_LABELS.map((w) => (
                    <span
                      key={w}
                      className="text-[8px] sm:text-[10px] text-charcoal/40 font-mono"
                    >
                      {t(w)}
                    </span>
                  ))}
                  {cells.map((d, idx) => {
                    if (d === null) return <span key={idx} />;
                    const dateKey = toDateKey(year, m, d);
                    const hasNote = !!notes[dateKey];
                    const isToday = dateKey === todayKey;
                    return (
                      <button
                        key={idx}
                        onClick={() => openDay(dateKey)}
                        className={`relative w-full aspect-square flex items-center justify-center text-[9px] sm:text-xs rounded-md transition-colors ${
                          isToday
                            ? "bg-ink text-paper font-semibold"
                            : "hover:bg-coral/15 text-charcoal"
                        }`}
                      >
                        {d}
                        {(hasNote || (photosByDate[dateKey] && photosByDate[dateKey].length > 0)) && (
                          <span className="absolute bottom-0.5 flex items-center gap-0.5">
                            {hasNote && (
                              <span className="w-1 h-1 rounded-full bg-coral-dark" />
                            )}
                            {photosByDate[dateKey] && photosByDate[dateKey].length > 0 && (
                              <span className="w-1 h-1 rounded-full bg-sage" />
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="paper-card rounded-xl border-[3px] border-ink shadow-[5px_5px_0_0_#1A1A1A] p-3 sm:p-8 pb-4 sm:pb-10 max-w-xl mx-auto">
          <div className="grid grid-cols-7 gap-y-2 text-center mb-1">
            {WEEKDAY_LABELS.map((w) => (
              <span
                key={w}
                className="text-xs sm:text-sm text-charcoal/40 font-mono font-medium"
              >
                {t(w)}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {getMonthGrid(year, activeMonth).map((d, idx) => {
              if (d === null) return <span key={idx} />;
              const dateKey = toDateKey(year, activeMonth, d);
              const note = notes[dateKey];
              const isToday = dateKey === todayKey;
              return (
                <button
                  key={idx}
                  onClick={() => openDay(dateKey)}
                  className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-xl border transition-colors p-1 overflow-hidden ${
                    isToday
                      ? "bg-ink text-paper border-ink font-semibold"
                      : note
                      ? "bg-coral/10 border-coral/30 hover:border-coral text-charcoal"
                      : "border-charcoal/10 hover:border-coral/40 text-charcoal"
                  }`}
                >
                  <span className="text-base sm:text-xl leading-none">{d}</span>
                  {note && (
                    <span
                      className={`text-[10px] sm:text-xs leading-tight mt-1 line-clamp-1 px-0.5 ${
                        isToday ? "text-paper/80" : "text-coral-dark"
                      }`}
                    >
                      {note.content}
                    </span>
                  )}
                  {photosByDate[dateKey] && photosByDate[dateKey].length > 0 && (
                    <span className="flex items-center justify-center mt-1 h-5 sm:h-6">
                      {photosByDate[dateKey].slice(0, 4).map((p, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img loading="lazy" decoding="async"
                          key={i}
                          src={p.url}
                          alt={p.name}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-paper object-cover"
                          style={{
                            marginLeft: i === 0 ? 0 : "-6px",
                            transform: `rotate(${(i - 1.5) * 12}deg)`,
                            zIndex: 10 - i,
                          }}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-ink/40">
          <div className="paper-card rounded-xl border-[3px] border-ink shadow-[5px_5px_0_0_#1A1A1A] p-5 sm:p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display italic text-lg text-ink">
                {selectedDate.split("-").reverse().join("/")}
              </p>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-charcoal/50 hover:text-ink transition-colors"
                aria-label={t("Đóng")}
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("Ghi chú cho ngày này...")}
              rows={4}
              className="w-full rounded-xl border border-charcoal/15 bg-paper px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-coral resize-none"
            />

            <div className="mt-3">
              <label
                htmlFor="note-photo-upload"
                className="flex items-center justify-center gap-2 border border-dashed border-charcoal/25 rounded-lg py-2.5 text-xs sm:text-sm text-charcoal/60 cursor-pointer hover:border-coral hover:text-coral-dark transition-colors"
              >
                {uploadingPhoto ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {uploadingPhoto ? t("Đang tải ảnh lên...") : t("Thêm ảnh cho ngày này")}
                <input
                  id="note-photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleUploadNotePhotos(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
              {uploadError && (
                <p className="text-xs text-coral-dark mt-1">{uploadError}</p>
              )}
              {(draftPhotos.length > 0 || pendingPhotos.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {draftPhotos.map((link, i) => {
                    const isSel = selectedPhotos.includes(i);
                    return (
                      <div
                        key={i}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          isSel ? "border-coral" : "border-transparent"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setLightboxPhoto({ url: link, name: t("Ảnh ghi chú") })}
                          className="w-full h-full block"
                          aria-label={t("Phóng to ảnh")}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img loading="lazy" decoding="async" src={link} alt="" className="w-full h-full object-cover" />
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
                  {pendingPhotos.map((p) => (
                    <div key={p.id} className="relative w-16 h-16 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async" src={p.preview} alt="" className="w-full h-full object-cover opacity-50" />
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
                      <X size={13} />
                      {t("Bỏ {n} ảnh đã chọn khỏi ghi chú", { n: selectedPhotos.length })}
                    </button>
                  )}
                </div>
              )}
            </div>

            {selectedDate && placePhotosByDate[selectedDate] && placePhotosByDate[selectedDate].length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-charcoal/50 font-mono mb-2">
                  {t("Quán đã đi hôm đó:")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {placePhotosByDate[selectedDate].map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1 w-16"
                    >
                      <button
                        type="button"
                        onClick={() => setLightboxPhoto({ url: p.url, name: p.name })}
                        className="w-14 h-14 rounded-lg overflow-hidden border-2 border-ink"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img loading="lazy" decoding="async"
                          src={p.url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <span className="text-[9px] text-charcoal/60 text-center leading-tight line-clamp-2">
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mt-4 gap-2">
              {notes[selectedDate] ? (
                <button
                  onClick={deleteNote}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-coral-dark hover:text-coral text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {t("Xoá ghi chú")}
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={saveNote}
                disabled={saving || uploadingPhoto}
                className="bg-coral hover:bg-coral-dark text-paper text-sm font-semibold px-5 py-2 rounded-lg border-2 border-ink shadow-[3px_3px_0_0_#1A1A1A] transition-colors disabled:opacity-60"
              >
                {saving ? t("Đang lưu...") : uploadingPhoto ? t("Đang tải ảnh...") : t("Lưu")}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 px-5"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end gap-2 mb-2">
              <a
                href={lightboxPhoto.url}
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
            <img loading="lazy" decoding="async"
              src={lightboxPhoto.url}
              alt={lightboxPhoto.name}
              className="w-full max-h-[75vh] object-contain rounded-xl border-[3px] border-paper"
            />
            <p className="text-center text-paper text-sm mt-2">{lightboxPhoto.name}</p>
          </div>
        </div>
      )}
    </main>
  );
}
