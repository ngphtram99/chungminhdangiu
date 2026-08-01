"use client";

import { Place, STATUS_LABEL } from "@/lib/types";
import { buildDirectionsLink } from "@/lib/maps";
import { MapPin, Trash2, MapPinned, Check, Star } from "lucide-react";

const STATUS_PILL: Record<Place["status"], string> = {
  visited: "bg-sage/15 text-sage-dark",
  want_to_go: "bg-coral/15 text-coral-dark",
  not_yet: "bg-mustard/20 text-mustard-dark",
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

export default function PlaceListItem({
  place,
  onEdit,
  onDelete,
  onMarkVisited,
  extraBadge,
}: {
  place: Place;
  onEdit: () => void;
  onDelete: () => void;
  onMarkVisited?: () => void;
  extraBadge?: React.ReactNode;
}) {
  const thumb = place.photo_links?.[0];
  const directionsUrl = place.maps_link || buildDirectionsLink(place.name, place.address);

  return (
    <div className="flex items-center gap-3 paper-card rounded-lg border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] p-2.5 sm:p-3 overflow-hidden">
      <button
        onClick={onEdit}
        aria-label={`Sửa ${place.name}`}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-lilac border-2 border-ink flex items-center justify-center"
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={place.name} className="w-full h-full object-cover" />
        ) : (
          <MapPinned size={20} className="text-ink/40" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button
          onClick={onEdit}
          aria-label={`Sửa ${place.name}`}
          className="text-left w-full"
        >
          <h3 className="font-display text-sm sm:text-base font-semibold leading-snug truncate">
            {place.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_PILL[place.status]}`}
            >
              {STATUS_LABEL[place.status]}
            </span>
            {place.visited_date && (
              <span className="text-[10px] sm:text-xs text-charcoal/50 font-mono">
                {formatDate(place.visited_date)}
              </span>
            )}
            {place.status === "visited" && place.rating ? (
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={11}
                    className={i < place.rating! ? "fill-mustard text-mustard" : "text-charcoal/20"}
                  />
                ))}
              </span>
            ) : null}
          </div>
        </button>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] sm:text-xs text-charcoal/60 hover:text-coral-dark truncate mt-1 w-fit"
        >
          <MapPin size={11} className="shrink-0" />
          <span className="truncate underline decoration-charcoal/20 underline-offset-2">
            {place.district ? `${place.district} · ` : ""}
            {place.address}
          </span>
        </a>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-1">
          {onMarkVisited && (
            <button
              onClick={onMarkVisited}
              aria-label={`Đánh dấu đã đi: ${place.name}`}
              title="Đã đi rồi"
              className="p-2 rounded-full hover:bg-sage/15 text-sage-dark"
            >
              <Check size={15} />
            </button>
          )}
          <button
            onClick={onDelete}
            aria-label={`Xoá ${place.name}`}
            className="p-2 rounded-full hover:bg-coral/10 text-coral"
          >
            <Trash2 size={15} />
          </button>
        </div>
        {extraBadge}
      </div>
    </div>
  );
}
