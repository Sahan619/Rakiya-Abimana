"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Upload,
  Lock,
  Info
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import { VerifiedBadge } from "../../components/VerifiedBadge";

export default function VerificationPage() {
  const { user, can, loading: authLoading, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [nicNumber, setNicNumber] = useState("");
  const [gramaDoc, setGramaDoc] = useState<File | null>(null);
  const [businessDoc, setBusinessDoc] = useState<File | null>(null);
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roles = user?.roles || [];
  const isJobSeeker = roles.includes("JobSeeker");
  const requiresNic = roles.includes("Employer") || roles.includes("Entrepreneur") || (roles.includes("Funder") && user?.funderProfile?.accountType === "INDIVIDUAL");
  const canSubmitDocuments = can("verification:submit");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/verification/my-status");
      if (res && res.verification) {
        setStatusData(res.verification);
      }
    } catch (err) {
      console.error("Failed to fetch verification status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!nicNumber.trim()) {
      if (requiresNic) {
        setError("Please enter your Sri Lankan NIC number for this role.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nicNumber", nicNumber.trim());
      if (gramaDoc) formData.append("gramaNiladhariDoc", gramaDoc);
      if (businessDoc) formData.append("businessRegDoc", businessDoc);

      const res = await api.post("/verification/submit", formData);
      setMessage(res.message || "Verification submitted successfully.");
      await fetchStatus();
      await refreshUser();
    } catch (err: any) {
      setError(err.message || "Failed to submit verification details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Checking access...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <ShieldCheck className="mx-auto text-gray-400 mb-3" size={40} />
        <h2 className="text-lg font-bold text-gray-900">Sign in to Access Verification</h2>
        <p className="text-gray-500 text-xs mt-1">You must be logged in to verify your identity.</p>
      </div>
    );
  }

  if (!canSubmitDocuments) {
    return <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><ShieldCheck className="mx-auto text-primary-700" size={40} /><h2 className="mt-4 text-lg font-bold text-slate-900">Verification is unavailable</h2><p className="mt-2 text-sm text-slate-600">This account is not permitted to submit verification documents.</p></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="text-primary-700" size={26} />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isJobSeeker ? "Optional Personal Verification" : canSubmitDocuments ? "Role-based Verification" : t("verification.title", "Identity & Business Verification")}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {isJobSeeker ? "You can request optional personal verification. An account does not require a NIC." : "Submit only the identity or organization documents relevant to your role for manual review."}
            </p>
          </div>
          <div>
            <VerifiedBadge isVerified={user.isVerified} size="lg" />
          </div>
        </div>

        {/* Security & Privacy Banner */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-2.5 text-xs text-blue-900">
          <Lock size={16} className="text-blue-700 flex-shrink-0 mt-0.5" />
          <span>
            {t(
              "verification.encryptionNotice",
              "Your NIC number is encrypted at rest using AES-256-GCM. Only authorized verifiers and admins can review raw NIC documents; everyone else sees your Verified badge only."
            )}
          </span>
        </div>
      </div>

      {/* Current Status Card */}
      {statusData && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase text-gray-500 mb-3">
            {t("verification.statusHeading", "Current Verification Status")}
          </h2>

          <div className="flex items-center space-x-3 mb-4">
            {statusData.status === "APPROVED" && (
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-lg">
                <CheckCircle2 size={24} />
                <span>{t("common.approved", "Approved - You are a Verified Member")}</span>
              </div>
            )}
            {statusData.status === "PENDING" && (
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-lg">
                <Clock size={24} />
                <span>{t("common.pending", "Pending Verification Review")}</span>
              </div>
            )}
            {statusData.status === "REJECTED" && (
              <div className="flex items-center space-x-2 text-red-700 font-bold text-lg">
                <XCircle size={24} />
                <span>{t("common.rejected", "Verification Request Declined")}</span>
              </div>
            )}
          </div>

          {/* Rejection Reason alert */}
          {statusData.status === "REJECTED" && statusData.rejectionReason && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm mb-4">
              <span className="font-bold">Reason for Rejection: </span>
              {statusData.rejectionReason}
            </div>
          )}

          {/* System Date of Birth Match Validation Result */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">System DOB Automated Check:</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                  statusData.dobMatch
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {statusData.dobMatch ? "MATCHED (System Verified)" : "DOB MISMATCH"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">NIC Format Recognized:</span>
              <span className="font-bold text-gray-800">{statusData.nicFormat} FORMAT</span>
            </div>
            <p className="text-[11px] text-gray-500 italic pt-1">
              * The system compares the date of birth embedded in your NIC with your profile DOB. This result is system-set and cannot be altered by anyone.
            </p>
          </div>
        </div>
      )}

      {/* Submission Form (Shown if not yet verified or rejected) */}
      {(!user.isVerified || statusData?.status === "REJECTED") && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
            Submit Documents for Review
          </h2>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            {t("verification.nicNumber", "Sri Lankan NIC Number")} {requiresNic ? "*" : "(optional)"}
              </label>
              <input
                type="text"
                required={requiresNic}
                value={nicNumber}
                onChange={(e) => setNicNumber(e.target.value)}
                placeholder="e.g. 920841234V or 199208401234"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono tracking-wide focus:ring-primary-500 focus:border-primary-500 uppercase"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Old format: 9 digits followed by &apos;V&apos; or &apos;X&apos;. New format: 12 digits.
              </p>
            </div>

            {!isJobSeeker && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {t("verification.gramaNiladhari", "Grama Niladhari Certificate (PDF / Image)")}
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setGramaDoc(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            )}

            {(roles.includes("Employer") || roles.includes("Entrepreneur") || (roles.includes("Funder") && user.funderProfile?.accountType === "ORGANIZATION")) && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {t("verification.businessReg", "Business Registration Proof (For Employers & Micro-Businesses)")}
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setBusinessDoc(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            )}


            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 px-4 rounded-xl text-sm shadow transition disabled:opacity-50 mt-3 flex items-center justify-center space-x-2"
            >
              <Upload size={18} />
              <span>
                {submitting
                  ? t("common.loading", "Submitting for Verification...")
                  : "Submit Verification Request"}
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
