"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, PlusCircle, ArrowRight, HeartHandshake, CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function MyPitchesPage() {
  const { can, loading: authLoading, user } = useAuth();
  const [pitches, setPitches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !can("pitch:manage_own")) return;
    fetchMyPitches();
  }, [authLoading, can]);

  const fetchMyPitches = async () => {
    setLoading(true);
    try {
      const res = await api.get("/pitches/my");
      if (res?.pitches) setPitches(res.pitches);
    } catch (err) {
      console.error("Failed to fetch your pitches", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; class: string }> = {
      APPROVED: { label: "Approved & Live", class: "bg-emerald-100 text-emerald-800" },
      PENDING_REVIEW: { label: "Pending Verifier Review", class: "bg-amber-100 text-amber-800" },
      REJECTED: { label: "Declined", class: "bg-red-100 text-red-800" },
      DRAFT: { label: "Draft", class: "bg-gray-100 text-gray-800" }
    };
    const s = map[status] || { label: status, class: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${s.class}`}>
        {s.label}
      </span>
    );
  };

  if (authLoading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Loading account permissions...</div>;
  }

  if (!can("pitch:manage_own")) {
    return <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6"><p className="font-bold text-gray-700">This workspace is available to Entrepreneurs managing their pitches.</p>{!user && <Link href="/login" className="mt-3 inline-block text-teal-700 font-bold text-xs">Sign In</Link>}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="text-teal-700" size={24} />
            <span>My Micro-Business Funding Pitches</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track verification review status and funder pledges on your proposals.
          </p>
        </div>

        <Link
          href="/pitches/create"
          className="inline-flex items-center space-x-2 bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow transition"
        >
          <PlusCircle size={18} />
          <span>New Pitch</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading your pitches...</div>
      ) : pitches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <TrendingUp className="mx-auto text-gray-300 mb-2" size={40} />
          <p className="font-bold text-gray-700">You haven&apos;t submitted any pitches yet.</p>
          <Link href="/pitches/create" className="text-xs font-bold text-teal-700 underline mt-2 inline-block">
            Start your first micro-business pitch
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pitches.map((pitch) => (
            <div
              key={pitch.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-gray-900">{pitch.title}</h2>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                    <span>{pitch.district?.nameEn}</span>
                    <span>• {pitch.sector?.nameEn}</span>
                    <span>• Type: {pitch.fundingType}</span>
                    <span className="font-bold text-teal-800">Target: Rs. {pitch.fundingNeeded?.toLocaleString()}</span>
                  </div>
                </div>

                <div>{getStatusBadge(pitch.status)}</div>
              </div>

              {/* Rejection reason notice if rejected */}
              {pitch.status === "REJECTED" && pitch.rejectionReason && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl">
                  <strong>Verifier Feedback / Reason: </strong>
                  {pitch.rejectionReason}
                </div>
              )}

              {/* Pledges strip */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-600 flex items-center space-x-1.5 font-medium">
                  <HeartHandshake size={15} className="text-teal-700" />
                  <span>{pitch.interests?.length || 0} Funder Expressions Received</span>
                </span>

                <Link
                  href={`/pitches/${pitch.id}`}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center space-x-1"
                >
                  <span>View Public Pitch</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Expand received funder pledges */}
              {pitch.interests && pitch.interests.length > 0 && (
                <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100 text-xs space-y-2 mt-2">
                  <span className="font-bold text-teal-900 block">Pledges from Funders:</span>
                  {pitch.interests.map((int: any) => (
                    <div key={int.id} className="bg-white p-2.5 rounded-lg border border-teal-100">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>{int.funder?.fullName}</span>
                        {int.pledgeAmount && (
                          <span className="text-teal-800">Pledged: Rs. {int.pledgeAmount.toLocaleString()}</span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{int.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
