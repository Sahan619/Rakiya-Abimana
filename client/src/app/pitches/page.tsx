"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, PlusCircle, MapPin, DollarSign, Tag, Users, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import { VerifiedBadge } from "../../components/VerifiedBadge";
import { MachineTranslationNotice } from "../../components/MachineTranslationNotice";

export default function PitchesPage() {
  const { user, isEntrepreneur, isFunder } = useAuth();
  const { t, locale } = useLanguage();

  const [pitches, setPitches] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [fundingType, setFundingType] = useState("");
  const [loading, setLoading] = useState(true);

  // Translation toggles: { [pitchId]: boolean }
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get("/master/districts").then((res) => {
      if (res?.districts) setDistricts(res.districts);
    });
    fetchPitches();
  }, [locale]);

  const fetchPitches = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (selectedDistrict) q.append("districtId", selectedDistrict);
      if (fundingType) q.append("fundingType", fundingType);
      q.append("lang", locale);

      const res = await api.get(`/pitches?${q.toString()}`);
      if (res?.pitches) setPitches(res.pitches);
    } catch (err) {
      console.error("Failed to load pitches", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOriginal = (pitchId: string) => {
    setShowOriginalMap((prev) => ({ ...prev, [pitchId]: !prev[pitchId] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="text-teal-700" size={26} />
            <span>{t("pitches.title", "Micro-Business Funding Pitches")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            {t("pitches.subtitle", "Discover grassroots Sri Lankan micro-businesses seeking micro-loans and grants. No money movement takes place on this platform.")}
          </p>
        </div>

        {isEntrepreneur && (
          <Link
            href="/pitches/create"
            className="inline-flex items-center space-x-2 bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow transition"
          >
            <PlusCircle size={18} />
            <span>{t("nav.createPitch", "Start a Pitch")}</span>
          </Link>
        )}
      </div>

      {/* District & Type Filter (Funders browse by district!) */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
            }}
            className="px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white"
          >
            <option value="">{t("common.allDistricts", "All 25 Districts")}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {locale === "si" ? d.nameSi : locale === "ta" ? d.nameTa : d.nameEn}
              </option>
            ))}
          </select>

          <select
            value={fundingType}
            onChange={(e) => setFundingType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white"
          >
            <option value="">All Funding Types</option>
            <option value="MICRO_LOAN">Micro-Loan</option>
            <option value="GRANT">Grant</option>
          </select>
        </div>

        <button
          type="button"
          onClick={fetchPitches}
          className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm"
        >
          Filter Pitches
        </button>
      </div>

      {/* Pitches Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading verified micro-business pitches...</div>
      ) : pitches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <TrendingUp className="mx-auto text-gray-300 mb-2" size={40} />
          <p className="font-bold text-gray-700">No verified pitches match this filter.</p>
          <p className="text-gray-400 text-xs mt-1">Try selecting all districts to see available proposals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pitches.map((pitch) => {
            const isOriginal = showOriginalMap[pitch.id];
            const titleToDisplay = isOriginal ? pitch.originalTitle : pitch.title;
            const storyToDisplay = isOriginal ? pitch.originalStory : pitch.story;

            return (
              <div
                key={pitch.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-block bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold px-2 py-0.5 rounded uppercase">
                          {pitch.fundingType === "MICRO_LOAN" ? "Micro-Loan" : "Grant"}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">
                          {pitch.sector?.nameEn || "Grassroots"}
                        </span>
                      </div>
                      <h2 className="font-bold text-base sm:text-lg text-gray-900 mt-2 leading-snug">
                        {titleToDisplay}
                      </h2>
                    </div>
                    <VerifiedBadge isVerified={pitch.entrepreneur?.isVerified} size="sm" />
                  </div>

                  <MachineTranslationNotice
                    isMachineTranslated={pitch.isMachineTranslated}
                    showOriginal={!!isOriginal}
                    onToggle={() => toggleOriginal(pitch.id)}
                    sourceLanguage={pitch.sourceLanguage}
                  />

                  <div className="mt-2 text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center space-x-1">
                      <MapPin size={14} className="text-gray-400" />
                      <span>{pitch.district?.nameEn} District</span>
                    </span>
                    <span className="flex items-center space-x-1 text-teal-800 font-bold">
                      <DollarSign size={14} />
                      <span>Seeking: Rs. {pitch.fundingNeeded?.toLocaleString()}</span>
                    </span>
                    <span className="text-gray-400">
                      {pitch._count?.interests || 0} pledges
                    </span>
                  </div>

                  {storyToDisplay && (
                    <p className="text-gray-600 text-xs mt-2.5 line-clamp-3 leading-relaxed">
                      {storyToDisplay}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={`/pitches/${pitch.id}`}
                    className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-2 rounded-lg shadow-sm"
                  >
                    View Pitch & Pledge
                  </Link>
                  <span className="text-[11px] text-gray-400">
                    {new Date(pitch.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

