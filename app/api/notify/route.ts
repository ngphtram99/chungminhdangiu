import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, any> | null;
  who?: string | null;
};

function describe(table: string, type: string, r: Record<string, any>) {
  const isNew = type === "INSERT";
  if (table === "places") {
    return {
      title: isNew ? "Địa điểm mới 📍" : "Địa điểm vừa được sửa ✏️",
      body: r.name || "",
      author: r.added_by,
    };
  }
  if (table === "calendar_notes") {
    return {
      title: isNew ? "Ghi chú lịch mới 📅" : "Ghi chú lịch vừa được sửa ✏️",
      body: `${r.note_date || ""}: ${String(r.content || "").slice(0, 80)}`,
      author: r.created_by,
    };
  }
  if (table === "couple_photos") {
    return {
      title: isNew ? "Ảnh mới 📷" : "Ảnh vừa được sửa ✏️",
      body: r.caption || "Có ảnh mới trong album",
      author: r.uploaded_by,
    };
  }
  return null;
}

export async function POST(req: Request) {
  if (req.headers.get("x-webhook-secret") !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as Payload;
  if (!payload.record || payload.type === "DELETE") {
    return NextResponse.json({ skipped: true });
  }
  const info = describe(payload.table, payload.type, payload.record);
  if (!info) return NextResponse.json({ skipped: true });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Đoán người vừa sửa dựa trên cột added_by / created_by / uploaded_by
  const { data: profile } = await db
    .from("couple_profile")
    .select("partner1_name, partner2_name")
    .limit(1)
    .maybeSingle();

  const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();
  const author = norm(info.author);
  let authorWho: "partner1" | "partner2" | null = null;
  // Ưu tiên: thiết bị tự gửi kèm "máy này là của ai" (header x-push-who)
  if (payload.who === "partner1" || payload.who === "partner2") {
    authorWho = payload.who;
  } else if (author && profile) {
    // Dự phòng: đoán qua tên ở cột added_by / created_by / uploaded_by
    if (author === norm(profile.partner1_name)) authorWho = "partner1";
    else if (author === norm(profile.partner2_name)) authorWho = "partner2";
  }

  let query = db.from("push_subscriptions").select("*");
  if (authorWho) {
    // Chỉ gửi cho người còn lại
    query = query.eq("who", authorWho === "partner1" ? "partner2" : "partner1");
  }
  const { data: subs } = await query;
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  webpush.setVapidDetails(
    "mailto:admin@chungminhdangiu.vercel.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const message = JSON.stringify({
    title: info.title,
    body: info.body,
    url: "/",
  });

  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          message
        );
        sent++;
      } catch (err: any) {
        // Thiết bị đã gỡ quyền / hết hạn thì xóa khỏi bảng
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    })
  );

  return NextResponse.json({ sent });
}
