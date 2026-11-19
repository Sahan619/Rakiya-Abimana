
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useTranslation } from "react-i18next";
import i18n from "../lib/i18n";
import { api } from "../lib/api";

type Locale = "en" | "si" | "ta";

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
  t: (path) => path,
});

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const { t: translate } = useTranslation();

  const setLocaleLocal = useCallback((newLocale: string) => {
    if (!["en", "si", "ta"].includes(newLocale)) return;

    const selectedLocale = newLocale as Locale;

    setLocaleState(selectedLocale);
    localStorage.setItem("preferred_lang", selectedLocale);

    void i18n.changeLanguage(selectedLocale);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("preferred_lang");

    if (saved && ["en", "si", "ta"].includes(saved)) {
      setLocaleLocal(saved);
    } else {
      void i18n.changeLanguage("en");
    }
  }, [setLocaleLocal]);

  const setLocale = useCallback(
    async (newLocale: Locale) => {
      setLocaleLocal(newLocale);

      try {
        await api.put("/auth/profile", {
          preferredLanguage: newLocale,
        });
      } catch {
        // Ignore errors when the user is not logged in.
      }
    },
    [setLocaleLocal]
  );

  const t = useCallback(
    (path: string, fallback?: string): string => {
      return String(
        translate(path, {
          defaultValue: fallback || path,
        })
      );
    },
    [translate]
  );

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, setLocaleLocal, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
