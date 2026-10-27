import { supabase } from "@/lib/supabase";
import type { CoupleProfile } from "@/lib/types";

// Lưu bản dữ liệu lần trước trên máy này để lần sau mở app là thấy nội dung ngay,
// trong lúc dữ liệu mới vẫn được tải ngầm phía sau.
const PREFIX = "cache:v1:";

export function readCache<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    return null;
  }
}

export function writeCache(key: string, data: unknown) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch (e) {
    // đầy bộ nhớ hoặc chế độ riêng tư: bỏ qua, app vẫn chạy bình thường
  }
}

// Nhiều chỗ cùng cần hồ sơ 2 người (đầu trang, đếm ngày...): gộp thành 1 lần gọi
let profileInflight: Promise<CoupleProfile | null> | null = null;

export function loadProfile(): Promise<CoupleProfile | null> {
  if (!profileInflight) {
    profileInflight = (async () => {
      const { data, error } = await supabase
        .from("couple_profile")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        writeCache("profile", data);
        return data as CoupleProfile;
      }
      return null;
    })().finally(() => {
      profileInflight = null;
    });
  }
  return profileInflight;
}
