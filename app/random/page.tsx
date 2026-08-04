"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Place } from "@/lib/types";
import { distanceKm } from "@/lib/geo";
import AddEditPlaceModal, { PlaceFormValues } from "@/components/AddEditPlaceModal";
import PlaceListItem from "@/components/PlaceListItem";
import CategoryFilter, { CategoryFilterValue, matchesCategory, getExtraCategories } from "@/components/CategoryFilter";
import { Shuffle, MapPin, ExternalLink, PartyPopper, Plus, Navigation, X, Check } from "lucide-react";

const NEARBY_KM = 5;

type PlaceWithDistance = Place & { __distance: number | null };

export default function RandomPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [result, setResult] = useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [visitedTarget, setVisitedTarget] = useState<Place | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [visitedRating, setVisitedRating] = useState(0);
  const [visitedNotes, setVisitedNotes] = useState("");
  const [visitedPlaces, setVisitedPlaces] = useState<Place[]>([]);
  const [spinMode, setSpinMode] = useState<"want_to_go" | "visited">("want_to_go");
  const [showSpinChoice, setShowSpinChoice] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilterValue>("all");

  useEffect(() => {
    fetchPlaces();
    fetchVisitedPlaces();
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setUserLoc(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    const channel = supabase
      .channel("random_places_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "places" },
        () => {
          fetchPlaces();
          fetchVisitedPlaces();
        }
      )
      .subscribe();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPlaces() {
    setLoading(true);
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("status", "want_to_go")
      .order("created_at", { ascending: false });
    if (!error && data) setPlaces(data as Place[]);
    setLoading(false);
  }

  async function fetchVisitedPlaces() {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("status", "visited")
      .order("created_at", { ascending: false });
    if (!error && data) setVisitedPlaces(data as Place[]);
  }

  async function handleSavePlace(values: PlaceFormValues) {
    const payload = {
      name: values.name.trim(),
      address: values.address.trim(),
      maps_link: values.maps_link.trim() || null,
      status: "want_to_go" as const,
      visited_date: null,
      rating: null,
      notes: values.notes.trim() || null,
      photo_links: values.photo_links,
      added_by: values.added_by.trim() || null,
      district: values.district || null,
      lat: values.lat,
      lng: values.lng,
      category: values.category || null,
    };

    if (editingPlace) {
      const { error } = await supabase
        .from("places")
        .update(payload)
        .eq("id", editingPlace.id);
      if (error) {
        alert("Lỗi khi lưu: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("places").insert(payload);
      if (error) {
        alert("Lỗi khi thêm: " + error.message);
        return;
      }
    }
    setModalOpen(false);
    setEditingPlace(null);
    fetchPlaces();
  }

  async function handleDeletePlace(place: Place) {
    if (!confirm(`Xoá "${place.name}" khỏi danh sách?`)) return;
    const { error } = await supabase.from("places").delete().eq("id", place.id);
    if (error) {
      alert("Lỗi khi xoá: " + error.message);
      return;
    }
    fetchPlaces();
  }

  function openMarkVisited(place: Place) {
    setVisitedTarget(place);
    setCustomDate(new Date().toISOString().slice(0, 10));
    setVisitedRating(place.rating || 0);
    setVisitedNotes(place.notes || "");
  }

  async function confirmMarkVisited(dateStr: string) {
    if (!visitedTarget) return;
    const { error } = await supabase
      .from("places")
      .update({
        status: "visited",
        visited_date: dateStr,
        rating: visitedRating || null,
        notes: visitedNotes.trim() || null,
      })
      .eq("id", visitedTarget.id);
    if (error) {
      alert("Lỗi khi cập nhật: " + error.message);
      return;
    }
    if (result?.id === visitedTarget.id) setResult(null);
    setVisitedTarget(null);
    fetchPlaces();
    fetchVisitedPlaces();
  }

  const filteredWantToGo = useMemo(
    () => places.filter((p) => matchesCategory(p.category, activeCategory)),
    [places, activeCategory]
  );
  const filteredVisited = useMemo(
    () => visitedPlaces.filter((p) => matchesCategory(p.category, activeCategory)),
    [visitedPlaces, activeCategory]
  );

  const currentPool = spinMode === "want_to_go" ? filteredWantToGo : filteredVisited;

  function startSpin(mode: "want_to_go" | "visited") {
    const pool = mode === "want_to_go" ? filteredWantToGo : filteredVisited;
    if (pool.length === 0) {
      alert(
        mode === "want_to_go"
          ? "Chưa có địa điểm nào ở mục \u0022Muốn đi\u0022 khớp phân loại đã chọn."
          : "Chưa có địa điểm nào ở mục \u0022Đã đi\u0022 khớp phân loại đã chọn."
      );
      return;
    }
    setSpinMode(mode);
    setShowSpinChoice(false);
    setResult(null);
    setSpinning(true);
    setHighlightIndex(0);

    let ticks = 0;
    const totalTicks = 20 + Math.floor(Math.random() * 10);

    intervalRef.current = setInterval(function () {
      setHighlightIndex(function (prev) {
        return (prev + 1) % pool.length;
      });
      ticks++;
      if (ticks >= totalTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const finalIndex = Math.floor(Math.random() * pool.length);
        setHighlightIndex(finalIndex);
        setResult(pool[finalIndex]);
        setSpinning(false);
      }
    }, 90);
  }

  const highlightOpacityClass = spinning ? "opacity-60" : "opacity-90";

  const placesWithDistance: PlaceWithDistance[] = useMemo(() => {
    return places.map((p) => {
      let distance: number | null = null;
      if (userLoc && p.lat != null && p.lng != null) {
        distance = distanceKm(userLoc.lat, userLoc.lng, p.lat, p.lng);
      }
      return { ...p, __distance: distance };
    });
  }, [places, userLoc]);

  const groupedByDistrict = useMemo(() => {
    const groups: Record<string, PlaceWithDistance[]> = {};
    for (const p of placesWithDistance) {
      if (!matchesCategory(p.category, activeCategory)) continue;
      const key = p.district && p.district.trim() ? p.district : "Chưa phân loại";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        if (a.__distance == null && b.__distance == null) return 0;
        if (a.__distance == null) return 1;
        if (b.__distance == null) return -1;
        return a.__distance - b.__distance;
      });
    }
    return groups;
  }, [placesWithDistance, activeCategory]);

  const extraCategories = useMemo(
    () => getExtraCategories([...places, ...visitedPlaces]),
    [places, visitedPlaces]
  );

  const districtNames = Object.keys(groupedByDistrict).sort((a, b) => {
    if (a === "Chưa phân loại") return 1;
    if (b === "Chưa phân loại") return -1;
    return a.localeCompare(b, "vi");
  });

  return (
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-8 pt-4 sm:pt-8 pb-10 flex flex-col items-center text-center">
      {loading ? (
        <p className="text-charcoal/60 font-mono text-sm">Đang tải...</p>
      ) : places.length === 0 && visitedPlaces.length === 0 ? (
        <div className="paper-card rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] p-8 text-center max-w-sm">
          <p className="font-display text-lg italic mb-1">
            Chưa có địa điểm nào cả
          </p>
          <p className="text-charcoal/60 text-sm">
            Bấm nút &ldquo;+&rdquo; góc dưới bên phải để thêm địa điểm nhé.
          </p>
        </div>
      ) : (
        <>
          <div className="paper-card rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] w-full max-w-sm p-4 sm:p-5 mb-4 sm:mb-5 min-h-[130px] flex flex-col items-center justify-center">
            {result ? (
              <div>
                <div className="flex items-center justify-center gap-1.5 text-coral-dark mb-1.5">
                  <PartyPopper size={14} />
                  <span className="text-[10px] font-mono uppercase tracking-wide">
                    Đi địa điểm này nè!
                  </span>
                </div>
                <p className="font-display italic text-base sm:text-lg text-ink mb-1.5">
                  {result.name}
                </p>
                <p className="text-[11px] sm:text-xs text-charcoal/60 flex items-center justify-center gap-1 mb-2">
                  <MapPin size={11} className="shrink-0" />
                  <span className="line-clamp-2">{result.address}</span>
                </p>
                {result.maps_link && (
                  <a href={result.maps_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-coral-dark hover:text-coral text-[11px] sm:text-xs font-medium transition-colors">
                    Xem trên Maps
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            ) : (
              <p className={"font-display italic text-lg sm:text-xl text-ink transition-opacity " + highlightOpacityClass}>
                {currentPool[highlightIndex] ? currentPool[highlightIndex].name : ""}
              </p>
            )}
          </div>

          <button
            onClick={() => setShowSpinChoice(true)}
            disabled={spinning}
            className="inline-flex items-center gap-2 bg-coral hover:bg-coral-dark text-paper font-semibold px-6 py-3 rounded-lg border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] transition-colors disabled:opacity-60"
          >
            <Shuffle size={18} className={spinning ? "animate-spin" : ""} />
            {spinning ? "Đang quay..." : result ? "Quay lại" : "Quay ngay"}
          </button>

          <p className="text-[10px] sm:text-xs text-charcoal/40 font-mono mt-2 mb-4">
            {spinMode === "want_to_go"
              ? `${places.length} địa điểm trong danh sách "Muốn đi"`
              : `${visitedPlaces.length} địa điểm trong danh sách "Đã đi"`}
          </p>

          <div className="w-full mb-4 sm:mb-6">
            <CategoryFilter
              active={activeCategory}
              onChange={setActiveCategory}
              extraCategories={extraCategories}
              places={[...places, ...visitedPlaces]}
            />
          </div>

          <div className="w-full text-left">
            <div className="flex flex-col gap-6">
              {districtNames.map((district) => (
                <div key={district}>
                  <h3 className="font-mono text-xs uppercase tracking-wide text-charcoal/50 mb-3">
                    {district} ({groupedByDistrict[district].length})
                  </h3>
                  <div className="flex flex-col gap-2.5 sm:gap-3">
                    {groupedByDistrict[district].map((place) => (
                      <PlaceListItem
                        key={place.id}
                        place={place}
                        onEdit={() => {
                          setEditingPlace(place);
                          setModalOpen(true);
                        }}
                        onDelete={() => handleDeletePlace(place)}
                        onMarkVisited={() => openMarkVisited(place)}
                        extraBadge={
                          place.__distance != null && place.__distance <= NEARBY_KM ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-sage/20 text-sage px-2 py-1 rounded-full">
                              <Navigation size={10} />
                              {place.__distance.toFixed(1)} km
                            </span>
                          ) : place.__distance != null ? (
                            <span className="text-[10px] font-mono text-charcoal/40">
                              {place.__distance.toFixed(1)} km
                            </span>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => {
          setEditingPlace(null);
          setModalOpen(true);
        }}
        aria-label="Thêm địa điểm"
        className="fixed right-4 sm:right-8 bottom-[calc(5.5rem+env(safe-area-inset-bottom)+0.75rem)] sm:bottom-[7.25rem] z-40 w-14 h-14 rounded-lg border-[3px] border-ink bg-coral hover:bg-coral-dark text-paper shadow-[4px_4px_0_0_#1A1A1A] flex items-center justify-center transition-colors"
      >
        <Plus size={20} />
      </button>

      {modalOpen && (
        <AddEditPlaceModal
          initial={editingPlace}
          lockedStatus="want_to_go"
          onClose={() => {
            setModalOpen(false);
            setEditingPlace(null);
          }}
          onSave={handleSavePlace}
        />
      )}

      {showSpinChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-ink/40">
          <div className="paper-card rounded-xl border-[3px] border-ink shadow-[5px_5px_0_0_#1A1A1A] p-5 sm:p-6 w-full max-w-sm text-center">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display italic text-lg text-ink">Quay địa điểm nào?</p>
              <button
                onClick={() => setShowSpinChoice(false)}
                className="text-charcoal/50 hover:text-ink transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => startSpin("want_to_go")}
                className="w-full bg-coral hover:bg-coral-dark text-paper font-semibold py-2.5 rounded-lg border-2 border-ink shadow-[3px_3px_0_0_#1A1A1A] transition-colors"
              >
                Chưa đi ({filteredWantToGo.length})
              </button>
              <button
                onClick={() => startSpin("visited")}
                className="w-full bg-ink hover:bg-charcoal text-paper font-semibold py-2.5 rounded-lg border-2 border-ink transition-colors"
              >
                Đã đi ({filteredVisited.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {visitedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-ink/40">
          <div className="paper-card rounded-xl border-[3px] border-ink shadow-[5px_5px_0_0_#1A1A1A] p-5 sm:p-6 w-full max-w-sm text-left max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <p className="font-display italic text-lg text-ink">
                Đánh dấu đã đi
              </p>
              <button
                onClick={() => setVisitedTarget(null)}
                className="text-charcoal/50 hover:text-ink transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-charcoal/70 mb-4">
              {visitedTarget.name}
            </p>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-charcoal/90 mb-3">
              <span>Đánh giá</span>
              <select
                value={visitedRating}
                onChange={(e) => setVisitedRating(Number(e.target.value))}
                className="rounded-lg border-2 border-ink px-3 py-2 text-sm text-charcoal bg-paper focus:outline-none"
              >
                <option value={0}>Chưa chấm</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-charcoal/90 mb-4">
              <span>Ghi chú</span>
              <textarea
                value={visitedNotes}
                onChange={(e) => setVisitedNotes(e.target.value)}
                placeholder="Món ngon, kỷ niệm, lưu ý..."
                rows={3}
                className="rounded-lg border-2 border-ink px-3 py-2 text-sm text-charcoal bg-paper focus:outline-none resize-none w-full"
              />
            </label>

            <button
              onClick={() => confirmMarkVisited(new Date().toISOString().slice(0, 10))}
              className="w-full inline-flex items-center justify-center gap-2 bg-coral hover:bg-coral-dark text-paper font-semibold py-2.5 rounded-lg border-2 border-ink shadow-[3px_3px_0_0_#1A1A1A] transition-colors mb-3"
            >
              <Check size={16} />
              Hôm nay
            </button>

            <p className="text-xs text-charcoal/50 font-mono mb-1.5">
              Hoặc chọn ngày khác:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 rounded-lg border-2 border-ink px-3 py-2 text-sm text-charcoal bg-paper focus:outline-none"
              />
              <button
                onClick={() => confirmMarkVisited(customDate)}
                disabled={!customDate}
                className="bg-ink hover:bg-charcoal text-paper text-sm font-semibold px-4 py-2 rounded-lg border-2 border-ink transition-colors disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
