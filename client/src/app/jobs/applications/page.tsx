"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ClipboardList, Building2, MapPin, DollarSign, ArrowRight, Clock } from "lucide-react";
import { api } from "../../../lib/api";
import { VerifiedBadge } from "../../../components/VerifiedBadge";
import { useAuth } from "../../../context/AuthContext";

export default function MyApplicationsPage() {
  const { can, loading: authLoading, user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !can("application:view_own")) return;
    fetchApplications();
  }, [authLoading, can]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/jobs/my/applications");
      if (res?.applications) setApplications(res.applications);
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      APPLIED: "bg-blue-100 text-blue-800",
      REVIEWING: "bg-purple-100 text-purple-800",
      SHORTLISTED: "bg-amber-100 text-amber-800",
      ACCEPTED: "bg-emerald-100 text-emerald-800",
      REJECTED: "bg-red-100 text-red-800"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${map[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  if (authLoading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Loading account permissions...</div>;
  }

  if (!can("application:view_own")) {
    return <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6"><p className="font-bold text-gray-700">Job application history is available to Job Seekers.</p>{!user && <Link href="/login" className="mt-3 inline-block text-primary-700 font-bold text-xs">Sign In</Link>}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <ClipboardList className="text-primary-700" size={24} />
          <span>My Job Applications Tracker</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Monitor your job applications, interviews, shortlist status, and employer feedback.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <ClipboardList className="mx-auto text-gray-300 mb-2" size={36} />
          <p className="font-bold text-gray-700">You haven&apos;t submitted any job applications yet.</p>
          <Link href="/jobs" className="mt-2 inline-block text-xs font-bold text-primary-700 underline">
            Browse open jobs in your district
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-bold text-base sm:text-lg text-gray-900">
                      {app.job?.title}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                    <span className="font-semibold text-gray-800">
                      {app.job?.employer?.employerProfile?.companyName || app.job?.employer?.fullName}
                    </span>
                    <VerifiedBadge isVerified={app.job?.employer?.isVerified} size="sm" />
                    <span>• {app.job?.district?.nameEn}</span>
                  </div>
                </div>

                <div>{getStatusBadge(app.status)}</div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-1">
                <span>
                  Wage: Rs. {app.job?.wage?.toLocaleString()} / {app.job?.wageType}
                </span>
                <span>Applied on: {new Date(app.createdAt).toLocaleDateString()}</span>
                <Link
                  href={`/jobs/${app.job?.id}`}
                  className="font-bold text-primary-700 hover:underline flex items-center space-x-1"
                >
                  <span>View Posting</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
