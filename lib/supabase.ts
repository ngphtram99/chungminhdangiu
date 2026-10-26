import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY. Xem README.md để cấu hình."
  );
}

// Mỗi request gửi lên Supabase đều đính kèm "máy này là của ai"
// (lựa chọn trong Cài đặt > Thông báo) để server biết ai vừa sửa.
function fetchWithWho(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  try {
    if (typeof window !== "undefined") {
      const who = window.localStorage.getItem("push_who");
      if (who === "partner1" || who === "partner2") {
        headers.set("x-push-who", who);
      }
    }
  } catch (e) {}
  return fetch(input, { ...init, headers });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithWho },
});
