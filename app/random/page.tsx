"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Place } from "@/lib/types";
import { distanceKm } from "@/lib/geo";
import AddEditPlaceModal, { PlaceFormValues } from "@/components/AddEditPlaceModal";
import PlaceCard from "@/components/PlaceCard";
import { Shuffle, MapPin, ExternalLink, PartyPopper, Plus, Navigation } from "lucide-react";

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

  useEffect(() => {
    fetchPlaces();
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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

  function spin() {
    if (places.length === 0 || spinning) return;
    setResult(null);
    setSpinning(true);

    let ticks = 0;
    const totalTicks = 20 + Math.floor(Math.random() * 10);

    intervalRef.current = setInterval(function () {
      setHighlightIndex(function (prev) {
        return (prev + 1) % places.length;
      });
      ticks++;
      if (ticks >= totalTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const finalIndex = Math.floor(Math.random() * places.length);
        setHighlightIndex(finalIndex);
        setResult(places[finalIndex]);
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
  }, [placesWithDistance]);

  const districtNames = Object.keys(groupedByDistrict).sort((a, b) => {
    if (a === "Chưa phân loại") return 1;
    if (b === "Chưa phân loại") return -1;
    return a.localeCompare(b, "vi");
  });

  return (
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-8 pt-5 sm:pt-16 pb-10 flex flex-col items-center text-center">
      <h1 className="font-display italic text-2xl sm:text-4xl font-semibold text-ink mb-5 sm:mb-8">
        Random quán
      </h1>

      {loading ? (
        <p className="text-charcoal/60 font-mono text-sm">Đang tải...</p>
      ) : places.length === 0 ? (
        <div className="paper-card rounded-2xl p-8 text-center max-w-sm">
          <p className="font-display text-lg italic mb-1">
            Chưa có quán nào ở mục &ldquo;Muốn đi&rdquo;
          </p>
          <p className="text-charcoal/60 text-sm">
            Bấm nút &ldquo;+&rdquo; góc dưới bên trái để thêm quán nhé.
          </p>
        </div>
      ) : (
        <>
          <div className="paper-card rounded-2xl w-full max-w-sm p-6 sm:p-8 mb-5 sm:mb-6 min-h-[160px] flex flex-col items-center justify-center">
            {result ? (
              <div>
                <div className="flex items-center justify-center gap-1.5 text-coral-dark mb-2">
                  <PartyPopper size={18} />
                  <span className="text-xs font-mono uppercase tracking-wide">
                    Đi quán này nè!
                  </span>
                </div>
                <p className="font-display italic text-xl sm:text-2xl text-ink mb-2">
                  {result.name}
                </p>
                <p className="text-xs sm:text-sm text-charcoal/60 flex items-center justify-center gap-1 mb-3">
                  <MapPin size={13} className="shrink-0" />
                  <span className="line-clamp-2">{result.address}</span>
                </p>
                {result.maps_link && (
                  <a href={result.maps_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-coral-dark hover:text-coral text-xs sm:text-sm font-medium transition-colors">
                    Xem trên Maps
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ) : (
              <p className={"font-display italic text-lg sm:text-xl text-ink transition-opacity " + highlightOpacityClass}>
                {places[highlightIndex] ? places[highlightIndex].name : ""}
              </p>
            )}
          </div>

          <button
            onClick={spin}
            disabled={spinning}
            className="inline-flex items-center gap-2 bg-coral hover:bg-coral-dark text-paper font-semibold px-6 py-3 rounded-full transition-colors disabled:opacity-60"
          >
            <Shuffle size={18} className={spinning ? "animate-spin" : ""} />
            {spinning ? "Đang quay..." : result ? "Quay lại" : "Quay ngay"}
          </button>

          <p className="text-[10px] sm:text-xs text-charcoal/40 font-mono mt-3 mb-8">
            {places.length} quán trong danh sách &ldquo;Muốn đi&rdquo;
          </p>

          <div className="w-full text-left">
            <h2 className="font-display italic text-xl sm:text-2xl text-ink mb-4 text-center">
              Danh sách theo quận
            </h2>
            <div className="flex flex-col gap-8">
              {districtNames.map((district) => (
                <div key={district}>
                  <h3 className="font-mono text-xs uppercase tracking-wide text-charcoal/50 mb-3">
                    {district} ({groupedByDistrict[district].length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {groupedByDistrict[district].map((place) => (
                      <PlaceCard
                        key={place.id}
                        place={place}
                        onEdit={() => {
                          setEditingPlace(place);
                          setModalOpen(true);
                        }}
                        onDelete={() => handleDeletePlace(place)}
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
        className="fixed left-4 z-50 inline-flex items-center justify-center w-12 h-12 rounded-full bg-coral hover:bg-coral-dark text-paper shadow-lg shadow-ink-dark/40 transition-colors"
        style={{ bottom: "calc(6.5rem + env(safe-area-inset-bottom) + 12px)" }}
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
    </main>
  );
}
