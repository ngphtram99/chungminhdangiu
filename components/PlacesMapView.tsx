"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Place } from "@/lib/types";
import { X } from "lucide-react";

export type MarkerPlace = Place & { __lat: number; __lng: number };

export default function PlacesMapView({
  places,
  onClose,
}: {
  places: MarkerPlace[];
  onClose: () => void;
}) {
  useEffect(() => {
    // Sửa lỗi icon mặc định của Leaflet không hiện đúng khi build với Webpack
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  if (places.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-6">
        <div className="paper-card rounded-xl border-[3px] border-ink shadow-[5px_5px_0_0_#1A1A1A] p-6 max-w-sm w-full text-center">
          <p className="font-display italic text-lg text-ink mb-2">
            Chưa có địa điểm nào có vị trí
          </p>
          <p className="text-sm text-charcoal/60 mb-4">
            Sửa lại địa điểm và bấm &ldquo;Lấy vị trí hiện tại&rdquo; để nó hiện lên bản đồ nhé.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-ink hover:bg-charcoal text-paper font-semibold py-2.5 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const center: [number, number] = [
    places.reduce((s, p) => s + p.__lat, 0) / places.length,
    places.reduce((s, p) => s + p.__lng, 0) / places.length,
  ];

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b-[3px] border-ink paper-card shrink-0">
        <p className="font-display italic text-lg sm:text-xl text-ink">
          Bản đồ địa điểm ({places.length})
        </p>
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="p-1.5 rounded-full hover:bg-charcoal/10"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {places.map((p) => (
            <Marker key={p.id} position={[p.__lat, p.__lng]}>
              <Popup>
                <div style={{ textAlign: "center", minWidth: 140 }}>
                  {p.photo_links && p.photo_links[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo_links[0]}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginBottom: 6,
                      }}
                    />
                  )}
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    {p.address}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
