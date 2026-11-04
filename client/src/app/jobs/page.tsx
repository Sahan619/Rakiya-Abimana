"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  FilterX,
  MapPin,
  Search,
  SlidersHorizontal,
  Wallet
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import { VerifiedBadge } from "../../components/VerifiedBadge";
import { MachineTranslationNotice } from "../../components/MachineTranslationNotice";

interface District {
  id: string;
  nameEn: string;
  nameSi: string;
  nameTa: string;
  province: string;
}

interface Category {
  id: string;
  nameEn: string;
  nameSi?: string;
  nameTa?: string;
}

interface JobListing {
  id: string;
  title: string;
  originalTitle?: string;
  description?: string;
  originalDescription?: string;
  category: string;
  wage: number;
  wageType: string;
  createdAt: string;
  sourceLanguage?: string;
  isMachineTranslated?: boolean;
  guestRestricted?: boolean;
  employer?: { companyName?: string; isVerified?: boolean };
  district?: District;
}

interface JobFilters {
  search: string;
  district: string;
  category: string;
  minimumWage: string;
}

const EMPTY_FILTERS: JobFilters = { search: "", district: "", category: "", minimumWage: "" };

export default function JobsPage() {
  const { isEmployer } = useAuth();
  const { t, locale } = useLanguage();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<JobFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [masterDataError, setMasterDataError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<{ districts: District[] }>("/master/districts"),
      api.get<{ categories: Category[] }>("/master/categories")
    ]).then(([districtResponse, categoryResponse]) => {
      if (!active) return;
      setDistricts(districtResponse.districts || []);
      setCategories(categoryResponse.categories || []);
    }).catch((loadError: Error) => {
      console.error("Failed to load job filter options:", loadError);
      if (active) setMasterDataError("Some filter options could not be loaded.");
    });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ lang: locale });
    if (appliedFilters.search.trim()) query.set("search", appliedFilters.search.trim());
    if (appliedFilters.district) query.set("districtId", appliedFilters.district);
    if (appliedFilters.category) query.set("category", appliedFilters.category);
    if (appliedFilters.minimumWage) query.set("minWage", appliedFilters.minimumWage);

    setLoading(true);
    setError("");
    api.get<{ jobs: JobListing[] }>(`/jobs?${query.toString()}`)
      .then((response) => {
        if (active) setJobs(response.jobs || []);
      })
      .catch((loadError: Error) => {
        console.error("Failed to load jobs:", loadError);
        if (active) setError("We couldn’t load job listings. Please check your connection and try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [appliedFilters, locale, reloadCount]);

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const getDistrictName = (district?: District) => {
    if (!district) return "Sri Lanka";
    if (locale === "si") return district.nameSi || district.nameEn;
    if (locale === "ta") return district.nameTa || district.nameEn;
    return district.nameEn;
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return categoryId.replace(/-/g, " ");
    if (locale === "si") return category.nameSi || category.nameEn;
    if (locale === "ta") return category.nameTa || category.nameEn;
    return category.nameEn;
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#173e2e] px-6 py-9 text-white sm:px-9 sm:py-11">
        <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#e2c382]">Your next opportunity</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("jobs.title", "Find work that fits your skills")}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">Browse open roles, discover local employers, and find opportunities across Sri Lanka.</p>
          </div>
          {isEmployer && (
            <Link href="/jobs/post" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-primary-800 transition hover:bg-[#f5efe2]">
              <BriefcaseBusiness size={17} />{t("nav.postJob", "Post a job")}
            </Link>
          )}
        </div>
      </section>

      <section className="surface-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><SlidersHorizontal size={19} /></span>
          <div>
            <h2 className="font-semibold text-slate-900">{t("common.search", "Search opportunities")}</h2>
            <p className="mt-0.5 text-xs text-slate-500">Refine your results by role, location, category, or minimum wage.</p>
          </div>
        </div>
        <form onSubmit={submitFilters} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Search jobs by title or skills</span>
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder={t("jobs.searchPlaceholder", "Search title or skills")} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
          </label>
          <label>
            <span className="sr-only">Filter by district</span>
            <select value={filters.district} onChange={(event) => setFilters({ ...filters, district: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100">
              <option value="">{t("common.allDistricts", "All districts")}</option>
              {districts.map((district) => <option key={district.id} value={district.id}>{getDistrictName(district)}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100">
              <option value="">{t("common.allCategories", "All categories")}</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{getCategoryName(category.id)}</option>)}
            </select>
          </label>
          <label className="relative block">
            <span className="sr-only">Minimum wage in LKR</span>
            <Wallet size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="number" min="0" value={filters.minimumWage} onChange={(event) => setFilters({ ...filters, minimumWage: event.target.value })} placeholder="Min. wage (LKR)" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <button type="submit" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 text-sm font-semibold text-white transition hover:bg-primary-800"><Search size={16} />{t("common.search", "Search")}</button>
            <button type="button" onClick={clearFilters} title="Clear filters" className="inline-flex min-h-12 w-12 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"><FilterX size={17} /><span className="sr-only">Clear filters</span></button>
          </div>
        </form>
        {masterDataError && <p role="status" className="mt-3 text-xs text-amber-700">{masterDataError}</p>}
      </section>

      <section aria-live="polite">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t("jobs.results", "Open opportunities")}</h2>
            {!loading && !error && <p className="mt-1 text-sm text-slate-500">{jobs.length} {jobs.length === 1 ? "role" : "roles"} available</p>}
          </div>
          {!loading && !error && appliedFilters.search && <p className="text-xs text-slate-500">Results for “{appliedFilters.search}”</p>}
        </div>

        {error ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
            <p className="font-semibold">Unable to show job listings</p>
            <p className="mt-1">{error}</p>
            <button type="button" onClick={() => setReloadCount((count) => count + 1)} className="mt-4 rounded-lg bg-white px-4 py-2 font-semibold text-rose-800 shadow-sm transition hover:bg-rose-100">Try again</button>
          </div>
        ) : loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => <div key={item} className="surface-card h-64 animate-pulse bg-slate-100" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><BriefcaseBusiness size={25} /></span>
            <h3 className="mt-4 font-semibold text-slate-900">No roles match these filters</h3>
            <p className="mt-2 text-sm text-slate-500">Try another search or clear the filters to see all open roles.</p>
            <button type="button" onClick={clearFilters} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><FilterX size={16} />Clear filters</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => {
              const isOriginal = !!showOriginalMap[job.id];
              return (
                <article key={job.id} className="surface-card flex flex-col p-5 transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_16px_40px_rgb(23_75_53/9%)] sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Building2 size={20} /></span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-500">{job.employer?.companyName || "Employer"}</p>
                        <h3 className="mt-1 text-lg font-semibold leading-snug text-slate-900">{isOriginal ? job.originalTitle || job.title : job.title}</h3>
                      </div>
                    </div>
                    <VerifiedBadge isVerified={job.employer?.isVerified} size="sm" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800">{getCategoryName(job.category)}</span>
                    {job.wageType && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{job.wageType.replace(/_/g, " ")}</span>}
                  </div>

                  <MachineTranslationNotice isMachineTranslated={!!job.isMachineTranslated} showOriginal={isOriginal} onToggle={() => setShowOriginalMap((previous) => ({ ...previous, [job.id]: !previous[job.id] }))} sourceLanguage={job.sourceLanguage} />
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-slate-400" />{getDistrictName(job.district)}</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900"><Wallet size={15} className="text-primary-700" />LKR {job.wage?.toLocaleString()} <span className="font-normal text-slate-500">/ {job.wageType?.toLowerCase()}</span></span>
                  </div>
                  {(isOriginal ? job.originalDescription || job.description : job.description) && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{isOriginal ? job.originalDescription || job.description : job.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">{new Date(job.createdAt).toLocaleDateString(locale)}</span>
                    <Link href={job.guestRestricted ? "/login" : `/jobs/${job.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary-700 px-4 text-sm font-semibold text-white transition hover:bg-primary-800">
                      {job.guestRestricted ? "Sign in to apply" : t("jobs.applyNow", "View & apply")}<ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#f1eadb] p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="font-semibold text-slate-900">Hiring for your team?</p>
          <p className="mt-1 text-sm text-slate-600">Share an opening and reach people looking for their next role.</p>
        </div>
        <Link href={isEmployer ? "/jobs/post" : "/register"} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#c7b58e] bg-white/70 px-4 text-sm font-semibold text-slate-800 transition hover:bg-white">Post a job<Check size={15} /></Link>
      </section>
    </div>
  );
}
