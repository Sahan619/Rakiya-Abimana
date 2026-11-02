"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  TrendingUp,
  MapPin,
  Search,
  ShieldCheck,
  CheckCircle,
  Users,
  Building2,
  DollarSign,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { MachineTranslationNotice } from "../components/MachineTranslationNotice";

export default function HomePage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load master districts
    api.get("/master/districts")
      .then((res) => {
        if (res && res.districts) setDistricts(res.districts);
      })
      .catch(() => {});

    fetchJobs();
  }, [locale]);

  const fetchJobs = async (districtId = "", search = "") => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (districtId) queryParams.append("districtId", districtId);
      if (search) queryParams.append("search", search);
      queryParams.append("lang", locale);

      const res = await api.get(`/jobs?${queryParams.toString()}`);
      if (res && res.jobs) {
        setJobs(res.jobs);
      }
    } catch (err) {
      console.error("Error loading jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(selectedDistrict, searchTerm);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner with Big Accessible CTA Buttons */}
      <section className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-emerald-700/60 border border-emerald-500/40 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
            <span>🇱🇰 Sri Lanka National Workforce & Micro-Enterprise Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-snug">
            {t("common.platformTitle", "Jobs & Micro-Business Funding Platform")}
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            {t("common.slogan", "Empowering Sri Lankan Workers & Local Entrepreneurs")} — Find verified local employment, discover nearby jobs by distance, and connect grass-roots micro-businesses with ethical funders.
          </p>

          {/* Big Action Buttons (Optimized for Low-Literacy / Mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <Link
              href="/jobs"
              className="flex items-center justify-center space-x-2 bg-white text-emerald-900 font-bold px-5 py-3.5 rounded-xl shadow hover:bg-emerald-50 text-base transition-transform active:scale-95"
            >
              <Briefcase className="text-emerald-700" size={22} />
              <span>{t("nav.jobs", "Browse Jobs")}</span>
            </Link>

            <Link
              href="/nearby"
              className="flex items-center justify-center space-x-2 bg-emerald-600 text-white font-bold px-5 py-3.5 rounded-xl shadow hover:bg-emerald-500 text-base transition-transform active:scale-95"
            >
              <MapPin size={22} />
              <span>{t("nav.nearbyJobs", "Nearby Jobs (GPS)")}</span>
            </Link>

            <Link
              href="/pitches"
              className="flex items-center justify-center space-x-2 bg-teal-700 text-white font-bold px-5 py-3.5 rounded-xl shadow hover:bg-teal-600 text-base transition-transform active:scale-95"
            >
              <TrendingUp size={22} />
              <span>{t("nav.pitches", "Micro-Funding")}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Verification Highlight Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-start space-x-3 shadow-sm">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm sm:text-base">Identity & DOB Verified</h2>
            <p className="text-gray-600 text-xs mt-0.5">Automated NIC format & date of birth check with Grama Niladhari proof.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-start space-x-3 shadow-sm">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-lg">
            <MapPin size={24} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm sm:text-base">All 25 Districts Covered</h2>
            <p className="text-gray-600 text-xs mt-0.5">Haversine formula geospatial matching finds opportunities right in your neighborhood.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-start space-x-3 shadow-sm">
          <div className="p-2.5 bg-purple-100 text-purple-800 rounded-lg">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm sm:text-base">Trilingual Translation</h2>
            <p className="text-gray-600 text-xs mt-0.5">Automated in-app translation into Sinhala, Tamil, and English.</p>
          </div>
        </div>
      </section>

      {/* Job Search & Filter Bar */}
      <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Briefcase className="text-primary-600" size={20} />
            <span>{t("jobs.title", "Available Jobs Across Sri Lanka")}</span>
          </h2>
          {!user && (
            <span className="text-xs bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-medium">
              {t("jobs.guestNotice", "Guests see limited information. Sign in to apply.")}
            </span>
          )}
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t("jobs.searchPlaceholder", "Search jobs by title or skills...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                fetchJobs(e.target.value, searchTerm);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="">{t("common.allDistricts", "All 25 Districts")}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {locale === "si" ? d.nameSi : locale === "ta" ? d.nameTa : d.nameEn} ({d.province})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-4 rounded-lg text-sm shadow transition"
            >
              {t("common.search", "Search")}
            </button>
          </div>
        </form>
      </section>

      {/* Jobs Listing Grid */}
      <section className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500 font-medium">
            {t("common.loading", "Loading jobs across Sri Lanka...")}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Briefcase className="mx-auto text-gray-300 mb-2" size={36} />
            <p className="text-gray-600 font-semibold">No job listings found for the selected filter.</p>
            <p className="text-gray-400 text-xs mt-1">Try selecting another district or removing search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block bg-primary-50 text-primary-800 border border-primary-200 text-xs font-bold px-2.5 py-0.5 rounded uppercase">
                        {job.category}
                      </span>
                      <h3 className="font-bold text-lg text-gray-900 mt-1.5 leading-snug">
                        {job.title}
                      </h3>
                    </div>
                    <VerifiedBadge isVerified={job.employer?.isVerified} size="sm" />
                  </div>

                  {job.isMachineTranslated && (
                    <span className="inline-block text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1">
                      {t("common.machineTranslated", "Machine Translated")}
                    </span>
                  )}

                  <div className="mt-3 text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center space-x-1">
                      <Building2 size={14} className="text-gray-400" />
                      <span className="font-medium">{job.employer?.companyName}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin size={14} className="text-gray-400" />
                      <span>{job.district?.nameEn || "Sri Lanka"}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-emerald-800 font-bold">
                      <DollarSign size={14} />
                      <span>
                        Rs. {job.wage?.toLocaleString()} / {job.wageType}
                      </span>
                    </span>
                  </div>

                  {job.description && (
                    <p className="text-gray-600 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {job.guestRestricted ? (
                    <Link
                      href="/login"
                      className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center space-x-1"
                    >
                      <span>{t("jobs.signInToApply", "Sign in as Job Seeker to apply")}</span>
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-3.5 py-2 rounded-lg transition"
                    >
                      {t("jobs.applyNow", "View & Apply")}
                    </Link>
                  )}
                  <span className="text-[11px] text-gray-400">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

