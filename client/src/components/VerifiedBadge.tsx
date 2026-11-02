"use client";

import React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface VerifiedBadgeProps {
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function VerifiedBadge({
  isVerified,
  size = "md",
  showLabel = true
}: VerifiedBadgeProps) {
  const { t } = useLanguage();

  if (!isVerified) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2 font-medium"
  };

  const iconSizes = {
    sm: 13,
    md: 16,
    lg: 18
  };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold shadow-sm ${sizeClasses[size]}`}
      title="Verified Sri Lankan Citizen / Registered Business"
    >
      <ShieldCheck size={iconSizes[size]} className="text-emerald-700 flex-shrink-0" />
      {showLabel && <span>{t("common.verified", "Verified")}</span>}
    </span>
  );
}

