"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Place } from "@/lib/types";
import PlaceListItem from "@/components/PlaceListItem";
import AddEditPlaceModal, { PlaceFormValues } from "@/components/AddEditPlaceModal";
import { Plus } from "lucide-react";

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-8 pt-6 sm:pt-14">
      <header className="mb-5 sm:mb-8">
        <h1 className="font-display italic text-2xl sm:text-4xl font-semibold text-ink leading-tight">
          Địa điểm của tụi mình
        </h1>
      </header>

      {error && (
        <div className="paper-card text-charcoal rounded-xl p-5 mb-6 border border-coral/40">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-charcoal/60 font-mono text-sm">Đang tải...</p>
      ) : places.length === 0 ? (
        <div className="paper-card text-charcoal rounded-2xl p-8 sm:p-10 text-center">
          <p className="font-display text-lg italic mb-1">Chưa có gì ở đây cả</p>
          <p className="text-charcoal/60 text-sm">
            Bấm nút + góc dưới để bắt đầu ghi lại kỷ niệm nhé.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {places.map((place) => (
            <PlaceListItem
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

      <button
        onClick={() => {
          setEditingPlace(null);
          setModalOpen(true);
        }}
        aria-label="Thêm địa điểm"
        className="fixed right-4 sm:right-8 bottom-[calc(5.5rem+0.75rem)] sm:bottom-24 z-40 w-14 h-14 rounded-full bg-coral hover:bg-coral-dark text-paper shadow-xl shadow-ink-dark/30 flex items-center justify-center transition-colors"
      >
        <Plus size={24} />
      </button>

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
