import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Lấy tên 2 người để hiện trong nút chọn "Tui là ..."
export async function GET() {
  const { data } = await admin()
    .from("couple_profile")
    .select("partner1_name, partner2_name")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return NextResponse.json({
    partner1: data?.partner1_name || "Người 1",
    partner2: data?.partner2_name || "Người 2",
  });
}

// Lưu địa chỉ nhận thông báo của 1 thiết bị
export async function POST(req: Request) {
  const { who, subscription, lang } = await req.json();
  if (
    (who !== "partner1" && who !== "partner2") ||
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const { error } = await admin()
    .from("push_subscriptions")
    .upsert(
      {
        who,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        lang: lang === "en" ? "en" : "vi",
      },
      { onConflict: "endpoint" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Tắt thông báo trên thiết bị này
export async function DELETE(req: Request) {
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "Thiếu endpoint" }, { status: 400 });
  await admin().from("push_subscriptions").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
