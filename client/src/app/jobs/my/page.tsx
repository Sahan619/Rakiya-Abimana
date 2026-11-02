"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, PlusCircle, Users, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

export default function MyJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/jobs/my/posted");
      if (res?.jobs) setJobs(res.jobs);
    } catch (err) {
      console.error("Failed to load posted jobs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await api.patch(`/jobs/${jobId}/status`, { status: newStatus });
      fetchMyJobs();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Briefcase className="text-primary-700" size={24} />
            <span>My Posted Job Vacancies</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your open and closed positions, review candidates, and hire workers.
          </p>
        </div>

        <Link
          href="/jobs/post"
          className="inline-flex items-center space-x-2 bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow transition"
        >
          <PlusCircle size={18} />
          <span>Post New Job</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading your jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <Briefcase className="mx-auto text-gray-300 mb-2" size={40} />
          <p className="font-bold text-gray-700">You haven&apos;t posted any jobs yet.</p>
          <Link href="/jobs/post" className="text-xs font-bold text-primary-700 underline mt-2 inline-block">
            Post your first vacancy
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      job.status === "OPEN"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {job.status}
                  </span>
                  <span className="text-xs text-gray-500">{job.district?.nameEn}</span>
                </div>
                <h2 className="font-bold text-base sm:text-lg text-gray-900">{job.title}</h2>
                <div className="text-xs text-gray-600 flex items-center space-x-4">
                  <span>Wage: Rs. {job.wage?.toLocaleString()} / {job.wageType}</span>
                  <span className="font-semibold text-primary-700 flex items-center space-x-1">
                    <Users size={14} />
                    <span>{job._count?.applications || 0} applicants</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <Link
                  href={`/jobs/${job.id}/applicants`}
                  className="bg-primary-50 text-primary-800 hover:bg-primary-100 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
                >
                  <Users size={16} />
                  <span>Review Applicants ({job._count?.applications || 0})</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(job.id, job.status)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    job.status === "OPEN"
                      ? "border-red-200 text-red-700 hover:bg-red-50"
                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {job.status === "OPEN" ? "Close Job" : "Reopen Job"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
