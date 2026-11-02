"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  TrendingUp,
  MapPin,
  MessageSquare,
  Bell,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  ClipboardList,
  SlidersHorizontal,
  FileCheck
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
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      api.get("/notifications")
        .then((res) => {
          if (res && res.unreadCount !== undefined) {
            setUnreadCount(res.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const linkClass = (path: string) =>
    `flex items-center space-x-1.5 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
      isActive(path)
        ? "bg-primary-700 text-white shadow-sm"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    }`;

  const mobileLinkClass = (path: string) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold text-base transition-colors ${
      isActive(path)
        ? "bg-primary-700 text-white"
        : "text-gray-800 hover:bg-gray-100"
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary-700 text-white p-2 rounded-lg font-black text-xl tracking-wider shadow-sm flex items-center justify-center">
                🇱🇰
              </div>
              <div>
                <span className="font-extrabold text-lg sm:text-xl text-gray-900 block leading-tight">
                  {t("common.appName", "Rakiya Abimana")}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                  {t("common.slogan", "Jobs & Micro-Business Funding (Sri Lanka)")}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link href="/jobs" className={linkClass("/jobs")}>
              <Briefcase size={17} />
              <span>{t("nav.jobs", "Jobs")}</span>
            </Link>

            <Link href="/nearby" className={linkClass("/nearby")}>
              <MapPin size={17} />
              <span>{t("nav.nearbyJobs", "Nearby")}</span>
            </Link>

            <Link href="/pitches" className={linkClass("/pitches")}>
              <TrendingUp size={17} />
              <span>{t("nav.pitches", "Pitches")}</span>
            </Link>

            {/* Role specific quick action buttons */}
            {isEmployer && (
              <Link href="/jobs/post" className={linkClass("/jobs/post")}>
                <PlusCircle size={17} className="text-primary-600" />
                <span>{t("nav.postJob", "Post Job")}</span>
              </Link>
            )}

            {isEntrepreneur && (
              <Link href="/pitches/create" className={linkClass("/pitches/create")}>
                <PlusCircle size={17} className="text-primary-600" />
                <span>{t("nav.createPitch", "Start Pitch")}</span>
              </Link>
            )}

            {isJobSeeker && (
              <Link href="/jobs/applications" className={linkClass("/jobs/applications")}>
                <ClipboardList size={17} />
                <span>{t("nav.myApplications", "Applications")}</span>
              </Link>
            )}

            {user && (
              <Link href="/inbox" className={linkClass("/inbox")}>
                <MessageSquare size={17} />
                <span>{t("nav.messages", "Inbox")}</span>
              </Link>
            )}

            {isVerifier && (
              <Link href="/verifier" className={linkClass("/verifier")}>
                <FileCheck size={17} className="text-amber-600" />
                <span>{t("nav.verifierQueue", "Queue")}</span>
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin" className={linkClass("/admin")}>
                <SlidersHorizontal size={17} className="text-purple-600" />
                <span>{t("nav.adminPanel", "Admin")}</span>
              </Link>
            )}
          </nav>

          {/* Right items: Language Switcher, Notifications, User Profile / Auth */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center space-x-2">
                {/* Notification Bell */}
                <Link
                  href="/notifications"
                  className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                  title={t("nav.notifications", "Notifications")}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-600 text-white rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Link with Verified Badge */}
                <Link
                  href="/profile"
                  className="flex items-center space-x-1.5 p-1.5 rounded-lg hover:bg-gray-100 text-sm text-gray-800"
                  title="My Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-sm">
                    {user.fullName.charAt(0)}
                  </div>
                  <span className="font-semibold hidden md:inline truncate max-w-[120px]">
                    {user.fullName.split(" ")[0]}
                  </span>
                  <VerifiedBadge isVerified={user.isVerified} size="sm" showLabel={false} />
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-700 rounded-full hover:bg-red-50 hidden sm:block"
                  title={t("common.signOut", "Sign Out")}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  {t("common.signIn", "Sign In")}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-md shadow-sm"
                >
                  {t("common.register", "Register")}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-md"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-1 shadow-lg">
          <Link
            href="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileLinkClass("/jobs")}
          >
            <Briefcase size={20} />
            <span>{t("nav.jobs", "Jobs")}</span>
          </Link>

          <Link
            href="/nearby"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileLinkClass("/nearby")}
          >
            <MapPin size={20} />
            <span>{t("nav.nearbyJobs", "Nearby Jobs")}</span>
          </Link>

          <Link
            href="/pitches"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileLinkClass("/pitches")}
          >
            <TrendingUp size={20} />
            <span>{t("nav.pitches", "Micro-Business Funding")}</span>
          </Link>

          {isEmployer && (
            <Link
              href="/jobs/post"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass("/jobs/post")}
            >
              <PlusCircle size={20} />
              <span>{t("nav.postJob", "Post a Job")}</span>
            </Link>
          )}

          {isEntrepreneur && (
            <Link
              href="/pitches/create"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass("/pitches/create")}
            >
              <PlusCircle size={20} />
              <span>{t("nav.createPitch", "Start a Pitch")}</span>
            </Link>
          )}

          {isJobSeeker && (
            <Link
              href="/jobs/applications"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass("/jobs/applications")}
            >
              <ClipboardList size={20} />
              <span>{t("nav.myApplications", "My Applications")}</span>
            </Link>
          )}

          {user && (
            <>
              <Link
                href="/inbox"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileLinkClass("/inbox")}
              >
                <MessageSquare size={20} />
                <span>{t("nav.messages", "Inbox & Chat")}</span>
              </Link>

              <Link
                href="/verification"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileLinkClass("/verification")}
              >
                <ShieldCheck size={20} />
                <span>{t("nav.verification", "Identity Verification")}</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileLinkClass("/profile")}
              >
                <User size={20} />
                <span>{t("common.profile", "My Profile")}</span>
              </Link>
            </>
          )}

          {isVerifier && (
            <Link
              href="/verifier"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass("/verifier")}
            >
              <FileCheck size={20} />
              <span>{t("nav.verifierQueue", "Verifier Queue")}</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass("/admin")}
            >
              <SlidersHorizontal size={20} />
              <span>{t("nav.adminPanel", "Admin Dashboard")}</span>
            </Link>
          )}

          <div className="pt-3 border-t border-gray-200">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-700 hover:bg-red-50 font-semibold"
              >
                <LogOut size={20} />
                <span>{t("common.signOut", "Sign Out")}</span>
              </button>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg border border-gray-300 font-bold text-gray-800"
                >
                  {t("common.signIn", "Sign In")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-primary-700 text-white font-bold"
                >
                  {t("common.register", "Register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

