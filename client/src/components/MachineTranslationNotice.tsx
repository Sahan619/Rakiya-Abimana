"use client";

import React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface MachineTranslationNoticeProps {
  isMachineTranslated?: boolean;
  showOriginal: boolean;
  onToggle: () => void;
  sourceLanguage?: string;
}

export function MachineTranslationNotice({
  isMachineTranslated,
  showOriginal,
  onToggle,
  sourceLanguage = "en"
}: MachineTranslationNoticeProps) {
  const { t } = useLanguage();

  if (!isMachineTranslated) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md text-xs text-amber-900 my-2">
      <div className="flex items-center space-x-1.5">
        <Languages size={15} className="text-amber-700" />
        <span className="font-medium">
          {t("common.machineTranslated", "Machine Translated")} ({sourceLanguage.toUpperCase()})
        </span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="font-bold underline text-amber-950 hover:text-black ml-2"
      >
        {showOriginal
          ? t("common.viewTranslated", "View Translated")
          : t("common.viewOriginal", "View Original")}
      </button>
    </div>
  );
}

