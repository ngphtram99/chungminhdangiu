export type PlaceStatus = "visited" | "want_to_go" | "not_yet";

export interface Place {
  id: string;
  name: string;
  address: string;
  maps_link: string | null;
  status: PlaceStatus;
  visited_date: string | null;
  rating: number | null;
  notes: string | null;
  photo_links: string[];
  added_by: string | null;
  created_at: string;
}

export const STATUS_LABEL: Record<PlaceStatus, string> = {
  visited: "Đã đi",
  want_to_go: "Muốn đi",
  not_yet: "Chưa đi",
};

export const STATUS_COLOR: Record<PlaceStatus, string> = {
  visited: "bg-sage text-paper",
  want_to_go: "bg-coral text-paper",
  not_yet: "bg-mustard text-ink",
};

export interface CoupleProfile {
  id: string;
  partner1_name: string;
  partner1_avatar_url: string | null;
  partner2_name: string;
  partner2_avatar_url: string | null;
  anniversary_date: string | null;
  updated_at: string;
}
