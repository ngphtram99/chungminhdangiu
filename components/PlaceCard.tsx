"use client";

import { Place } from "@/lib/types";
import { buildEmbedUrl, buildDirectionsLink } from "@/lib/maps";
import StampBadge from "./StampBadge";
import { MapPin, Star, Pencil, Trash2, ExternalLink } from "lucide-react";

export default function PlaceCard({
  place,
  onEdit,
  onDelete,
  extraBadge,
}: {
  place: Place;
  onEdit: () => void;
  onDelete: () => void;
  extraBadge?: React.ReactNode;
}) {
  const directionsUrl = place.maps_link || buildDirectionsLink(place.name, place.address);
  const heroPhoto = place.photo_links && place.photo_links.length > 0 ? place.photo_links[0] : null;
  const extraPhotos = place.photo_links && place.photo_links.length > 1 ? place.photo_links.slice(1) : [];

  return (
    <article className="paper-card rounded-lg overflow-hidden border-[3px] border-ink shadow-[5px_5px_0_0_#1A1A1A] text-charcoal flex flex-col">
      <div className="aspect-[4/3] w-full bg-ink-light/10 relative">
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt={`Ảnh ${place.name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <iframe
            title={`Bản đồ ${place.name}`}
            src={buildEmbedUrl(place.name, place.address)}
            loading="lazy"
            className="w-full h-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg sm:text-xl font-semibold leading-snug truncate">
              {place.name}
            </h3>
            <p className="flex items-center gap-1 text-xs sm:text-sm text-charcoal/70 mt-0.5">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">{place.address}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StampBadge status={place.status} />
            {extraBadge}
          </div>
        </div>

        {place.status === "visited" && (
          <div className="flex items-center gap-3 text-xs sm:text-sm text-charcoal/80">
            {place.visited_date && (
              <span className="font-mono">
                {new Date(place.visited_date).toLocaleDateString("vi-VN")}
              </span>
            )}
            {place.rating && (
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < place.rating! ? "fill-mustard text-mustard" : "text-charcoal/20"}
                  />
                ))}
              </span>
            )}
          </div>
        )}

        {place.notes && (
          <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed line-clamp-3">
            {place.notes}
          </p>
        )}

        {extraPhotos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {extraPhotos.map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="w-11 h-11 sm:w-12 sm:h-12 rounded-md overflow-hidden shrink-0 border-2 border-ink transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={link}
                  alt={`Ảnh ${place.name} ${i + 2}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-charcoal/10">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:text-coral transition-colors">
            Xem trên Maps <ExternalLink size={12} />
          </a>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              aria-label={`Sửa ${place.name}`}
              className="p-2 rounded-full hover:bg-ink/10 text-ink transition-colors"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={onDelete}
              aria-label={`Xoá ${place.name}`}
              className="p-2 rounded-full hover:bg-coral/10 text-coral transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
