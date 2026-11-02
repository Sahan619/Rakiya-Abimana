"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  DollarSign,
  PlusCircle,
  Filter,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import { VerifiedBadge } from "../../components/VerifiedBadge";
import { MachineTranslationNotice } from "../../components/MachineTranslationNotice";

export default function JobsPage() {
  const { user, isEmployer } = useAuth();
  const { t, locale } = useLanguage();

  const [jobs, setJobs] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [minWage, setMinWage] = useState("");
  const [loading, setLoading] = useState(true);

  // Translation toggles per job: { [jobId]: boolean }
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get("/master/districts").then((res) => {
      if (res?.districts) setDistricts(res.districts);
    });
    api.get("/master/categories").then((res) => {
      if (res?.categories) setCategories(res.categories);
    });
    fetchJobs();
  }, [locale]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (selectedDistrict) q.append("districtId", selectedDistrict);
      if (selectedCategory) q.append("category", selectedCategory);
      if (search) q.append("search", search);
      if (minWage) q.append("minWage", minWage);
      q.append("lang", locale);

      const res = await api.get(`/jobs?${q.toString()}`);
      if (res?.jobs) setJobs(res.jobs);
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOriginal = (jobId: string) => {
    setShowOriginalMap((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Briefcase className="text-primary-700" size={26} />
            <span>{t("jobs.title", "Available Jobs Across Sri Lanka")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Search verified employment opportunities filtered by district, trade, and wage.
          </p>
        </div>

        {isEmployer && (
          <Link
            href="/jobs/post"
            className="inline-flex items-center space-x-2 bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow transition"
          >
            <PlusCircle size={18} />
            <span>{t("nav.postJob", "Post a New Job")}</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={17} />
            <input
              type="text"
              placeholder={t("jobs.searchPlaceholder", "Search title or skills...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">{t("common.allDistricts", "All Districts")}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {locale === "si" ? d.nameSi : locale === "ta" ? d.nameTa : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">{t("common.allCategories", "All Categories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="number"
              placeholder="Min Wage (LKR)"
              value={minWage}
              onChange={(e) => setMinWage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setSelectedDistrict("");
              setSelectedCategory("");
              setSearch("");
              setMinWage("");
              fetchJobs();
            }}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={fetchJobs}
            className="px-4 py-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white rounded-lg shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <Briefcase className="mx-auto text-gray-300 mb-2" size={40} />
          <p className="font-bold text-gray-700">No jobs match your filter criteria.</p>
          <p className="text-gray-400 text-xs mt-1">Try clearing your search query or choosing another district.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const isOriginal = showOriginalMap[job.id];
            const titleToDisplay = isOriginal ? job.originalTitle : job.title;
            const descToDisplay = isOriginal ? job.originalDescription : job.description;

            return (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block bg-primary-50 text-primary-800 border border-primary-200 text-xs font-bold px-2.5 py-0.5 rounded uppercase">
                        {job.category}
                      </span>
                      <h2 className="font-bold text-lg text-gray-900 mt-1.5 leading-snug">
                        {titleToDisplay}
                      </h2>
                    </div>
                    <VerifiedBadge isVerified={job.employer?.isVerified} size="sm" />
                  </div>

                  <MachineTranslationNotice
                    isMachineTranslated={job.isMachineTranslated}
                    showOriginal={!!isOriginal}
                    onToggle={() => toggleOriginal(job.id)}
                    sourceLanguage={job.sourceLanguage}
                  />

                  <div className="mt-2 text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center space-x-1">
                      <Building2 size={14} className="text-gray-400" />
                      <span className="font-semibold text-gray-800">{job.employer?.companyName}</span>
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

                  {descToDisplay && (
                    <p className="text-gray-600 text-xs mt-2.5 line-clamp-3 leading-relaxed">
                      {descToDisplay}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {job.guestRestricted ? (
                    <Link
                      href="/login"
                      className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center space-x-1"
                    >
                      <span>Sign in to view details & apply</span>
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-3.5 py-2 rounded-lg shadow-sm"
                    >
                      View & Apply
                    </Link>
                  )}
                  <span className="text-[11px] text-gray-400">
                    {new Date(job.createdAt).toLocaleDateString()}
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

