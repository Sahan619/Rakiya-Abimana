"use client";


import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Check,
  GraduationCap,
  HandCoins,
  Languages,
  MapPin,
  Sparkles,
  Sprout,
  UsersRound
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { VerifiedBadge } from "../components/VerifiedBadge";

interface FeaturedJob {
  id: string;
  title: string;
  category?: string;
  wage: number;
  wageType?: string;
  createdAt: string;
  guestRestricted?: boolean;
  employer?: { companyName?: string; isVerified?: boolean };
  district?: { nameEn?: string; nameSi?: string; nameTa?: string };
}

const opportunities = [
  { icon: BriefcaseBusiness, title: "Find employment", titleKey: "home.featureJobsTitle", text: "Explore open roles and take the next step in your working life.", textKey: "home.featureJobsText", href: "/jobs", tint: "bg-[#eaf2eb] text-[#174b35]" },
  { icon: UsersRound, title: "Hire skilled workers", titleKey: "home.featureHiringTitle", text: "Share an opening and connect with people ready to contribute.", textKey: "home.featureHiringText", href: "/jobs/post", tint: "bg-[#f5efe2] text-[#9b7131]" },
  { icon: Sprout, title: "Start a business", titleKey: "home.featureBusinessTitle", text: "Shape your idea into a proposal and make it visible to funders.", textKey: "home.featureBusinessText", href: "/pitches/create", tint: "bg-[#eaf2eb] text-[#3d8051]" },
  { icon: HandCoins, title: "Explore funding", titleKey: "home.featureFundingTitle", text: "Discover community business proposals and express your interest.", textKey: "home.featureFundingText", href: "/pitches", tint: "bg-[#f5efe2] text-[#9b7131]" },
  { icon: GraduationCap, title: "Discover training", titleKey: "home.featureTrainingTitle", text: "Find opportunities to develop practical and professional skills.", textKey: "home.featureTrainingText", href: "/register", tint: "bg-[#edf1f7] text-[#526887]" },
  { icon: MapPin, title: "Find nearby jobs", titleKey: "home.featureNearbyTitle", text: "Browse work opportunities around your district and location.", textKey: "home.featureNearbyText", href: "/nearby", tint: "bg-[#eaf2eb] text-[#174b35]" }
];

const steps = [
  ["01", "Create your account", "Choose the role that best describes what you want to do.", "home.step1Title", "home.step1Text"],
  ["02", "Build your profile", "Share your skills, experience, or business idea.", "home.step2Title", "home.step2Text"],
  ["03", "Discover opportunities", "Search jobs and proposals across the platform.", "home.step3Title", "home.step3Text"],
  ["04", "Apply or connect", "Reach out, submit an application, or express interest.", "home.step4Title", "home.step4Text"],
  ["05", "Grow your future", "Keep building your career or business, one step at a time.", "home.step5Title", "home.step5Text"]
];

