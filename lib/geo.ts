export const HCMC_DISTRICTS = [
  "Thủ Đức",
  "Quận 1",
  "Quận 3",
  "Quận 4",
  "Quận 5",
  "Quận 6",
  "Quận 7",
  "Quận 8",
  "Quận 10",
  "Quận 11",
  "Quận 12",
  "Bình Tân",
  "Bình Thạnh",
  "Gò Vấp",
  "Phú Nhuận",
  "Tân Bình",
  "Tân Phú",
  "Khác",
];

export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Cố gắng lấy toạ độ trực tiếp từ link Google Maps, nếu link đó có
 * chứa dạng "@lat,lng" (loại link phổ biến khi chia sẻ vị trí trên bản đồ).
 * Trả về null nếu không tìm thấy (ví dụ link chỉ chứa mã định danh nội bộ).
 */
export function extractLatLngFromMapsLink(
  link: string | null
): { lat: number; lng: number } | null {
  if (!link) return null;
  const match = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}
