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
  Clock,
  Pencil,
  Users,
  ShieldCheck,
  X
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
  const { user, can, loading: authLoading } = useAuth();
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
  const [districts, setDistricts] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; nameEn: string }[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("skilled-trades-technical-services");
  const [editDistrictId, setEditDistrictId] = useState("");
  const [editWage, setEditWage] = useState("");
  const [editWageType, setEditWageType] = useState("MONTHLY");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/master/districts").then((res: any) => {
      if (res?.districts) setDistricts(res.districts);
    }).catch(() => {});
    api.get("/master/categories").then((res: any) => {
      if (res?.categories) setCategories(res.categories);
    }).catch(() => {});
  }, []);

  const openEditModal = () => {
    if (!job) return;
    setEditTitle(job.title || "");
    setEditCategory(job.category || "skilled-trades-technical-services");
    setEditDistrictId(job.districtId || "");
    setEditWage(String(job.wage ?? ""));
    setEditWageType(job.wageType || "MONTHLY");
    setEditDescription(job.description || "");
    setEditError(null);
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      await api.put(`/jobs/${job.id}`, {
        title: editTitle.trim(),
        category: editCategory,
        districtId: editDistrictId,
        wage: parseFloat(editWage),
        wageType: editWageType,
        description: editDescription.trim()
      });
      setMessage("Job updated successfully!");
      setEditOpen(false);
      await fetchJob();
    } catch (err: any) {
      setEditError(err.message || "Failed to update job");
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (id && can("job:view_detail")) {
      fetchJob();
    } else {
      setLoading(false);
    }
  }, [id, locale, authLoading, can]);

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

  if (authLoading) {
    return <div className="text-center py-12 font-medium text-gray-500">Checking access...</div>;
  }

  if (!can("job:view_detail")) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
        <p className="font-bold text-gray-700">{user ? "Job details are not available to this account." : "Sign in to view job details and apply."}</p>
        {!user && <Link href="/login" className="mt-3 inline-block bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-lg">Sign In</Link>}
        <Link href="/jobs" className="mt-3 block text-primary-700 text-xs font-bold underline">Browse jobs</Link>
      </div>
    );
  }

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
                  {categories.find((category) => category.id === job.category)?.nameEn || job.category?.replace(/-/g, " ")}
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
          {user && can("job:manage_own") && user.id === job.employer.id ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-800"
              >
                <Pencil size={14} />
                <span>Edit Job</span>
              </button>
              {can("applicant:view") && (
                <Link
                  href={`/jobs/${job.id}/applicants`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Users size={14} />
                  <span>Review Applicants</span>
                </Link>
              )}
            </div>
          ) : user && can("chat:use") && can("job:apply") && user.id !== job.employer.id ? (
            <button
              type="button"
              onClick={handleStartMessage}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-800 font-bold text-xs hover:bg-gray-50 shadow-sm"
            >
              <MessageSquare size={16} />
              <span>Message Employer</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Application / Ownership Box */}
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
      ) : user && can("job:manage_own") && user.id === job.employer.id ? (
        <div className="surface-card p-6 border-primary-200 bg-primary-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-900 font-bold text-sm">
              <ShieldCheck size={18} className="text-primary-700" />
              <span>You created this job posting</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Owner Controls</span>
          </div>
          <p className="text-xs text-slate-600">
            You can modify vacancy requirements, offered wage, district location, or review candidates who have submitted applications.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-800"
            >
              <Pencil size={14} />
              <span>Edit Job Details</span>
            </button>
            {can("applicant:view") && (
              <Link
                href={`/jobs/${job.id}/applicants`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Users size={14} />
                <span>Review Applicants</span>
              </Link>
            )}
            <Link
              href="/jobs/my"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Briefcase size={14} />
              <span>Manage My Jobs</span>
            </Link>
          </div>
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
      ) : user && can("job:apply") ? (
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
      ) : user ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-600">
          You are viewing this listing as a registered <strong>{user.roles.join(", ")}</strong>. Job applications are reserved for certified <strong>Job Seekers</strong>.
        </div>
      ) : null}

      {/* Edit Job Modal */}
      {editOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
        >
          <div className="surface-card w-full max-w-2xl p-6 sm:p-8 relative my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Pencil size={18} className="text-primary-700" />
                  <span>Edit Job Opening</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update role details, category, location, salary or description.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={savingEdit}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div role="alert" className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span className="font-medium">{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  >
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.nameEn}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Job District *
                  </label>
                  <select
                    required
                    value={editDistrictId}
                    onChange={(e) => setEditDistrictId(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Offered Wage (LKR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editWage}
                    onChange={(e) => setEditWage(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Wage Basis *
                  </label>
                  <select
                    value={editWageType}
                    onChange={(e) => setEditWageType(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="DAILY">Daily</option>
                    <option value="PIECE_RATE">Piece Rate</option>
                    <option value="HOURLY">Hourly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Description & Candidate Requirements *
                </label>
                <textarea
                  required
                  rows={5}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={savingEdit}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{savingEdit ? "Saving Changes..." : "Save Job Updates"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
