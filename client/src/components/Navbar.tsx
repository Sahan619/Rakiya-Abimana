"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleUserRound,
  Compass,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  UserRound,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { VerifiedBadge } from "./VerifiedBadge";
import { api } from "../lib/api";

export function Navbar() {
  const { user, logout, isAdmin, isVerifier, isEmployer, isEntrepreneur, isJobSeeker, isFunder } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    api.get("/notifications")
      .then((response) => {
        if (typeof response?.unreadCount === "number") setUnreadCount(response.unreadCount);
      })
      .catch((error) => console.error("Failed to load notification count:", error));
  }, [user, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActive = (path: string) => path === "/" ? pathname === "/" : pathname.startsWith(path);
  const navClass = (path: string) =>
    `inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition ${
      isActive(path) ? "bg-primary-50 text-primary-800" : "text-slate-600 hover:bg-slate-50 hover:text-primary-800"
    }`;
  const mobileClass = (path: string) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive(path) ? "bg-primary-50 text-primary-800" : "text-slate-700 hover:bg-slate-50"
    }`;

  const workspaceLinks = [
    ...(isJobSeeker ? [{ href: "/jobs/applications", label: t("nav.myApplications", "My applications") }] : []),
    ...(isEmployer ? [
      { href: "/jobs/post", label: t("nav.postJob", "Post a job") },
      { href: "/jobs/my", label: "My job listings" }
    ] : []),
    ...(isEntrepreneur ? [
      { href: "/pitches/create", label: t("nav.createPitch", "Create a proposal") },
      { href: "/pitches/my", label: "My proposals" }
    ] : []),
    ...(user ? [
      { href: "/inbox", label: t("nav.messages", "Messages") },
      { href: "/verification", label: t("nav.verification", "Verification") }
    ] : []),
    ...(isVerifier ? [{ href: "/verifier", label: t("nav.verifierQueue", "Verification queue") }] : []),
    ...(isAdmin ? [{ href: "/admin", label: t("nav.adminPanel", "Admin dashboard") }] : [])
  ];

  const mobileLinks = [
    { href: "/jobs", label: t("nav.jobs", "Find jobs"), icon: BriefcaseBusiness },
    { href: "/pitches", label: t("nav.pitches", "Funding"), icon: Leaf },
    { href: "/nearby", label: t("nav.nearbyJobs", "Nearby jobs"), icon: MapPin },
    ...workspaceLinks.map((item) => ({ ...item, icon: Compass }))
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_3px_18px_rgb(21_32_51/4%)] backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Rakiya-Abimana home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-700 text-accent-100 shadow-sm transition group-hover:bg-primary-800">
            <Leaf size={21} strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight text-slate-900 sm:text-base">Rakiya-Abimana</span>
            <span className="hidden text-[10px] font-medium tracking-wide text-slate-500 sm:block">SKILLS · WORK · GROWTH</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          <Link href="/jobs" className={navClass("/jobs")}>
            <BriefcaseBusiness size={16} /> {t("nav.jobs", "Find jobs")}
          </Link>
          <Link href="/pitches" className={navClass("/pitches")}>
            <Leaf size={16} /> {t("nav.pitches", "Funding")}
          </Link>
          <Link href="/nearby" className={navClass("/nearby")}>
            <MapPin size={16} /> {t("nav.nearbyJobs", "Nearby")}
          </Link>
          {workspaceLinks.length > 0 && (
            <details className="group relative">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-primary-800 [&::-webkit-details-marker]:hidden">
                {t("common.workspace", "Workspace")} <ChevronDown size={15} className="transition group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                {workspaceLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-primary-50 hover:text-primary-800">
                    {item.label}<ArrowUpRight size={14} className="text-slate-400" />
                  </Link>
                ))}
              </div>
            </details>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link href="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-primary-800" aria-label={t("nav.notifications", "Notifications")}>
                <Bell size={19} />
                {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </Link>
              <details className="group relative hidden sm:block">
                <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl px-2 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-800">{user.fullName.charAt(0).toUpperCase()}</span>
                  <span className="hidden max-w-24 truncate text-sm font-semibold text-slate-700 xl:block">{user.fullName.split(" ")[0]}</span>
                  <VerifiedBadge isVerified={user.isVerified} size="sm" showLabel={false} />
                  <ChevronDown size={14} className="text-slate-400 transition group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Link href="/profile" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"><UserRound size={16} />{t("common.profile", "My profile")}</Link>
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50"><LogOut size={16} />{t("common.signOut", "Sign out")}</button>
                </div>
              </details>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t("common.signIn", "Sign in")}</Link>
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">
                {t("common.register", "Get started")}<ArrowUpRight size={15} />
              </Link>
            </div>
          )}
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 lg:hidden" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2" aria-label="Mobile navigation">
            {mobileLinks.map(({ href, label, icon: Icon }, index) => (
              <Link key={`${href}-${index}`} href={href} className={mobileClass(href)}>
                <Icon size={18} /><span>{label}</span>
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/profile" className={mobileClass("/profile")}><CircleUserRound size={18} />{t("common.profile", "My profile")}</Link>
                <Link href="/notifications" className={mobileClass("/notifications")}><Bell size={18} />{t("nav.notifications", "Notifications")}{unreadCount > 0 && <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">{unreadCount}</span>}</Link>
                <button type="button" onClick={handleLogout} className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"><LogOut size={18} />{t("common.signOut", "Sign out")}</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-2 pt-2 sm:col-span-2">
                <Link href="/login" className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700">{t("common.signIn", "Sign in")}</Link>
                <Link href="/register" className="rounded-xl bg-primary-700 py-3 text-center text-sm font-semibold text-white">{t("common.register", "Get started")}</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
