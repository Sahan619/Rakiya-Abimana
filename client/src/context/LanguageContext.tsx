"use client";

import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
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
  setLocaleLocal: (newLocale: string) => void;
  t: (path: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: async () => {},
  setLocaleLocal: () => {},
  t: () => ""
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const setLocaleLocal = useCallback((newLocale: string) => {
    if (newLocale !== "en" && newLocale !== "si" && newLocale !== "ta") return;
    setLocaleState(newLocale);
    localStorage.setItem("preferred_lang", newLocale);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("preferred_lang") as Locale;
    if (saved && (saved === "en" || saved === "si" || saved === "ta")) {
      setLocaleLocal(saved);
    }
  }, [setLocaleLocal]);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleLocal(newLocale);
    try {
      // Sync with user profile on server if user is logged in
      await api.put("/auth/profile", { preferredLanguage: newLocale });
    } catch {
      // Ignore if user is guest
    }
  }, [setLocaleLocal]);

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
    <LanguageContext.Provider value={{ locale, setLocale, setLocaleLocal, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
