"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, PlusCircle, AlertCircle, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { api } from "../../../lib/api";

export default function CreatePitchPage() {
  const { user, isEntrepreneur } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [districts, setDistricts] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [fundingNeeded, setFundingNeeded] = useState("");
  const [fundingType, setFundingType] = useState("MICRO_LOAN");
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
    api.get("/master/sectors").then((res) => {
      if (res?.sectors) {
        setSectors(res.sectors);
        if (res.sectors.length > 0) setSectorId(res.sectors[0].id);
      }
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/pitches", {
        title,
        story,
        districtId,
        sectorId: sectorId || null,
        fundingNeeded: parseFloat(fundingNeeded),
        fundingType,
        sourceLanguage
      });

      router.push(`/pitches/my`);
    } catch (err: any) {
      setError(err.message || "Failed to submit pitch.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
        <p className="font-bold text-gray-700">Please sign in to submit a business pitch.</p>
        <Link href="/login" className="mt-3 inline-block bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-lg">
          Sign In
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
        <h1 className="text-xl font-bold text-gray-900">Verification Required to Start a Pitch</h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Entrepreneurs must be identity-verified with NIC and Grama Niladhari documentation before submitting proposals to donors, microfinance lenders, and CSR programs.
        </p>
        <Link
          href="/verification"
          className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow transition"
        >
          Verify Identity Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/pitches" className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-black">
        <ArrowLeft size={16} />
        <span>Back to Pitches</span>
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="border-b border-gray-100 pb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <PlusCircle className="text-teal-700" size={24} />
            <span>Create a Micro-Business Funding Pitch</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Your pitch will be reviewed by a verifier and automatically translated into Sinhala, Tamil, and English.
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
              Pitch Title / Enterprise Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Village Handmade Organic Coconut Shell Craft Workshop"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                District *
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

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Business Sector *
              </label>
              <select
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Funding Target Needed (LKR) *
              </label>
              <input
                type="number"
                min="1000"
                required
                value={fundingNeeded}
                onChange={(e) => setFundingNeeded(e.target.value)}
                placeholder="250000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Funding Type *
              </label>
              <select
                value={fundingType}
                onChange={(e) => setFundingType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="MICRO_LOAN">Micro-Loan (Low interest / community)</option>
                <option value="GRANT">Non-repayable Grant / CSR Donation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Source Language *
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
              Business Story & Plan *
            </label>
            <textarea
              required
              rows={6}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Tell your story: What does your business produce? How many local jobs will this create? Exactly how will the requested funds be spent (e.g. tools, raw materials, packaging)?"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl text-sm shadow transition disabled:opacity-50 mt-3"
          >
            {loading ? "Submitting Pitch..." : "Submit Pitch for Verifier Review"}
          </button>
        </form>
      </div>
    </div>
  );
}

