"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Place, PlaceStatus } from "@/lib/types";
import StatusTabs from "@/components/StatusTabs";
import PlaceCard from "@/components/PlaceCard";
import AddEditPlaceModal, { PlaceFormValues } from "@/components/AddEditPlaceModal";
import { Plus } from "lucide-react";

type TabValue = PlaceStatus | "all";

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  useEffect(() => {
    fetchPlaces();
  }, []);

  async function fetchPlaces() {
    setLoading(true);
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(
        "Không tải được dữ liệu. Kiểm tra lại cấu hình Supabase trong README.md."
      );
      console.error(error);
    } else {
      setPlaces(data as Place[]);
      setError(null);
    }
    setLoading(false);
  }

  async function handleSave(values: PlaceFormValues) {
    const payload = {
      name: values.name.trim(),
      address: values.address.trim(),
      maps_link: values.maps_link.trim() || null,
      status: values.status,
      visited_date: values.status === "visited" ? values.visited_date || null : null,
      rating: values.status === "visited" ? values.rating || null : null,
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

  async function handleDelete(place: Place) {
    if (!confirm(`Xoá "${place.name}" khỏi danh sách?`)) return;
    const { error } = await supabase.from("places").delete().eq("id", place.id);
    if (error) {
      alert("Lỗi khi xoá: " + error.message);
      return;
    }
    fetchPlaces();
  }

  const filtered = useMemo(() => {
    if (activeTab === "all") return places;
    return places.filter((p) => p.status === activeTab);
  }, [places, activeTab]);

  const counts = useMemo(() => {
    return {
      all: places.length,
      visited: places.filter((p) => p.status === "visited").length,
      want_to_go: places.filter((p) => p.status === "want_to_go").length,
      not_yet: places.filter((p) => p.status === "not_yet").length,
    };
  }, [places]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-14">
      <header className="mb-6 sm:mb-10">
        <h1 className="font-display italic text-2xl sm:text-4xl font-semibold text-ink leading-tight">
          Địa điểm của tụi mình
        </h1>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <StatusTabs active={activeTab} onChange={setActiveTab} counts={counts} />
        <button
          onClick={() => {
            setEditingPlace(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-coral hover:bg-coral-dark text-paper font-semibold text-sm sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-colors shrink-0"
        >
          <Plus size={16} />
          Thêm địa điểm
        </button>
      </div>

      {error && (
        <div className="paper-card text-charcoal rounded-xl p-5 mb-6 border border-coral/40">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-charcoal/60 font-mono text-sm">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="paper-card text-charcoal rounded-2xl p-8 sm:p-10 text-center">
          <p className="font-display text-lg italic mb-1">Chưa có gì ở đây cả</p>
          <p className="text-charcoal/60 text-sm">
            Bấm &ldquo;Thêm địa điểm&rdquo; để bắt đầu ghi lại kỷ niệm nhé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onEdit={() => {
                setEditingPlace(place);
                setModalOpen(true);
              }}
              onDelete={() => handleDelete(place)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <AddEditPlaceModal
          initial={editingPlace}
          onClose={() => {
            setModalOpen(false);
            setEditingPlace(null);
          }}
          onSave={handleSave}
        />
      )}
    </main>
  );
}
