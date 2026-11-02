"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const languages = [
    { code: "en", label: "English", short: "EN" },
    { code: "si", label: "සිංහල", short: "සිං" },
    { code: "ta", label: "தமிழ்", short: "தமி" }
  ];

  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 border border-gray-300">
      <Globe size={16} className="text-gray-500 ml-1 mr-0.5 hidden sm:inline" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setLocale(lang.code as any)}
          className={`px-2.5 py-1 text-xs sm:text-sm font-semibold rounded transition-colors ${
            locale === lang.code
              ? "bg-primary-700 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          title={lang.label}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

