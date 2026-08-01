"use client";

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
  const startOffset = (firstDay.getDay() + 6) % 7; // T2 = 0
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
  const [view, setView] = useState<ViewMode>("year");
  const [activeMonth, setActiveMonth] = useState(today.getMonth());
  const [notes, setNotes] = useState<Record<string, CalendarNote>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [photosByDate, setPhotosByDate] = useState<Record<string, { url: string; name: string }[]>>({});

  useEffect(() => {
    fetchNotes();
    fetchVisitedPhotos();
    const channel = supabase
      .channel("calendar_notes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_notes" },
        () => fetchNotes()
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
    setLoading(true);
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
    }
    setLoading(false);
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
    }
  }

  function openDay(dateKey: string) {
    setSelectedDate(dateKey);
    setDraft(notes[dateKey]?.content || "");
  }

  function zoomIntoMonth(m: number) {
    setActiveMonth(m);
    setView("month");
  }

  async function saveNote() {
    if (!selectedDate) return;
    const text = draft.trim();
    setSaving(true);

    if (!text) {
      if (notes[selectedDate]) {
        await supabase.from("calendar_notes").delete().eq("note_date", selectedDate);
      }
    } else if (notes[selectedDate]) {
      await supabase
        .from("calendar_notes")
        .update({ content: text, updated_at: new Date().toISOString() })
        .eq("note_date", selectedDate);
    } else {
      await supabase.from("calendar_notes").insert({
        note_date: selectedDate,
        content: text,
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
          aria-label="Trước"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex flex-col items-center gap-1.5">
          <h1 className="font-display italic text-2xl sm:text-4xl font-semibold text-ink text-center">
            {view === "year"
              ? `Note lịch ${year}`
              : `${MONTH_NAMES[activeMonth]} ${year}`}
          </h1>
          <button
            onClick={() => setView(view === "year" ? "month" : "year")}
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-coral-dark hover:text-coral border border-coral/30 hover:border-coral rounded-full px-3 py-1 transition-colors"
          >
            {view === "year" ? (
              <>
                <ZoomIn size={13} />
                Xem theo tháng
              </>
            ) : (
              <>
                <ZoomOut size={13} />
                Xem cả năm
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

      {loading ? (
        <p className="text-charcoal/60 font-mono text-sm text-center">Đang tải...</p>
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
                    {MONTH_NAMES[m]}
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
                      {w}
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
        <div className="paper-card rounded-xl border-[3px] border-ink shadow-[5px_5px_0_0_#1A1A1A] p-4 sm:p-8 pb-8 sm:pb-10 max-w-xl mx-auto">
          <div className="grid grid-cols-7 gap-y-2 text-center mb-1">
            {WEEKDAY_LABELS.map((w) => (
              <span
                key={w}
                className="text-xs sm:text-sm text-charcoal/40 font-mono font-medium"
              >
                {w}
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
                  className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-xl border transition-colors p-1 ${
                    isToday
                      ? "bg-ink text-paper border-ink font-semibold"
                      : note
                      ? "bg-coral/10 border-coral/30 hover:border-coral text-charcoal"
                      : "border-charcoal/10 hover:border-coral/40 text-charcoal"
                  }`}
                >
                  <span className="text-sm sm:text-lg">{d}</span>
                  {note && (
                    <span
                      className={`text-[7px] sm:text-[9px] mt-0.5 line-clamp-1 px-1 ${
                        isToday ? "text-paper/80" : "text-coral-dark"
                      }`}
                    >
                      {note.content}
                    </span>
                  )}
                  {photosByDate[dateKey] && photosByDate[dateKey].length > 0 && (
                    <span className="flex items-center justify-center mt-1 h-4 sm:h-5">
                      {photosByDate[dateKey].slice(0, 4).map((p, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={p.url}
                          alt={p.name}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-paper object-cover"
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
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ghi chú cho ngày này..."
              rows={4}
              className="w-full rounded-xl border border-charcoal/15 bg-paper px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-coral resize-none"
            />

            {selectedDate && photosByDate[selectedDate] && photosByDate[selectedDate].length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-charcoal/50 font-mono mb-2">
                  Quán đã đi hôm đó:
                </p>
                <div className="flex flex-wrap gap-2">
                  {photosByDate[selectedDate].map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1 w-16"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-ink">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
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
                  Xoá
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={saveNote}
                disabled={saving}
                className="bg-coral hover:bg-coral-dark text-paper text-sm font-semibold px-5 py-2 rounded-lg border-2 border-ink shadow-[3px_3px_0_0_#1A1A1A] transition-colors disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
