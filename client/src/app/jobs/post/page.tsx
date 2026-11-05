"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, PlusCircle, AlertCircle, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { api } from "../../../lib/api";

export default function PostJobPage() {
  const { user, can, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [districts, setDistricts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("blue-collar");
  const [districtId, setDistrictId] = useState("");
  const [wage, setWage] = useState("");
  const [wageType, setWageType] = useState("MONTHLY");
  const [description, setDescription] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<string>(locale || "en");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/master/districts").then((res) => {
      if (res?.districts) {
        setDistricts(res.districts);
        if (user?.districtId) setDistrictId(user.districtId);
      }
    });
    api.get("/master/categories").then((res) => {
      if (res?.categories) setCategories(res.categories);
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/jobs", {
        title,
        category,
        districtId,
        wage: parseFloat(wage),
        wageType,
        description,
        sourceLanguage
      });

      router.push("/jobs/my");
    } catch (err: any) {
      setError(err.message || "Failed to publish job posting.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Loading account permissions...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
        <p className="font-bold text-gray-700">Please sign in to publish job postings.</p>
        <Link href="/login" className="mt-3 inline-block bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-lg">
          Sign In
        </Link>
      </div>
    );
  }

  if (!can("job:create")) {
    return (
      <div className="max-w-xl mx-auto my-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto">
          <Briefcase size={32} />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Employer Role Required</h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Job postings are reserved for Employers hiring personnel for business activities.
        </p>
        <Link
          href="/profile"
          className="inline-block bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow transition"
        >
          Manage Profile & Roles
        </Link>
      </div>
    );
  }

  // Verification Gate Check
  if (!user.isVerified) {
    return (
      <div className="max-w-xl mx-auto my-8 bg-white border border-amber-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Verification Required to Post Jobs</h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          To protect Sri Lankan job seekers against scams and wage theft, only verified employers and entrepreneurs with confirmed NIC and residence/business proof may publish vacancies.
        </p>
        <Link
          href="/verification"
          className="inline-block bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow transition"
        >
          Complete Verification Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/jobs" className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-black">
        <ArrowLeft size={16} />
        <span>Back to Jobs</span>
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="border-b border-gray-100 pb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <PlusCircle className="text-primary-700" size={24} />
            <span>Publish a New Job Opening</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Your posting will be automatically translated into Sinhala, Tamil, and English.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start space-x-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Job Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Teak Carpenter or Factory Assembly Operator"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="blue-collar">Blue Collar & General Labor</option>
                <option value="skilled-trades">Skilled Tradesperson</option>
                <option value="white-collar">White Collar & Administrative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Job District *
              </label>
              <select
                required
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameEn} ({d.nameSi} / {d.nameTa})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Offered Wage (LKR) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={wage}
                onChange={(e) => setWage(e.target.value)}
                placeholder="65000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Wage Basis *
              </label>
              <select
                value={wageType}
                onChange={(e) => setWageType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="DAILY">Daily</option>
                <option value="PIECE_RATE">Piece Rate</option>
                <option value="HOURLY">Hourly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Source Language of Description *
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="en">English</option>
              <option value="si">සිංහල (Sinhala)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Job Description & Candidate Requirements *
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline daily duties, working hours, tools provided, accommodation/meals, and required experience..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 px-4 rounded-xl text-sm shadow transition disabled:opacity-50 mt-3"
          >
            {loading ? "Publishing Job..." : "Publish Job Opening"}
          </button>
        </form>
      </div>
    </div>
  );
}
