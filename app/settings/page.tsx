"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Languages, Check } from "lucide-react";

type Theme = "light" | "dark";
type Language = "vi" | "en";

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme | null) || "light";
    const savedLang = (localStorage.getItem("language") as Language | null) || "vi";
    setTheme(savedTheme);
    setLanguage(savedLang);
    setMounted(true);
  }, []);

  function applyTheme(next: Theme) {
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function applyLanguage(next: Language) {
    setLanguage(next);
    localStorage.setItem("language", next);
  }

  if (!mounted) return null;

  return (
    <main className="w-full max-w-2xl mx-auto px-4 sm:px-8 pt-6 sm:pt-16 pb-8">
      <h1 className="font-display italic text-2xl sm:text-4xl font-semibold text-ink mb-6 sm:mb-10 text-center">
        Cài đặt
      </h1>

      <section className="paper-card rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] p-5 sm:p-7 mb-5 sm:mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sun size={18} className="text-coral-dark" />
          <h2 className="font-display italic text-lg sm:text-xl text-ink">
            Giao diện
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => applyTheme("light")}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-medium transition-colors ${
              theme === "light"
                ? "bg-ink text-paper border-ink"
                : "border-charcoal/20 text-charcoal/70 hover:border-ink"
            }`}
          >
            <Sun size={16} />
            Sáng
            {theme === "light" && <Check size={14} />}
          </button>
          <button
            onClick={() => applyTheme("dark")}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-medium transition-colors ${
              theme === "dark"
                ? "bg-ink text-paper border-ink"
                : "border-charcoal/20 text-charcoal/70 hover:border-ink"
            }`}
          >
            <Moon size={16} />
            Tối
            {theme === "dark" && <Check size={14} />}
          </button>
        </div>
      </section>

      <section className="paper-card rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_#1A1A1A] p-5 sm:p-7">
        <div className="flex items-center gap-2 mb-4">
          <Languages size={18} className="text-coral-dark" />
          <h2 className="font-display italic text-lg sm:text-xl text-ink">
            Ngôn ngữ
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => applyLanguage("vi")}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-medium transition-colors ${
              language === "vi"
                ? "bg-ink text-paper border-ink"
                : "border-charcoal/20 text-charcoal/70 hover:border-ink"
            }`}
          >
            Tiếng Việt
            {language === "vi" && <Check size={14} />}
          </button>
          <button
            onClick={() => applyLanguage("en")}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-medium transition-colors ${
              language === "en"
                ? "bg-ink text-paper border-ink"
                : "border-charcoal/20 text-charcoal/70 hover:border-ink"
            }`}
          >
            English
            {language === "en" && <Check size={14} />}
          </button>
        </div>
        <p className="text-xs text-charcoal/50 mt-3">
          Hiện chỉ lưu lựa chọn — nội dung các trang sẽ được dịch dần ở bản cập nhật sau.
        </p>
      </section>
    </main>
  );
}
