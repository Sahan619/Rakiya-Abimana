"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, Filter, ArrowLeft, ShieldCheck, Phone, Mail, MapPin, MessageSquare, Check, X } from "lucide-react";
import { api } from "../../../../lib/api";
import { VerifiedBadge } from "../../../../components/VerifiedBadge";

export default function JobApplicantsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [applicants, setApplicants] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/master/districts").then((res) => {
      if (res?.districts) setDistricts(res.districts);
    });
    fetchApplicants();
  }, [id]);

  const fetchApplicants = async (districtId = "", skills = "") => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (districtId) q.append("districtId", districtId);
      if (skills) q.append("skills", skills);

      const res = await api.get(`/jobs/${id}/applicants?${q.toString()}`);
      if (res?.applicants) setApplicants(res.applicants);
    } catch (err) {
      console.error("Failed to load applicants", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await api.patch(`/jobs/applications/${appId}/status`, { status: newStatus });
      fetchApplicants(selectedDistrict, skillFilter);
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/jobs/my" className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-black">
        <ArrowLeft size={16} />
        <span>Back to My Posted Jobs</span>
      </Link>

      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Users className="text-primary-700" size={24} />
          <span>Job Applicants Review</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Filter and review applicants who applied for this vacancy. Update their status to notify them.
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                fetchApplicants(e.target.value, skillFilter);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
            >
              <option value="">All Candidate Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="text"
              placeholder="Filter by skill keyword..."
              value={skillFilter}
              onChange={(e) => {
                setSkillFilter(e.target.value);
                fetchApplicants(selectedDistrict, e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>

          <div className="text-right flex items-center justify-end text-xs text-gray-500 font-semibold">
            <span>Total Candidates: {applicants.length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading applicants...</div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <Users className="mx-auto text-gray-300 mb-2" size={36} />
          <p className="font-bold text-gray-700">No applicants found for this job yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applicants.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-bold text-base text-gray-900">{app.applicant.fullName}</h2>
                    <VerifiedBadge isVerified={app.applicant.isVerified} size="sm" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin size={13} />
                      <span>{app.applicant.district?.nameEn || "N/A"}</span>
                    </span>
                    {app.applicant.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone size={13} />
                        <span>{app.applicant.phone}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Mail size={13} />
                      <span>{app.applicant.email}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Status:</span>
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="text-xs font-bold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="APPLIED">APPLIED</option>
                    <option value="REVIEWING">REVIEWING</option>
                    <option value="SHORTLISTED">SHORTLISTED</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              {/* Profile Details */}
              {app.applicant.jobSeekerProfile && (
                <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1.5 text-gray-700">
                  <p>
                    <strong>Trade:</strong> {app.applicant.jobSeekerProfile.trade || "General"} |{" "}
                    <strong>Experience:</strong> {app.applicant.jobSeekerProfile.experienceYears} years |{" "}
                    <strong>Category:</strong> {app.applicant.jobSeekerProfile.category}
                  </p>
                  <p>
                    <strong>Skills:</strong> {app.applicant.jobSeekerProfile.skills}
                  </p>
                  {app.applicant.jobSeekerProfile.bio && (
                    <p className="italic text-gray-600">&quot;{app.applicant.jobSeekerProfile.bio}&quot;</p>
                  )}
                </div>
              )}

              {app.notes && (
                <div className="text-xs text-gray-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-900">Applicant Note: </span>
                  {app.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
