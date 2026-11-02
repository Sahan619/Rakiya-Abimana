"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import enMessages from "../../messages/en.json";
import siMessages from "../../messages/si.json";
import taMessages from "../../messages/ta.json";
import { api } from "../lib/api";

type Locale = "en" | "si" | "ta";

const messagesMap: Record<Locale, any> = {
  en: enMessages,
  si: siMessages,
  ta: taMessages
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => Promise<void>;
  t: (path: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: async () => {},
  t: () => ""
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_lang") as Locale;
    if (saved && (saved === "en" || saved === "si" || saved === "ta")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("preferred_lang", newLocale);
    try {
      // Sync with user profile on server if user is logged in
      await api.put("/auth/profile", { preferredLanguage: newLocale });
    } catch {
      // Ignore if user is guest
    }
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current = messagesMap[locale] || messagesMap.en;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let enCurrent = messagesMap.en;
        for (const enKey of keys) {
          if (enCurrent && typeof enCurrent === "object" && enKey in enCurrent) {
            enCurrent = enCurrent[enKey];
          } else {
            return fallback || path;
          }
        }
        return typeof enCurrent === "string" ? enCurrent : fallback || path;
      }
    }

    return typeof current === "string" ? current : fallback || path;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

