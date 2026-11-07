import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Được gọi bởi lịch chạy mỗi phút trong Supabase khi đến giờ của một lời nhắc
export async function POST(req: Request) {
  if (req.headers.get("x-webhook-secret") !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ skipped: true });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: r } = await db.from("reminders").select("*").eq("id", id).maybeSingle();
  if (!r || !r.enabled) return NextResponse.json({ skipped: true });

  const { data: profile } = await db
    .from("couple_profile")
    .select("partner1_name, partner2_name")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Người đặt lời nhắc (nếu khác người nhận) để ghi "X nhắc bạn"
  let fromName: string | null = null;
  if (r.created_by && r.created_by !== r.target) {
    fromName =
      (r.created_by === "partner1" ? profile?.partner1_name : profile?.partner2_name) || null;
  }

  const { data: subs } = await db.from("push_subscriptions").select("*").eq("who", r.target);
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  webpush.setVapidDetails(
    "mailto:admin@chungminhdangiu.vercel.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const titles = {
    vi: fromName ? `⏰ ${fromName} nhắc bạn` : "⏰ Lời nhắc",
    en: fromName ? `⏰ Reminder from ${fromName}` : "⏰ Reminder",
  };

  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      const lang = s.lang === "en" ? "en" : "vi";
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: titles[lang], body: r.title, url: "/" })
        );
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    })
  );

  return NextResponse.json({ sent });
}
