"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { api } from "../../../lib/api";
import { VerifiedBadge } from "../../../components/VerifiedBadge";
import { MachineTranslationNotice } from "../../../components/MachineTranslationNotice";

export default function JobDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, isJobSeeker } = useAuth();
  const { t, locale } = useLanguage();

  const [job, setJob] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchJob();
  }, [id, locale]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${id}?lang=${locale}`);
      if (res?.job) {
        setJob(res.job);
        setHasApplied(res.hasApplied);
        setApplication(res.application);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    setApplying(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post(`/jobs/${id}/apply`, { notes });
      setHasApplied(true);
      setApplication(res.application);
      setMessage(t("jobs.applySuccess", "Your application was submitted successfully!"));
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  const handleStartMessage = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await api.post("/messages/conversations", {
        recipientId: job.employer.id,
        type: "JOB_APPLICATION",
        referenceId: job.id
      });
      if (res?.conversation) {
        router.push(`/inbox/${res.conversation.id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate conversation");
    }
  };

  if (loading) {
    return <div className="text-center py-12 font-medium text-gray-500">Loading job details...</div>;
  }

  if (!job) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
        <p className="font-bold text-gray-700">Job not found or has been removed.</p>
        <Link href="/jobs" className="text-primary-700 text-sm font-bold underline mt-2 inline-block">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const titleToDisplay = showOriginal ? job.originalTitle : job.title;
  const descToDisplay = showOriginal ? job.originalDescription : job.description;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/jobs" className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-black">
        <ArrowLeft size={16} />
        <span>Back to Jobs</span>
      </Link>

      {/* Main Job Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <span className="inline-block bg-primary-50 text-primary-800 border border-primary-200 text-xs font-bold px-2.5 py-0.5 rounded uppercase">
              {job.category}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
              {titleToDisplay}
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm font-semibold text-gray-800">{job.employer.companyName}</span>
              <VerifiedBadge isVerified={job.employer.isVerified} size="sm" />
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-xl sm:text-2xl font-black text-emerald-800 block">
              Rs. {job.wage?.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 uppercase font-semibold">per {job.wageType}</span>
          </div>
        </div>

        <MachineTranslationNotice
          isMachineTranslated={job.isMachineTranslated}
          showOriginal={showOriginal}
          onToggle={() => setShowOriginal(!showOriginal)}
          sourceLanguage={job.sourceLanguage}
        />

        {/* Location & Meta Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <span className="text-gray-500 block">District Location:</span>
            <span className="font-bold text-gray-800">{job.district?.nameEn}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Approx Coordinates:</span>
            <span className="font-mono text-gray-800">{job.lat?.toFixed(2)}, {job.lng?.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Status:</span>
            <span className="font-bold text-emerald-700">{job.status}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-sm font-bold uppercase text-gray-700 mb-2">Job Description & Requirements</h2>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-gray-100">
            {descToDisplay}
          </div>
        </div>

        {/* Employer Overview */}
        {job.employer.description && (
          <div className="border-t border-gray-100 pt-4 text-xs text-gray-600">
            <span className="font-bold text-gray-800 block mb-1">About {job.employer.companyName}:</span>
            <p>{job.employer.description}</p>
          </div>
        )}

        {/* Actions Strip */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          {user && user.id !== job.employer.id && (
            <button
              type="button"
              onClick={handleStartMessage}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-800 font-bold text-xs hover:bg-gray-50 shadow-sm"
            >
              <MessageSquare size={16} />
              <span>Message Employer</span>
            </button>
          )}
        </div>
      </div>

      {/* Application Box */}
      {job.guestRestricted ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="font-bold text-amber-900 text-sm">Sign in to view full contact information and apply for this job.</p>
          <Link
            href="/login"
            className="mt-3 inline-block bg-primary-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow"
          >
            Sign In Now
          </Link>
        </div>
      ) : hasApplied ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
          <CheckCircle2 size={32} className="text-emerald-700 mx-auto" />
          <h3 className="font-bold text-emerald-900 text-base">You have applied for this position</h3>
          <p className="text-xs text-emerald-800">
            Current Status: <span className="font-bold uppercase">{application?.status || "APPLIED"}</span>
          </p>
          <Link href="/jobs/applications" className="text-xs font-bold underline text-emerald-950 inline-block mt-2">
            View All My Applications
          </Link>
        </div>
      ) : user && isJobSeeker ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-gray-900">Apply for this Position</h3>
          <p className="text-xs text-gray-500">
            Your verified profile and skills will be automatically attached with this application.
          </p>

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
              <CheckCircle2 size={16} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Note to Employer (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly state your availability, experience, or equipment owned..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={applying}
              className="w-full sm:w-auto bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send size={16} />
              <span>{applying ? "Submitting..." : "Submit Application"}</span>
            </button>
          </form>
        </div>
      ) : user && !isJobSeeker ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center text-xs text-gray-600">
          You are signed in as {user.roles.join(", ")}. Only users with the <strong>Job Seeker</strong> role can apply to job listings. You can enable the Job Seeker role in your profile.
        </div>
      ) : null}
    </div>
  );
}

