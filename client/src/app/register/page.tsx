"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Key, User, Phone, Calendar, MapPin, AlertCircle, CheckSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";

const AVAILABLE_ROLES = [
  { id: "JobSeeker", labelEn: "Job Seeker (Looking for work)", icon: "🛠️" },
  { id: "Employer", labelEn: "Employer (Hiring workers)", icon: "🏢" },
  { id: "Entrepreneur", labelEn: "Micro-Business Entrepreneur (Need funding)", icon: "🌱" },
  { id: "Funder", labelEn: "Funder / Investor (CSR, diaspora, donor)", icon: "🤝" },
  { id: "TrainingProvider", labelEn: "Training & Vocational Institute", icon: "🎓" }
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [districts, setDistricts] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["JobSeeker"]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/master/districts")
      .then((res) => {
        if (res && res.districts) setDistricts(res.districts);
      })
      .catch(() => {});
  }, []);

  const handleRoleToggle = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
      }
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError(t("auth.termsConsent", "You must agree to the Terms of Service and Privacy Notice to proceed."));
      return;
    }

    if (selectedRoles.length === 0) {
      setError("Please select at least one role.");
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName,
        email,
        password,
        dateOfBirth,
        phone,
        districtId: districtId || null,
        roles: selectedRoles,
        preferredLanguage: locale,
        termsAccepted
      });
      router.push("/verification");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please review your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-card mx-auto my-2 max-w-3xl p-6 sm:p-9">
      <div className="text-center mb-6">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-800">
          <UserPlus size={26} />
        </div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {t("auth.registerTitle", "Create Your Account")}
        </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Create a profile to explore work and business opportunities across Sri Lanka.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t("auth.fullName", "Full Name")} *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Kamal Perera"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t("auth.email", "Email Address")} *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamal@example.com"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Password & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t("auth.password", "Password")} *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t("auth.phone", "Phone Number")}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Date of Birth & District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t("auth.dateOfBirth", "Date of Birth (as in NIC)")} *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t("auth.district", "Home / Business District")}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {locale === "si" ? d.nameSi : locale === "ta" ? d.nameTa : d.nameEn} ({d.province})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Role Selection (Multi-select allowed) */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
            {t("auth.selectRoles", "Select your role(s) - you may hold multiple roles:")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_ROLES.map((role) => {
              const isSelected = selectedRoles.includes(role.id);
              return (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => handleRoleToggle(role.id)}
                  className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition ${
                    isSelected
                      ? "border-primary-600 bg-primary-50 text-primary-900 shadow-sm"
                      : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="text-lg">{role.icon}</span>
                  <span className="flex-1 font-semibold">{role.labelEn}</span>
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      isSelected ? "border-primary-600 bg-primary-600 text-white" : "border-gray-400"
                    }`}
                  >
                    {isSelected && "✓"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Terms of Service & Privacy Notice Consent Checkbox (stores timestamp) */}
        <div className="pt-3 border-t border-gray-100">
          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              {t(
                "auth.termsConsent",
                "I agree to the Terms of Service and Privacy Notice. I consent to my identity documents being verified by authorized verifiers and understand my NIC number is securely encrypted at rest."
              )}
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 px-4 rounded-xl text-sm shadow transition disabled:opacity-50 mt-4"
        >
          {loading ? t("common.loading", "Registering...") : t("common.register", "Create Account")}
        </button>
      </form>

      <div className="mt-5 text-center text-xs text-gray-500">
        <span>{t("auth.haveAccount", "Already registered?")} </span>
        <Link href="/login" className="font-bold text-primary-700 hover:underline">
          {t("common.signIn", "Sign In Here")}
        </Link>
      </div>
    </div>
  );
}
