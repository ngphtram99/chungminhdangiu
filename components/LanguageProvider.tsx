"use client";

import { Fragment, createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lang, setLang as setModuleLang } from "@/lib/i18n";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };

const LanguageContext = createContext<Ctx>({ lang: "vi", setLang: () => {} });

export function useLanguage() {
  return useContext(LanguageContext);
}

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("vi");

  // Đọc ngôn ngữ đã lưu trên máy này
  useEffect(() => {
    try {
      const saved = localStorage.getItem("language");
      if (saved === "en" || saved === "vi") {
        setModuleLang(saved);
        setLangState(saved);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Lang) {
    setModuleLang(l);
    setLangState(l);
    try {
      localStorage.setItem("language", l);
    } catch (e) {}
  }

  // key={lang}: đổi ngôn ngữ thì vẽ lại toàn bộ giao diện
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <Fragment key={lang}>{children}</Fragment>
    </LanguageContext.Provider>
  );
}
