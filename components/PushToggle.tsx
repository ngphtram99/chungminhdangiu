"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";

type Who = "partner1" | "partner2";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [needInstall, setNeedInstall] = useState(false);
  const [names, setNames] = useState({ partner1: "Người 1", partner2: "Người 2" });
  const [who, setWho] = useState<Who | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!ok) {
      setSupported(false);
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setNeedInstall(true);
      return;
    }

    const saved = localStorage.getItem("push_who") as Who | null;
    if (saved === "partner1" || saved === "partner2") setWho(saved);

    fetch("/api/push/subscribe")
      .then((r) => r.json())
      .then((d) => setNames({ partner1: d.partner1, partner2: d.partner2 }))
      .catch(() => {});

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  function chooseWho(w: Who) {
    setWho(w);
    localStorage.setItem("push_who", w);
  }

  async function enable() {
    if (!who) {
      setMsg("Chọn trước xem bạn là ai nhé.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Bạn chưa cho phép thông báo. Hãy bật trong cài đặt của trình duyệt/điện thoại.");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ) as BufferSource,
        }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ who, subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error("Lưu thất bại");
      setEnabled(true);
      setMsg("Đã bật thông báo ✓");
    } catch (e) {
      setMsg("Không bật được thông báo. Thử lại giúp mình nhé.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
      setMsg("Đã tắt thông báo.");
    } finally {
      setBusy(false);
    }
  }

  const btn = (active: boolean) =>
    `flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-medium transition-colors ${
      active
        ? "bg-ink text-paper border-ink"
        : "border-charcoal/20 text-charcoal/70 hover:border-ink"
    }`;

  return (
    <section className="paper-card rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] p-5 sm:p-7 mt-5 sm:mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={18} className="text-coral-dark" />
        <h2 className="font-display italic text-lg sm:text-xl text-ink">Thông báo</h2>
      </div>

      {!supported ? (
        <p className="text-sm text-charcoal/70">
          {needInstall
            ? "Trên iPhone, hãy bấm nút Chia sẻ của Safari → \"Thêm vào Màn hình chính\", rồi mở web từ icon đó để bật thông báo (cần iOS 16.4 trở lên)."
            : "Trình duyệt này chưa hỗ trợ thông báo đẩy."}
        </p>
      ) : (
        <>
          <p className="text-sm text-charcoal/70 mb-3">Máy này là của ai?</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              disabled={enabled}
              onClick={() => chooseWho("partner1")}
              className={btn(who === "partner1")}
            >
              {names.partner1}
              {who === "partner1" && <Check size={14} />}
            </button>
            <button
              disabled={enabled}
              onClick={() => chooseWho("partner2")}
              className={btn(who === "partner2")}
            >
              {names.partner2}
              {who === "partner2" && <Check size={14} />}
            </button>
          </div>

          {enabled ? (
            <button disabled={busy} onClick={disable} className={btn(false) + " w-full"}>
              <BellOff size={16} />
              Tắt thông báo trên máy này
            </button>
          ) : (
            <button disabled={busy} onClick={enable} className={btn(true) + " w-full"}>
              <Bell size={16} />
              Bật thông báo
            </button>
          )}
        </>
      )}

      {msg && <p className="text-xs text-charcoal/60 mt-3">{msg}</p>}
    </section>
  );
}