export default function HomePage() {
  const { t, locale } = useLanguage();
  const { user, can } = useAuth();
  const [jobs, setJobs] = useState<FeaturedJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");

  useEffect(() => {
    if (!can("job:list_public")) {
      setJobs([]);
      setJobsLoading(false);
      return;
    }

    let active = true;
    setJobsLoading(true);
    setJobsError("");
    api.get<{ jobs: FeaturedJob[] }>(`/jobs?lang=${locale}`)
      .then((response) => {
        if (active) setJobs((response.jobs || []).slice(0, 3));
      })
      .catch((error: Error) => {
        console.error("Failed to load featured jobs:", error);
        if (active) setJobsError("We couldn’t load the latest opportunities. Please try again later.");
      })
      .finally(() => {
        if (active) setJobsLoading(false);
      });

    return () => { active = false; };
  }, [can, locale]);

  const visibleOpportunities = opportunities.filter(({ href }) =>
    (href !== "/jobs" || can("job:list_public")) &&
    (href !== "/nearby" || can("job:nearby")) &&
    (href !== "/jobs/post" || !user || can("job:create"))
  );

  const districtName = (job: FeaturedJob) => {
    if (locale === "si") return job.district?.nameSi || job.district?.nameEn || "Sri Lanka";
    if (locale === "ta") return job.district?.nameTa || job.district?.nameEn || "Sri Lanka";
    return job.district?.nameEn || "Sri Lanka";
  };

  return (
    <div className="home-page -mx-4 -mt-8 space-y-0 overflow-hidden bg-[#f8faf8]">
      <section className="relative isolate overflow-hidden bg-[#f3f6f1]">
        <div className="absolute -right-32 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full border-[1px] border-[#174b35]/10" />
        <div className="absolute -right-20 -top-28 -z-10 h-[28rem] w-[28rem] rounded-full border-[1px] border-[#174b35]/10" />
        <div className="page-width grid min-h-[600px] items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-primary-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-accent-500" />
              {t("home.heroEyebrow", "A place for Sri Lankan talent to grow")}
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[4.25rem]">
              {t("home.heroTitle", "Empowering Skills. Creating Opportunities.")}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              {t("home.heroDescription", "Discover meaningful work, connect with skilled people, and explore ways to grow a small business—all in one place.")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {can("job:list_public") && <Link href="/jobs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 text-sm font-semibold text-white shadow-lg shadow-primary-900/10 transition hover:-translate-y-0.5 hover:bg-primary-800">
                {t("home.exploreJobs", "Explore jobs")}<ArrowRight size={17} />
              </Link>}
              <Link href="/pitches" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50">
                {t("home.exploreFunding", "Explore funding")}<ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-primary-700" />For job seekers and employers</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-primary-700" />For entrepreneurs and funders</span>
            </div>
          </div>

          <div className="reveal delay-2 relative mx-auto w-full max-w-[520px]">
            <div className="absolute -left-7 top-16 h-28 w-28 rounded-full bg-[#d5ad63]/20 blur-2xl" />
            <div className="absolute -bottom-5 right-4 h-40 w-40 rounded-full bg-primary-200/50 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white bg-white/85 p-4 shadow-[0_30px_90px_rgb(23_75_53/14%)] backdrop-blur sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[.15em] text-slate-400">Opportunity board</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">A path forward</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Sparkles size={20} /></span>
              </div>
              <div className="space-y-3 py-5">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><BriefcaseBusiness size={20} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-700">Employment</p>
                      <p className="mt-1 font-semibold text-slate-900">Find work that fits your skills</p>
                      <p className="mt-1 text-xs text-slate-500">Search by role, district, and more</p>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-400" />
                  </div>
                </div>
                <div className="ml-5 rounded-2xl border border-[#f0e5d1] bg-[#fdfaf4] p-4 sm:ml-12">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4ead7] text-[#9b7131]"><Sprout size={20} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9b7131]">Entrepreneurship</p>
                      <p className="mt-1 font-semibold text-slate-900">Turn your idea into a proposal</p>
                      <p className="mt-1 text-xs text-slate-500">Share your plans with potential funders</p>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-primary-700 px-4 py-3.5 text-white">
                <span className="text-sm font-medium">Start with one opportunity</span><ArrowRight size={17} />
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-lg sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4ead7] text-[#9b7131]"><Languages size={18} /></span>
              <span className="text-xs font-semibold text-slate-700"></span>
            </div>
          </div>
        </div>
        <a href="#opportunities" className="mx-auto mb-7 flex w-fit items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-primary-800">
          Discover what you can do <ArrowDown size={14} />
        </a>
      </section>

      <section id="opportunities" className="scroll-mt-24 py-20 sm:py-24">
        <div className="page-width">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-700">{t("home.opportunitiesEyebrow", "One platform, many paths")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t("home.opportunitiesTitle", "Make your next move")}</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">{t("home.opportunitiesDescription", "Whether you are looking for work, building a team, or growing a business, find a starting point here.")}</p>
          </div>
          <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleOpportunities.map(({ icon: Icon, title, titleKey, text, textKey, href, tint }, index) => (
              <Link key={title} href={href === "/jobs/post" && !user ? "/register" : href} className={`surface-card group reveal p-6 transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_16px_40px_rgb(23_75_53/9%)] ${index > 2 ? "delay-1" : ""}`}>
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}><Icon size={22} /></span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{t(titleKey, title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t(textKey, text)}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-800">{t("home.explore", "Explore")}<ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="page-width">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-700">{t("home.stepsEyebrow", "How it works")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t("home.stepsTitle", "A few steps to get started")}</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">{t("home.stepsDescription", "Create a profile, find what fits, and connect with the people who can help you move forward.")}</p>
          </div>
          <ol className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            <div className="absolute left-[8%] right-[8%] top-6 hidden h-px bg-primary-100 lg:block" />
            {steps.map(([number, title, text, titleKey, textKey]) => (
              <li key={number} className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
                <span className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-white text-sm font-bold text-primary-800 shadow-sm">{number}</span>
                <div className="lg:pt-1">
                  <h3 className="font-semibold text-slate-900">{t(titleKey, title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t(textKey, text)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {can("job:list_public") && <section className="py-20 sm:py-24">
        <div className="page-width">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-700">{t("home.jobsEyebrow", "Live opportunities")}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t("home.jobsTitle", "Featured jobs")}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{t("home.jobsDescription", "Recent openings from employers on the platform. Explore the full list to find a role that fits.")}</p>
            </div>
            <Link href="/jobs" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-800 transition hover:gap-3">{t("home.browseJobs", "Browse all jobs")}<ArrowRight size={16} /></Link>
          </div>

          {jobsLoading ? (
            <div className="mt-9 grid gap-4 md:grid-cols-3" aria-label="Loading featured jobs">
              {[0, 1, 2].map((item) => <div key={item} className="surface-card h-56 animate-pulse bg-slate-100" />)}
            </div>
          ) : jobsError ? (
            <div role="status" className="mt-9 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{jobsError}<Link href="/jobs" className="ml-2 font-semibold underline">Browse jobs</Link></div>
          ) : jobs.length === 0 ? (
            <div className="mt-9 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <BriefcaseBusiness className="mx-auto text-slate-300" size={30} />
              <p className="mt-3 font-semibold text-slate-800">{t("home.noOpenJobs", "There are no open roles to feature right now.")}</p>
              <Link href="/jobs" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-800">Explore jobs<ArrowRight size={15} /></Link>
            </div>
          ) : (
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {jobs.map((job, index) => (
                <article key={job.id} className={`surface-card reveal flex flex-col p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(23_75_53/9%)] ${index === 1 ? "delay-1" : index === 2 ? "delay-2" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Building2 size={20} /></span>
                    {!job.guestRestricted && <VerifiedBadge isVerified={job.employer?.isVerified} size="sm" />}
                  </div>
                  {!job.guestRestricted && <span className="mt-5 text-[11px] font-bold uppercase tracking-wide text-primary-700">{job.category}</span>}
                  <h3 className="mt-1 text-lg font-semibold leading-snug text-slate-900">{job.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{!job.guestRestricted && `${job.employer?.companyName || "Employer"} · `}{districtName(job)}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <p className="text-sm font-semibold text-slate-900">LKR {job.wage?.toLocaleString()} {!job.guestRestricted && job.wageType && <span className="font-normal text-slate-500">/ {job.wageType.toLowerCase()}</span>}</p>
                    {job.guestRestricted ? <span className="text-xs text-slate-500">Limited public listing</span> : <Link href={`/jobs/${job.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-800 hover:text-primary-600">
                      View role<ArrowRight size={15} />
                    </Link>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>}

      <section className="bg-[#173e2e] py-20 text-white sm:py-24">
        <div className="page-width grid items-center gap-10 lg:grid-cols-[1fr_.85fr]">
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#e2c382]"><HandCoins size={23} /></span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-[#e2c382]">{t("home.fundingEyebrow", "Business & funding")}</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">{t("home.fundingTitle", "Ideas grow stronger when the right people can see them.")}</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">{t("home.fundingDescription", "Entrepreneurs can share business proposals and funding needs. Funders can discover projects and express interest. Any financing arrangements take place outside the platform.")}</p>
            <Link href="/pitches" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-primary-800 transition hover:bg-[#f5efe2]">{t("home.fundingCta", "Explore business proposals")}<ArrowRight size={16} /></Link>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[.06] p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d5ad63]/15 text-[#e2c382]"><Sprout size={21} /></span>
              <div><p className="font-semibold">From an idea to a connection</p><p className="mt-1 text-xs text-white/55">A simple way to share what you are building</p></div>
            </div>
            <ol className="mt-5 space-y-4">
              {["Describe your business and goals", "Submit a proposal for review", "Help interested funders find your idea"].map((item, index) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-semibold text-[#e2c382]">0{index + 1}</span>{item}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="page-width grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe2] text-[#9b7131]"><Languages size={23} /></span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-primary-700">{t("home.languageEyebrow", "Designed for many voices")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t("home.languageTitle", "Opportunities in your language.")}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{t("home.languageDescription", "Choose English, Sinhala, or Tamil as you explore. The platform’s translation support helps make job posts and conversations more accessible across languages.")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["English", "සිංහල", "தமிழ்"].map((language) => <span key={language} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">{language}</span>)}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-card p-5 sm:translate-y-6"><span className="text-xs font-bold uppercase tracking-wide text-primary-700">01 · Choose</span><p className="mt-3 text-lg font-semibold text-slate-900">Set your preferred language</p><p className="mt-2 text-sm leading-6 text-slate-600">Switch languages from the navigation whenever you need.</p></div>
            <div className="surface-card bg-[#fdfaf4] p-5"><span className="text-xs font-bold uppercase tracking-wide text-[#9b7131]">02 · Explore</span><p className="mt-3 text-lg font-semibold text-slate-900">Read with more context</p><p className="mt-2 text-sm leading-6 text-slate-600">Machine translations are labelled, and original content remains available.</p></div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="page-width relative overflow-hidden rounded-[2rem] bg-[#f1eadb] px-6 py-12 sm:px-12 sm:py-16">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#9b7131]/15" />
          <div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#8b652f]">{t("home.finalEyebrow", "Your next chapter starts here")}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t("home.finalTitle", "Your Skills Deserve an Opportunity.")}</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-700">{t("home.finalDescription", "Explore jobs, share your experience, or take the first step towards building a business.")}</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {can("job:list_public") && <Link href="/jobs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 text-sm font-semibold text-white transition hover:bg-primary-800">{t("home.findJobs", "Find jobs")}<ArrowRight size={16} /></Link>}
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#c7b58e] bg-white/70 px-5 text-sm font-semibold text-slate-800 transition hover:bg-white">{t("home.getStarted", "Get started")}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
