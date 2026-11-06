"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Briefcase,
  Building2,
  TrendingUp,
  Key,
  Save,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ClipboardList,
  ShieldCheck,
  Compass,
  ArrowRight,
  Sparkles,
  Phone,
  Globe
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import { VerifiedBadge } from "../../components/VerifiedBadge";

interface District {
  id: string;
  nameEn: string;
  nameSi?: string;
  nameTa?: string;
  province?: string;
}

interface Category {
  id: string;
  nameEn: string;
  nameSi?: string;
  nameTa?: string;
}

export default function ProfilePage() {
  const { user, can, loading: authLoading, refreshUser, isJobSeeker, isEmployer, isFunder, isEntrepreneur } = useAuth();
  const { t, locale, setLocale } = useLanguage();

  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Base profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [preferredLang, setPreferredLang] = useState("en");

  // Job seeker profile fields
  const [jsCategory, setJsCategory] = useState("skilled-trades-technical-services");
  const [jsTrade, setJsTrade] = useState("");
  const [jsSkills, setJsSkills] = useState("");
  const [jsExp, setJsExp] = useState("0");
  const [jsBio, setJsBio] = useState("");
  const [jsEducation, setJsEducation] = useState("");
  const [jsPreferredCategories, setJsPreferredCategories] = useState("");
  const [jsPreferredLocations, setJsPreferredLocations] = useState("");
  const [jsExpectedSalary, setJsExpectedSalary] = useState("");

  // Employer profile fields (for employers only)
  const [empCompanyName, setEmpCompanyName] = useState("");
  const [empBrNumber, setEmpBrNumber] = useState("");
  const [empDesc, setEmpDesc] = useState("");
  const [empIndustry, setEmpIndustry] = useState("");
  const [empAddress, setEmpAddress] = useState("");
  const [empContactPhone, setEmpContactPhone] = useState("");
  const [empWebsite, setEmpWebsite] = useState("");

  const [entrepreneurBusinessName, setEntrepreneurBusinessName] = useState("");
  const [entrepreneurCategory, setEntrepreneurCategory] = useState("");
  const [entrepreneurIdea, setEntrepreneurIdea] = useState("");
  const [entrepreneurStage, setEntrepreneurStage] = useState("IDEA");
  const [entrepreneurFunding, setEntrepreneurFunding] = useState("");
  const [entrepreneurExperience, setEntrepreneurExperience] = useState("");

  const [funderAccountType, setFunderAccountType] = useState("ORGANIZATION");
  const [funderOrganizationName, setFunderOrganizationName] = useState("");
  const [funderOrganizationType, setFunderOrganizationType] = useState("");
  const [funderInterests, setFunderInterests] = useState("");

  // Funder profile fields (for funders only)
  const [funderType, setFunderType] = useState("CSR business");
  const [funderDistricts, setFunderDistricts] = useState("");
  const [funderSectors, setFunderSectors] = useState("");
  const [funderListed, setFunderListed] = useState(false);
  const [savingFunderListing, setSavingFunderListing] = useState(false);

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (authLoading || !can("profile:manage_own")) return;
    api.get("/master/districts").then((res: any) => {
      if (res?.districts) setDistricts(res.districts);
    }).catch((err) => console.error("Failed to fetch districts", err));

    api.get("/master/categories").then((res: any) => {
      if (res?.categories) setCategories(res.categories);
    }).catch((err) => console.error("Failed to fetch categories", err));
  }, [authLoading, can]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setDistrictId(user.districtId || "");
      setPreferredLang(user.preferredLanguage || "en");

      if (user.jobSeekerProfile) {
        setJsCategory(user.jobSeekerProfile.category || "skilled-trades-technical-services");
        setJsTrade(user.jobSeekerProfile.trade || "");
        setJsSkills(user.jobSeekerProfile.skills || "");
        setJsExp(String(user.jobSeekerProfile.experienceYears ?? 0));
        setJsBio(user.jobSeekerProfile.bio || "");
        setJsEducation(user.jobSeekerProfile.educationQualifications || "");
        setJsPreferredCategories(user.jobSeekerProfile.preferredCategories || "");
        setJsPreferredLocations(user.jobSeekerProfile.preferredLocations || "");
        setJsExpectedSalary(user.jobSeekerProfile.expectedSalary ? String(user.jobSeekerProfile.expectedSalary) : "");
      }

      if (user.employerProfile) {
        setEmpCompanyName(user.employerProfile.companyName || "");
        setEmpBrNumber(user.employerProfile.businessRegNumber || "");
        setEmpDesc(user.employerProfile.description || "");
        setEmpIndustry(user.employerProfile.industry || "");
        setEmpAddress(user.employerProfile.businessAddress || "");
        setEmpContactPhone(user.employerProfile.contactPhone || "");
        setEmpWebsite(user.employerProfile.website || "");
      }

      if (user.entrepreneurProfile) {
        setEntrepreneurBusinessName(user.entrepreneurProfile.businessName || "");
        setEntrepreneurCategory(user.entrepreneurProfile.businessCategory || "");
        setEntrepreneurIdea(user.entrepreneurProfile.businessIdea || "");
        setEntrepreneurStage(user.entrepreneurProfile.businessStage || "IDEA");
        setEntrepreneurFunding(user.entrepreneurProfile.fundingRequirement ? String(user.entrepreneurProfile.fundingRequirement) : "");
        setEntrepreneurExperience(user.entrepreneurProfile.skillsExperience || "");
      }

      if (user.funderProfile) {
        setFunderType(user.funderProfile.funderType || "CSR business");
        setFunderAccountType(user.funderProfile.accountType || "ORGANIZATION");
        setFunderOrganizationName(user.funderProfile.organizationName || "");
        setFunderOrganizationType(user.funderProfile.organizationType || "");
        setFunderInterests(user.funderProfile.fundingInterests || "");
        setFunderDistricts(user.funderProfile.focusDistricts || "");
        setFunderSectors(user.funderProfile.focusSectors || "");
        setFunderListed(Boolean(user.funderProfile.listedInDirectory));
      }
    }
  }, [user]);

  const updateFunderListing = async (listedInDirectory: boolean) => {
    setSavingFunderListing(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.put<{ listedInDirectory: boolean }>("/funders/me/listing", {
        listedInDirectory
      });
      setFunderListed(response.listedInDirectory);
      await refreshUser();
      setMessage(t("funders.listingUpdated", "Directory listing preference updated."));
    } catch (listingError) {
      setError(listingError instanceof Error ? listingError.message : "Failed to update directory listing.");
    } finally {
      setSavingFunderListing(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      // 1. Update base account settings
      await api.put("/auth/profile", {
        fullName,
        phone,
        districtId: districtId || null,
        preferredLanguage: preferredLang
      });

      if (preferredLang !== locale) {
        await setLocale(preferredLang as any);
      }

      // 2. Role-specific profile updates
      if (isJobSeeker) {
        // Job Seeker saves workforce profile only
        await api.post("/users/job-seeker-profile", {
          category: jsCategory,
          trade: jsTrade,
          skills: jsSkills,
          experienceYears: parseInt(jsExp, 10) || 0,
          bio: jsBio,
          educationQualifications: jsEducation,
          preferredCategories: jsPreferredCategories,
          preferredLocations: jsPreferredLocations,
          expectedSalary: jsExpectedSalary ? parseFloat(jsExpectedSalary) : null
        });
      } else {
        // Non-job seekers update respective authorized role profiles
        if (isEmployer) {
          await api.post("/users/employer-profile", {
            companyName: empCompanyName,
            businessRegNumber: empBrNumber,
            description: empDesc,
            industry: empIndustry,
            businessAddress: empAddress,
            contactPhone: empContactPhone,
            website: empWebsite
          });
        }

        if (isFunder) {
          await api.post("/users/funder-profile", {
            funderType,
            accountType: funderAccountType,
            organizationName: funderOrganizationName,
            organizationType: funderOrganizationType,
            fundingInterests: funderInterests,
            focusDistricts: funderDistricts,
            focusSectors: funderSectors
          });
        }

        if (isEntrepreneur) {
          await api.post("/users/entrepreneur-profile", {
            businessName: entrepreneurBusinessName,
            businessCategory: entrepreneurCategory,
            businessIdea: entrepreneurIdea,
            businessStage: entrepreneurStage,
            fundingRequirement: entrepreneurFunding ? parseFloat(entrepreneurFunding) : null,
            skillsExperience: entrepreneurExperience
          });
        }

      }

      await refreshUser();
      setMessage("Profile saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setUpdatingPassword(true);
    setMessage(null);
    setError(null);

    try {
      await api.put("/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please check your current password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (authLoading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Loading account permissions...</div>;
  }

  if (!user) {
    return (
      <div className="surface-card mx-auto max-w-md p-8 text-center">
        <User size={36} className="mx-auto text-slate-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Sign in to manage your profile</h2>
        <p className="mt-1 text-sm text-slate-500">Access your account settings, workforce details, and applications.</p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!can("profile:manage_own")) {
    return <div className="surface-card mx-auto max-w-md p-8 text-center"><User size={36} className="mx-auto text-slate-400 mb-3" /><h2 className="text-lg font-bold text-slate-900">Profile management is disabled for this account</h2></div>;
  }

  // Determine current active district name
  const currentDistrict = districts.find((d) => d.id === (districtId || user.districtId));
  const districtName = currentDistrict?.nameEn || "Sri Lanka";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="surface-card relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-xl font-black text-primary-800">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user.fullName}</h1>
                <VerifiedBadge isVerified={user.isVerified} size="md" />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{user.email}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200"
                  >
                    {role === "JobSeeker" ? "🛠️ Job Seeker" :
                     role === "Employer" ? "🏢 Employer" :
                     role === "Entrepreneur" ? "🌱 Entrepreneur" :
                     role === "Funder" ? "🤝 Funder" :
                     role === "Admin" ? "🛡️ Admin" :
                     role === "Verifier" ? "🔍 Verifier" : role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <Link
              href="/verification"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ShieldCheck size={16} className="text-primary-700" />
              <span>{user.isVerified ? "Verified Account" : "Verification Status"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 flex items-center gap-2 shadow-sm">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-2 shadow-sm">
          <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Job Seeker Quick Access Strip (only rendered for Job Seekers) */}
      {isJobSeeker && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/jobs"
            className="surface-card p-4 flex items-center justify-between gap-3 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Briefcase size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Opportunities</p>
                <p className="text-sm font-bold text-slate-900">Browse Open Jobs</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400" />
          </Link>

          <Link
            href="/nearby"
            className="surface-card p-4 flex items-center justify-between gap-3 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <MapPin size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Local Match</p>
                <p className="text-sm font-bold text-slate-900">Jobs Near {districtName}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400" />
          </Link>

          <Link
            href="/jobs/applications"
            className="surface-card p-4 flex items-center justify-between gap-3 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <ClipboardList size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Applications</p>
                <p className="text-sm font-bold text-slate-900">My Applications</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400" />
          </Link>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: General Account Settings (All Roles) */}
        <section className="surface-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <User size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">General Account Information</h2>
              <p className="text-xs text-slate-500">Update your primary personal contact details and regional preferences.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kamal Wickramasinghe"
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Home / Working District
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameEn} {d.nameSi ? `(${d.nameSi} / ${d.nameTa})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preferred Interface Language
              </label>
              <div className="relative">
                <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                >
                  <option value="en">English (English)</option>
                  <option value="si">සිංහල (Sinhala)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Job Seeker Workforce Profile (Rendered for Job Seekers) */}
        {isJobSeeker && (
          <section className="surface-card p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Briefcase size={18} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Job Seeker Workforce Profile</h2>
                <p className="text-xs text-slate-500">
                  Highlight your skills, trade certification, and practical experience to potential employers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Employment Category *
                </label>
                <select
                  value={jsCategory}
                  onChange={(e) => setJsCategory(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                >
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.nameEn}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Specific Trade / Role Title
                </label>
                <input
                  type="text"
                  value={jsTrade}
                  onChange={(e) => setJsTrade(e.target.value)}
                  placeholder="e.g. Licensed Electrician, Joiner, Mason, Heavy Vehicle Driver"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Core Skills & Capabilities (comma-separated)
                </label>
                <input
                  type="text"
                  value={jsSkills}
                  onChange={(e) => setJsSkills(e.target.value)}
                  placeholder="e.g. Domestic wiring, 3-phase industrial power, circuit breakers, solar repair, NVQ-4"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Separate multiple skills with commas so employers can search and match your profile easily.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={jsExp}
                  onChange={(e) => setJsExp(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Candidate Bio / Professional Summary
                </label>
                <textarea
                  rows={4}
                  value={jsBio}
                  onChange={(e) => setJsBio(e.target.value)}
                  placeholder="Tell employers about your availability, tools owned, previous completed projects, or certificates..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Education / Qualifications</label>
                <input type="text" value={jsEducation} onChange={(e) => setJsEducation(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Expected Salary (LKR)</label>
                <input type="number" min="0" value={jsExpectedSalary} onChange={(e) => setJsExpectedSalary(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Preferred Job Categories</label>
                <input type="text" value={jsPreferredCategories} onChange={(e) => setJsPreferredCategories(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Preferred Working Locations</label>
                <input type="text" value={jsPreferredLocations} onChange={(e) => setJsPreferredLocations(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Employer Profile (ONLY rendered when user is an Employer AND NOT a Job Seeker) */}
        {!isJobSeeker && isEmployer && (
          <section className="surface-card p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Building2 size={18} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Employer Company Profile</h2>
                <p className="text-xs text-slate-500">
                  Provide your official enterprise details and business registration information.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={empCompanyName}
                  onChange={(e) => setEmpCompanyName(e.target.value)}
                  placeholder="e.g. Lanka Eco Furniture Works"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Registration Number (BR)
                </label>
                <input
                  type="text"
                  value={empBrNumber}
                  onChange={(e) => setEmpBrNumber(e.target.value)}
                  placeholder="PV-XXXXXX / GMP"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Description
                </label>
                <textarea
                  rows={3}
                  value={empDesc}
                  onChange={(e) => setEmpDesc(e.target.value)}
                  placeholder="Describe your company's core operations, manufacturing facilities, or construction services..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Industry / Business Category</label>
                <input type="text" value={empIndustry} onChange={(e) => setEmpIndustry(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contact Phone</label>
                <input type="text" value={empContactPhone} onChange={(e) => setEmpContactPhone(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Business Address</label>
                <input type="text" value={empAddress} onChange={(e) => setEmpAddress(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  value={empWebsite}
                  onChange={(e) => setEmpWebsite(e.target.value)}
                  placeholder="https://example.lk"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>
            </div>
          </section>
        )}

        {/* Section 4: Funder Profile (ONLY rendered when user is a Funder AND NOT a Job Seeker) */}
        {!isJobSeeker && isFunder && (
          <section className="surface-card p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <TrendingUp size={18} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Funder / Donor Profile</h2>
                <p className="text-xs text-slate-500">
                  Set your philanthropic or micro-financing focus areas and preferred districts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Account Type</label>
                <select value={funderAccountType} onChange={(e) => setFunderAccountType(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"><option value="INDIVIDUAL">Individual Donor</option><option value="ORGANIZATION">Organization</option></select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Organization Name</label>
                <input type="text" value={funderOrganizationName} onChange={(e) => setFunderOrganizationName(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Organization Type</label>
                <input type="text" value={funderOrganizationType} onChange={(e) => setFunderOrganizationType(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Funder Category
                </label>
                <select
                  value={funderType}
                  onChange={(e) => setFunderType(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                >
                  <option value="CSR business">CSR Business</option>
                  <option value="diaspora donor">Diaspora Donor</option>
                  <option value="registered MFI">Registered MFI</option>
                  <option value="angel donor">Angel Donor</option>
                  <option value="NGO">Non-Governmental Organization (NGO)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Focus Districts
                </label>
                <input
                  type="text"
                  value={funderDistricts}
                  onChange={(e) => setFunderDistricts(e.target.value)}
                  placeholder="e.g. Jaffna, Kandy, Galle, Batticaloa"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Focus Sectors
                </label>
                <input
                  type="text"
                  value={funderSectors}
                  onChange={(e) => setFunderSectors(e.target.value)}
                  placeholder="e.g. Agriculture, Handicrafts, Fisheries, Food Production"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Funding Interests</label>
                <textarea rows={3} value={funderInterests} onChange={(e) => setFunderInterests(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
              </div>
              {can("funder:manage_listing") && (
                <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-start gap-3 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={funderListed}
                      disabled={savingFunderListing}
                      onChange={(event) => updateFunderListing(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-primary-700"
                    />
                    <span>
                      {t("funders.listMe", "List me in the funder directory")}
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        {t("funders.listingNote", "Only active, verified funders are shown in directory results.")}
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section 5: Entrepreneur Summary (for Entrepreneurs who are not Job Seekers) */}
        {!isJobSeeker && isEntrepreneur && (
          <section className="surface-card p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Entrepreneur Workspace Shortcuts</h2>
                <p className="text-xs text-slate-500">Quickly manage your micro-business funding proposals and job postings.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Business / Proposed Name</span><input value={entrepreneurBusinessName} onChange={(e) => setEntrepreneurBusinessName(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm" /></label>
              <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Business Category</span><input value={entrepreneurCategory} onChange={(e) => setEntrepreneurCategory(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm" /></label>
              <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Business Stage</span><select value={entrepreneurStage} onChange={(e) => setEntrepreneurStage(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm"><option value="IDEA">Idea stage</option><option value="EARLY">Early operations</option><option value="GROWTH">Growth stage</option></select></label>
              <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Funding Requirement</span><input type="number" min="0" value={entrepreneurFunding} onChange={(e) => setEntrepreneurFunding(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm" /></label>
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Business Idea</span><textarea rows={3} value={entrepreneurIdea} onChange={(e) => setEntrepreneurIdea(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm" /></label>
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Skills and Experience</span><textarea rows={3} value={entrepreneurExperience} onChange={(e) => setEntrepreneurExperience(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm" /></label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Link
                href="/jobs/my"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-primary-300 hover:bg-primary-50/50 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">Manage My Job Postings</p>
                  <p className="text-xs text-slate-500">View and edit job openings you posted for your venture</p>
                </div>
                <ArrowRight size={16} className="text-primary-700 shrink-0" />
              </Link>
              <Link
                href="/pitches/my"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-primary-300 hover:bg-primary-50/50 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">My Funding Proposals</p>
                  <p className="text-xs text-slate-500">Review submitted micro-business pitches and funder interest</p>
                </div>
                <ArrowRight size={16} className="text-primary-700 shrink-0" />
              </Link>
            </div>
          </section>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? "Saving Changes..." : "Save Profile Changes"}</span>
          </button>
        </div>
      </form>

      {/* Change Password Card */}
      <section className="surface-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Key size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Security & Password</h2>
            <p className="text-xs text-slate-500">Keep your account secure by using a strong password.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={updatingPassword || !currentPassword || !newPassword}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Key size={14} />
              <span>{updatingPassword ? "Updating Password..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
