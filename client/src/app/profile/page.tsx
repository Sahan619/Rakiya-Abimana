"use client";

import React, { useState, useEffect } from "react";
import { User, ShieldCheck, Briefcase, Building2, TrendingUp, Key, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import { VerifiedBadge } from "../../components/VerifiedBadge";

export default function ProfilePage() {
  const { user, refreshUser, isJobSeeker, isEmployer, isFunder } = useAuth();
  const { t, locale, setLocale } = useLanguage();

  const [districts, setDistricts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Base profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [preferredLang, setPreferredLang] = useState("en");

  // Job seeker profile fields
  const [jsCategory, setJsCategory] = useState("skilled tradesperson");
  const [jsTrade, setJsTrade] = useState("");
  const [jsSkills, setJsSkills] = useState("");
  const [jsExp, setJsExp] = useState("0");
  const [jsBio, setJsBio] = useState("");

  // Employer profile fields
  const [empCompanyName, setEmpCompanyName] = useState("");
  const [empBrNumber, setEmpBrNumber] = useState("");
  const [empDesc, setEmpDesc] = useState("");
  const [empWebsite, setEmpWebsite] = useState("");

  // Funder profile fields
  const [funderType, setFunderType] = useState("CSR business");
  const [funderDistricts, setFunderDistricts] = useState("");
  const [funderSectors, setFunderSectors] = useState("");

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/master/districts").then((res) => {
      if (res && res.districts) setDistricts(res.districts);
    });
    api.get("/master/categories").then((res) => {
      if (res && res.categories) setCategories(res.categories);
    });
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setDistrictId(user.districtId || "");
      setPreferredLang(user.preferredLanguage || "en");

      if (user.jobSeekerProfile) {
        setJsCategory(user.jobSeekerProfile.category || "skilled tradesperson");
        setJsTrade(user.jobSeekerProfile.trade || "");
        setJsSkills(user.jobSeekerProfile.skills || "");
        setJsExp(String(user.jobSeekerProfile.experienceYears || 0));
        setJsBio(user.jobSeekerProfile.bio || "");
      }

      if (user.employerProfile) {
        setEmpCompanyName(user.employerProfile.companyName || "");
        setEmpBrNumber(user.employerProfile.businessRegNumber || "");
        setEmpDesc(user.employerProfile.description || "");
        setEmpWebsite(user.employerProfile.website || "");
      }

      if (user.funderProfile) {
        setFunderType(user.funderProfile.funderType || "CSR business");
        setFunderDistricts(user.funderProfile.focusDistricts || "");
        setFunderSectors(user.funderProfile.focusSectors || "");
      }
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      // 1. Update base profile
      await api.put("/auth/profile", {
        fullName,
        phone,
        districtId: districtId || null,
        preferredLanguage: preferredLang
      });

      if (preferredLang !== locale) {
        await setLocale(preferredLang as any);
      }

      // 2. Update role specific profile
      if (isJobSeeker) {
        await api.post("/users/job-seeker-profile", {
          category: jsCategory,
          trade: jsTrade,
          skills: jsSkills,
          experienceYears: parseInt(jsExp, 10),
          bio: jsBio
        });
      }

      if (isEmployer) {
        await api.post("/users/employer-profile", {
          companyName: empCompanyName,
          businessRegNumber: empBrNumber,
          description: empDesc,
          website: empWebsite
        });
      }

      if (isFunder) {
        await api.post("/users/funder-profile", {
          funderType,
          focusDistricts: funderDistricts,
          focusSectors: funderSectors
        });
      }

      await refreshUser();
      setMessage("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await api.put("/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="text-center py-12">Please log in to manage your profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.fullName}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {user.roles.map((r) => (
              <span key={r} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-semibold">
                {r}
              </span>
            ))}
          </div>
        </div>
        <VerifiedBadge isVerified={user.isVerified} size="lg" />
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-lg flex items-center space-x-2">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-lg flex items-start space-x-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
            <User size={18} className="text-primary-600" />
            <span>General Account Settings</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Home / Business District</label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameEn} ({d.nameSi} / {d.nameTa})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Preferred Language</label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="en">English</option>
                <option value="si">සිංහල (Sinhala)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Seeker Profile Section */}
        {isJobSeeker && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
              <Briefcase size={18} className="text-primary-600" />
              <span>Job Seeker Workforce Profile</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                <select
                  value={jsCategory}
                  onChange={(e) => setJsCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="blue-collar">Blue Collar / General Labor</option>
                  <option value="skilled tradesperson">Skilled Tradesperson</option>
                  <option value="white-collar">White Collar & Administrative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Specific Trade</label>
                <input
                  type="text"
                  value={jsTrade}
                  onChange={(e) => setJsTrade(e.target.value)}
                  placeholder="e.g. Electrician, Carpenter, Mason, Driver"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={jsSkills}
                  onChange={(e) => setJsSkills(e.target.value)}
                  placeholder="Wiring, circuit installation, solar repair, NVQ level 4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  value={jsExp}
                  onChange={(e) => setJsExp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Bio / Work Summary</label>
                <textarea
                  rows={3}
                  value={jsBio}
                  onChange={(e) => setJsBio(e.target.value)}
                  placeholder="Tell employers about your availability, tools owned, and previous projects..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Employer Profile Section */}
        {isEmployer && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
              <Building2 size={18} className="text-primary-600" />
              <span>Employer Company Profile</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Company / Business Name *</label>
                <input
                  type="text"
                  required={isEmployer}
                  value={empCompanyName}
                  onChange={(e) => setEmpCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Business Registration No.</label>
                <input
                  type="text"
                  value={empBrNumber}
                  onChange={(e) => setEmpBrNumber(e.target.value)}
                  placeholder="PV-XXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Company Description</label>
                <textarea
                  rows={3}
                  value={empDesc}
                  onChange={(e) => setEmpDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Website URL</label>
                <input
                  type="url"
                  value={empWebsite}
                  onChange={(e) => setEmpWebsite(e.target.value)}
                  placeholder="https://example.lk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Funder Profile Section */}
        {isFunder && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
              <TrendingUp size={18} className="text-primary-600" />
              <span>Funder / Donor Profile</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Funder Category</label>
                <select
                  value={funderType}
                  onChange={(e) => setFunderType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="CSR business">CSR Business</option>
                  <option value="diaspora donor">Diaspora Donor</option>
                  <option value="registered MFI">Registered MFI</option>
                  <option value="angel donor">Angel Donor</option>
                  <option value="NGO">Non-Governmental Organization (NGO)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Focus Districts</label>
                <input
                  type="text"
                  value={funderDistricts}
                  onChange={(e) => setFunderDistricts(e.target.value)}
                  placeholder="e.g. Jaffna, Kandy, Galle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Focus Sectors</label>
                <input
                  type="text"
                  value={funderSectors}
                  onChange={(e) => setFunderSectors(e.target.value)}
                  placeholder="e.g. Agriculture, Handicrafts, Food Production"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow transition flex items-center justify-center space-x-2"
        >
          <Save size={18} />
          <span>{saving ? "Saving..." : "Save Profile Changes"}</span>
        </button>
      </form>

      {/* Change Password Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
          <Key size={18} className="text-primary-600" />
          <span>Change Password</span>
        </h2>

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-lg text-xs"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

