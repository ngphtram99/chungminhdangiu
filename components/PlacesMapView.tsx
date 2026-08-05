"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Place } from "@/lib/types";
import { X } from "lucide-react";

export type MarkerPlace = Place & { __lat: number; __lng: number };

function createPhotoIcon(photoUrl?: string | null) {
  const inner = photoUrl
    ? `<div style="width:44px;height:44px;border-radius:9999px;overflow:hidden;border:3px solid #1A1A1A;box-shadow:2px 2px 0 0 #1A1A1A;background:#fff;">
         <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />
       </div>`
    : `<div style="width:44px;height:44px;border-radius:9999px;border:3px solid #1A1A1A;box-shadow:2px 2px 0 0 #1A1A1A;background:#F0DEEA;display:flex;align-items:center;justify-content:center;font-size:20px;">📍</div>`;

  return L.divIcon({
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
             ${inner}
             <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #1A1A1A;margin-top:-2px;"></div>
           </div>`,
    className: "",
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -54],
  });
}

export default function PlacesMapView({
  places,
  onClose,
}: {
  places: MarkerPlace[];
  onClose: () => void;
}) {
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
          />
          {places.map((p) => (
            <Marker
              key={p.id}
              position={[p.__lat, p.__lng]}
              icon={createPhotoIcon(p.photo_links?.[0])}
            >
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
