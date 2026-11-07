"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, Trash2, Plus, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";
import { readCache, loadProfile } from "@/lib/cache";
import type { CoupleProfile } from "@/lib/types";

type Who = "partner1" | "partner2";

interface Reminder {
  id: string;
  title: string;
  remind_time: string;
  days: number[] | null;
  target: Who;
  created_by: Who | null;
  enabled: boolean;
}

// 1 = thứ hai ... 7 = chủ nhật
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function ReminderManager() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [me, setMe] = useState<Who | null>(null);
  const [names, setNames] = useState({ partner1: "", partner2: "" });
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("08:00");
  const [target, setTarget] = useState<Who>("partner2");
  const [days, setDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("push_who");
    if (saved === "partner1" || saved === "partner2") {
      setMe(saved);
      setTarget(saved === "partner1" ? "partner2" : "partner1");
    }
    const cached = readCache<CoupleProfile>("profile");
    if (cached) setNames({ partner1: cached.partner1_name, partner2: cached.partner2_name });
    loadProfile().then((p) => {
      if (p) setNames({ partner1: p.partner1_name, partner2: p.partner2_name });
    });
    fetchReminders();
  }, []);

  async function fetchReminders() {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .order("remind_time", { ascending: true });
    if (!error && data) setReminders(data as Reminder[]);
  }

  function nameOf(w: Who) {
    return names[w] || t(w === "partner1" ? "Bạn" : "Người yêu");
  }

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function startEdit(r: Reminder) {
    setEditingId(r.id);
    setTitle(r.title);
    setTime(r.remind_time.slice(0, 5));
    setTarget(r.target);
    setDays(r.days ?? []);
    setError(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setDays([]);
    setError(null);
  }

  async function saveReminder() {
    setError(null);
    if (!editingId && !me) {
      setError(t("Hãy chọn “Máy này là của ai?” ở phần Thông báo trước nhé."));
      return;
    }
    if (!title.trim()) {
      setError(t("Nhập nội dung lời nhắc nhé."));
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      remind_time: time,
      days: days.length > 0 ? [...days].sort() : null,
      target,
    };
    let failed = false;
    if (editingId) {
      const old = reminders.find((x) => x.id === editingId);
      const timeChanged = !old || old.remind_time.slice(0, 5) !== time;
      // Đổi giờ thì cho phép nhắc lại trong hôm nay nếu giờ mới chưa tới
      const { error } = await supabase
        .from("reminders")
        .update(timeChanged ? { ...payload, last_sent_on: null } : payload)
        .eq("id", editingId);
      failed = !!error;
    } else {
      const { error } = await supabase.from("reminders").insert({ ...payload, created_by: me });
      failed = !!error;
    }
    setSaving(false);
    if (failed) {
      setError(t("Không lưu được lời nhắc. Thử lại nhé."));
      return;
    }
    setEditingId(null);
    setTitle("");
    setDays([]);
    fetchReminders();
  }

  async function setEnabled(r: Reminder, enabled: boolean) {
    setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled } : x)));
    await supabase.from("reminders").update({ enabled }).eq("id", r.id);
  }

  async function remove(r: Reminder) {
    setReminders((prev) => prev.filter((x) => x.id !== r.id));
    await supabase.from("reminders").delete().eq("id", r.id);
  }

  const chip = (active: boolean) =>
    `px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-colors ${
      active
        ? "bg-ink text-paper border-ink"
        : "border-charcoal/20 text-charcoal/70 hover:border-ink"
    }`;

  const field =
    "w-full rounded-lg border-2 border-charcoal/20 bg-transparent px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink";

  return (
    <section className="paper-card rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] p-5 sm:p-7 mt-5 sm:mt-6">
      <div className="flex items-center gap-2 mb-4">
        <BellRing size={18} className="text-coral-dark" />
        <h2 className="font-display italic text-lg sm:text-xl text-ink">{t("Lời nhắc")}</h2>
      </div>

      {reminders.length === 0 ? (
        <p className="text-sm text-charcoal/60 mb-4">{t("Chưa có lời nhắc nào.")}</p>
      ) : (
        <ul className="flex flex-col gap-2 mb-4">
          {reminders.map((r) => (
            <li
              key={r.id}
              className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2 ${
                editingId === r.id ? "border-ink" : "border-charcoal/15"
              } ${r.enabled ? "" : "opacity-50"}`}
            >
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={(e) => setEnabled(r, e.target.checked)}
                aria-label={t("Bật/tắt lời nhắc")}
                className="w-4 h-4 accent-current"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{r.title}</p>
                <p className="text-xs text-charcoal/60">
                  {r.remind_time.slice(0, 5)} ·{" "}
                  {r.days && r.days.length > 0
                    ? r.days.map((d) => t(DAY_LABELS[d - 1])).join(", ")
                    : t("Mỗi ngày")}{" "}
                  · {t("Nhắc {name}", { name: nameOf(r.target) })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(r)}
                aria-label={t("Sửa lời nhắc")}
                className="p-1.5 text-charcoal/50 hover:text-ink transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => remove(r)}
                aria-label={t("Xoá lời nhắc")}
                className="p-1.5 text-charcoal/50 hover:text-ink transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div ref={formRef} className="flex flex-col gap-3">
        {editingId && (
          <p className="text-xs font-medium text-coral-dark">{t("Đang sửa lời nhắc")}</p>
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("Vd: Uống thuốc nha")}
          className={field}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-charcoal/70">
            {t("Giờ nhắc")}
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-charcoal/70">
            {t("Nhắc cho ai?")}
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as Who)}
              className={field}
            >
              <option value="partner1">{nameOf("partner1")}</option>
              <option value="partner2">{nameOf("partner2")}</option>
            </select>
          </label>
        </div>

        <div>
          <p className="text-xs font-medium text-charcoal/70 mb-1.5">{t("Lặp lại")}</p>
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(i + 1)}
                className={chip(days.includes(i + 1))}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <p className="text-xs text-charcoal/50 mt-1.5">
            {t("Không chọn ngày nào = nhắc mỗi ngày.")}
          </p>
        </div>

        {error && <p className="text-xs text-coral-dark">{error}</p>}

        <button
          type="button"
          onClick={saveReminder}
          disabled={saving}
          className="flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-medium bg-ink text-paper border-ink disabled:opacity-60"
        >
          {editingId ? <Pencil size={16} /> : <Plus size={16} />}
          {saving ? t("Đang lưu...") : editingId ? t("Lưu thay đổi") : t("Thêm lời nhắc")}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="flex items-center justify-center py-3 rounded-lg border-2 font-medium border-charcoal/20 text-charcoal/70 hover:border-ink transition-colors"
          >
            {t("Huỷ")}
          </button>
        )}

        <p className="text-xs text-charcoal/50">
          {t("Lời nhắc hiện thành thông báo trên điện thoại người nhận, nên họ cần bật thông báo ở phần trên.")}{" "}
          {t("Giờ tính theo giờ Việt Nam (GMT+7).")}
        </p>
      </div>
    </section>
  );
}
