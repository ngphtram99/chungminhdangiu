"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Place } from "@/lib/types";
import PlaceListItem from "@/components/PlaceListItem";
import AddEditPlaceModal, { PlaceFormValues } from "@/components/AddEditPlaceModal";
import CategoryFilter, { CategoryFilterValue, matchesCategory, getExtraCategories } from "@/components/CategoryFilter";
import { Plus, Search } from "lucide-react";

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilterValue>("all");

  useEffect(() => {
    fetchPlaces();

    const channel = supabase
      .channel("places_list_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "places" },
        () => {
          fetchPlaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPlaces() {
    setLoading(true);
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("status", "visited")
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

  async function handleDelete(place: Place) {
    if (!confirm(`Xoá "${place.name}" khỏi danh sách?`)) return;
    const { error } = await supabase.from("places").delete().eq("id", place.id);
    if (error) {
      alert("Lỗi khi xoá: " + error.message);
      return;
    }
    fetchPlaces();
  }

  const filteredPlaces = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return places.filter((p) => {
      const matchesQuery =
        !q ||
        (p.name?.toLowerCase() || "").includes(q) ||
        (p.address?.toLowerCase() || "").includes(q) ||
        (p.district?.toLowerCase() || "").includes(q);
      return matchesQuery && matchesCategory(p.category, activeCategory);
    });
  }, [places, searchTerm, activeCategory]);

  const extraCategories = useMemo(() => getExtraCategories(places), [places]);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-8 pt-4 sm:pt-8">
      <div className="relative mb-5 sm:mb-8">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên, địa chỉ, hoặc quận..."
          className="w-full paper-card rounded-lg border-[3px] border-ink shadow-[3px_3px_0_0_#1A1A1A] pl-10 pr-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none"
        />
      </div>

      <div className="mb-5 sm:mb-8">
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} extraCategories={extraCategories} />
      </div>

      {error && (
        <div className="paper-card text-charcoal rounded-xl border-[3px] border-coral p-5 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-charcoal/60 font-mono text-sm">Đang tải...</p>
      ) : filteredPlaces.length === 0 ? (
        <div className="paper-card text-charcoal rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] p-8 sm:p-10 text-center">
          <p className="font-display text-lg italic mb-1">
            {places.length === 0 ? "Chưa có gì ở đây cả" : "Không tìm thấy kết quả"}
          </p>
          <p className="text-charcoal/60 text-sm">
            {places.length === 0
              ? "Bấm nút + góc dưới để bắt đầu ghi lại kỷ niệm nhé."
              : "Thử từ khoá khác xem sao."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {filteredPlaces.map((place) => (
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
        className="fixed right-4 sm:right-8 bottom-[calc(5.5rem+env(safe-area-inset-bottom)+0.75rem)] sm:bottom-[7.25rem] z-40 w-14 h-14 rounded-lg border-[3px] border-ink bg-coral hover:bg-coral-dark text-paper shadow-[4px_4px_0_0_#1A1A1A] flex items-center justify-center transition-colors"
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
