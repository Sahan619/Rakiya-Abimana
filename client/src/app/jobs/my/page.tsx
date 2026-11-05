"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Briefcase,
  PlusCircle,
  Users,
  CheckCircle,
  XCircle,
  Pencil,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { api } from "../../../lib/api";

interface District {
  id: string;
  nameEn: string;
  nameSi?: string;
  nameTa?: string;
}

interface JobItem {
  id: string;
  title: string;
  category: string;
  districtId: string;
  district?: District;
  wage: number;
  wageType: string;
  description: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  _count?: {
    applications: number;
  };
}

export default function MyJobsPage() {
  const { user, can, isEmployer, loading: authLoading } = useAuth();
  const { locale } = useLanguage();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Edit Modal State
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("blue-collar");
  const [editDistrictId, setEditDistrictId] = useState("");
  const [editWage, setEditWage] = useState("");
  const [editWageType, setEditWageType] = useState("MONTHLY");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchMyJobs = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      // The API filters by the authenticated user's employerId.
      const res = await api.get<{ jobs: JobItem[] }>(`/jobs/my/posted?cacheBust=${Date.now()}`);
      setJobs(res?.jobs || []);
    } catch (err: any) {
      console.error("Failed to load posted jobs", err);
      setPageError(err.message || "Failed to load your job postings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !can("job:manage_own")) {
      setJobs([]);
      setLoading(false);
      return;
    }

    // Do not keep the previous account's jobs visible while the new account loads.
    setJobs([]);
    fetchMyJobs();
    api.get("/master/districts").then((res: any) => {
      if (res?.districts) setDistricts(res.districts);
    }).catch(() => {});
  }, [authLoading, user, can, fetchMyJobs]);

  const handleToggleStatus = async (jobId: string, currentStatus: "OPEN" | "CLOSED") => {
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await api.patch(`/jobs/${jobId}/status`, { status: newStatus });
      setPageMessage(`Job status updated to ${newStatus}.`);
      fetchMyJobs();
    } catch (err: any) {
      setPageError(err.message || "Failed to update job status.");
    }
  };

  const openEditModal = (job: JobItem) => {
    setEditingJob(job);
    setEditTitle(job.title || "");
    setEditCategory(job.category || "blue-collar");
    setEditDistrictId(job.districtId || "");
    setEditWage(String(job.wage ?? ""));
    setEditWageType(job.wageType || "MONTHLY");
    setEditDescription(job.description || "");
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingJob(null);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    if (!editTitle.trim()) {
      setEditError("Job title is required.");
      return;
    }
    if (!editDescription.trim() || editDescription.trim().length < 10) {
      setEditError("Job description must be at least 10 characters.");
      return;
    }
    const wageNum = parseFloat(editWage);
    if (isNaN(wageNum) || wageNum < 0) {
      setEditError("Please enter a valid non-negative wage amount.");
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    try {
      await api.put(`/jobs/${editingJob.id}`, {
        title: editTitle.trim(),
        category: editCategory,
        districtId: editDistrictId,
        wage: wageNum,
        wageType: editWageType,
        description: editDescription.trim()
      });

      setPageMessage(`Job "${editTitle.trim()}" updated successfully!`);
      closeEditModal();
      await fetchMyJobs();
    } catch (err: any) {
      setEditError(err.message || "Failed to update job posting. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const isAuthorizedToPost = can("job:create");

  const pageHeading = isEmployer
    ? "My Posted Job Vacancies"
    : "My Job Postings";

  const pageDescription = "Manage your open and closed positions, review candidates, and hire workers.";

  if (authLoading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Loading your workspace...</div>;
  }

  if (!user) {
    return <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6"><p className="font-bold text-gray-700">Please sign in to manage job listings.</p><Link href="/login" className="mt-3 inline-block bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-lg">Sign In</Link></div>;
  }

  if (!can("job:manage_own")) {
    return <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6"><p className="font-bold text-gray-700">This workspace is available to Employers managing their own jobs.</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="surface-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <Briefcase size={22} />
            </span>
            <span>{pageHeading}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {pageDescription}
          </p>
        </div>

        {isAuthorizedToPost && (
          <Link
            href="/jobs/post"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 shrink-0"
          >
            <PlusCircle size={18} />
            <span>Post a New Job</span>
          </Link>
        )}
      </div>

      {/* Global Page Messages */}
      {pageMessage && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span className="font-medium">{pageMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setPageMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {pageError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
            <span className="font-medium">{pageError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPageError(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Job Postings Content */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="surface-card h-40 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="surface-card p-10 sm:p-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
            <Briefcase size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">You haven&apos;t posted any jobs yet</h2>
          <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
            Create a job opening to reach qualified candidates across Sri Lanka.
          </p>

          {isAuthorizedToPost ? (
            <div className="mt-6">
              <Link
                href="/jobs/post"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800"
              >
                <PlusCircle size={17} />
                <span>Create Your First Job Opening</span>
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <Link
                href="/jobs"
                className="text-xs font-semibold text-primary-700 underline"
              >
                Browse Public Jobs Marketplace
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => {
            const applicantsCount = job._count?.applications || 0;
            const isOpen = job.status === "OPEN";

            return (
              <article
                key={job.id}
                className="surface-card p-5 sm:p-6 transition hover:border-slate-300 hover:shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                          isOpen
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-800 border border-primary-200">
                        {job.category.replace(/-/g, " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        Posted {new Date(job.createdAt).toLocaleDateString(locale)}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {job.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{job.district?.nameEn || "Sri Lanka"}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                        <Wallet size={14} className="text-primary-700" />
                        <span>LKR {job.wage?.toLocaleString()}</span>
                        <span className="font-normal text-slate-500">/ {job.wageType?.toLowerCase()}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-semibold text-primary-800">
                        <Users size={14} className="text-primary-600" />
                        <span>{applicantsCount} {applicantsCount === 1 ? "applicant" : "applicants"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Public Link */}
                  <Link
                    href={`/jobs/${job.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-700 transition self-start sm:self-auto"
                  >
                    <span>View Posting</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>

                {job.description && (
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                )}

                {/* Management Action Buttons: Edit Job, Review Applicants, Status Toggle */}
                <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* EDIT JOB BUTTON (Replaces Apply button) */}
                    <button
                      type="button"
                      onClick={() => openEditModal(job)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-800"
                    >
                      <Pencil size={14} />
                      <span>Edit Job</span>
                    </button>

                    {/* REVIEW APPLICANTS */}
                    {can("applicant:view") && (
                      <Link
                        href={`/jobs/${job.id}/applicants`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Users size={14} className="text-slate-500" />
                        <span>Review Applicants ({applicantsCount})</span>
                      </Link>
                    )}
                  </div>

                  {/* TOGGLE STATUS */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(job.id, job.status)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                      isOpen
                        ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {isOpen ? (
                      <>
                        <XCircle size={14} />
                        <span>Close Vacancy</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        <span>Reopen Vacancy</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-job-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
        >
          <div className="surface-card w-full max-w-2xl p-6 sm:p-8 relative my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 id="edit-job-title" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Pencil size={18} className="text-primary-700" />
                  <span>Edit Job Opening</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update role details, category, location, salary or description.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingEdit}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message inside Modal */}
            {editError && (
              <div role="alert" className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span className="font-medium">{editError}</span>
              </div>
            )}

            {/* Edit Form */}
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
                  placeholder="e.g. Master Carpenter or Solar Installation Technician"
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
                    <option value="blue-collar">Blue Collar & General Labor</option>
                    <option value="skilled-trades">Skilled Tradesperson</option>
                    <option value="white-collar">White Collar & Administrative</option>
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
                    placeholder="65000"
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
                  placeholder="Outline responsibilities, schedule, necessary experience, tools required..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
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
