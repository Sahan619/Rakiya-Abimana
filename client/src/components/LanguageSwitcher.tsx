"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const languages = [
    { code: "en", label: "English" },
    { code: "si", label: "සිංහල" },
    { code: "ta", label: "தமிழ்" }
  ];

  return (
    <label className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-slate-500 transition hover:border-slate-300">
      <Globe size={16} aria-hidden="true" />
      <span className="sr-only">Choose language</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as "en" | "si" | "ta")}
        className="max-w-[5.5rem] cursor-pointer border-0 bg-transparent pr-1 text-xs font-semibold text-slate-700 outline-none sm:max-w-none sm:text-sm"
        aria-label="Choose language"
      >
        {languages.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
      </select>
    </label>
  );
}
