"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  ExternalLink,
  ClipboardList,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function VerifierQueuePage() {
  const { isVerifier, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<"identity" | "pitches">("identity");
  const [identityQueue, setIdentityQueue] = useState<any[]>([]);
  const [pitchQueue, setPitchQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reviewType, setReviewType] = useState<"identity" | "pitch">("identity");
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifier checklist checkboxes
  const [checklist, setChecklist] = useState({
    nicValidFormat: true,
    dobMatchesNic: true,
    gramaDocAuthentic: true,
    businessProofVerified: true
  });

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const [idRes, pitchRes] = await Promise.all([
        api.get("/verification/queue?status=PENDING"),
        api.get("/pitches/verifier/queue")
      ]);
      if (idRes?.queue) setIdentityQueue(idRes.queue);
      if (pitchRes?.queue) setPitchQueue(pitchRes.queue);
    } catch (err) {
      console.error("Failed to load verification queues", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (item: any, type: "identity" | "pitch") => {
    setSelectedItem(item);
    setReviewType(type);
    setDecision("APPROVE");
    setRejectionReason("");
    setError(null);
    if (type === "identity") {
      setChecklist({
        nicValidFormat: item.nicFormat !== "INVALID",
        dobMatchesNic: item.dobMatch,
        gramaDocAuthentic: !!item.gramaNiladhariDocUrl,
        businessProofVerified: !!item.businessRegDocUrl
      });
    }
  };

  const handleSubmitDecision = async () => {
    if (decision === "REJECT" && !rejectionReason.trim()) {
      setError("A rejection reason is mandatory when declining a verification or pitch.");
      return;
    }

    setSubmittingReview(true);
    setError(null);

    try {
      if (reviewType === "identity") {
        await api.post(`/verification/${selectedItem.id}/review`, {
          decision,
          rejectionReason: decision === "REJECT" ? rejectionReason.trim() : undefined,
          checklist
        });
      } else {
        await api.post(`/pitches/${selectedItem.id}/review`, {
          decision,
          rejectionReason: decision === "REJECT" ? rejectionReason.trim() : undefined,
          checklist
        });
      }

      setSelectedItem(null);
      await fetchQueues();
    } catch (err: any) {
      setError(err.message || "Failed to submit review decision");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isVerifier && !isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
        <ShieldCheck className="mx-auto text-gray-400 mb-3" size={40} />
        <h2 className="text-lg font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 text-xs mt-1">
          This portal is reserved for appointed Sri Lankan Verification Officers and Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <FileCheck className="text-amber-700" size={26} />
          <span>Verifier Review Queue</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Inspect encrypted Sri Lankan NICs, Grama Niladhari certificates, DOB match logs, and micro-business pitch proposals.
        </p>

        {/* Tab switch */}
        <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setActiveTab("identity")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition ${
              activeTab === "identity"
                ? "bg-amber-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <UserCheck size={16} />
            <span>Identity & Business Requests ({identityQueue.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pitches")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition ${
              activeTab === "pitches"
                ? "bg-amber-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <TrendingUp size={16} />
            <span>Pitch Review Queue ({pitchQueue.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Identity & Business Verification Queue */}
      {activeTab === "identity" && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-medium">Loading identity queue...</div>
          ) : identityQueue.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
              <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={40} />
              <p className="font-bold text-gray-700">All identity verification requests have been processed!</p>
            </div>
          ) : (
            identityQueue.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="font-bold text-base text-gray-900">{item.fullName}</h2>
                    <p className="text-xs text-gray-500">
                      {item.email} • {item.phone || "No phone"} • District: <strong>{item.district}</strong>
                    </p>
                    <div className="flex gap-1 mt-1">
                      {item.roles.map((r: string) => (
                        <span key={r} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenReview(item, "identity")}
                    className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm"
                  >
                    Review & Decide
                  </button>
                </div>

                {/* Secure Decrypted Details for Verifier */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs">
                  <div>
                    <span className="text-amber-800 font-semibold block">Decrypted NIC:</span>
                    <span className="font-mono font-bold text-amber-950 text-sm tracking-wider">
                      {item.rawNic}
                    </span>
                    <span className="text-[10px] text-gray-500 block">Format: {item.nicFormat}</span>
                  </div>

                  <div>
                    <span className="text-amber-800 font-semibold block">System DOB Match:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] inline-block mt-0.5 ${
                        item.dobMatch
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-red-100 text-red-900"
                      }`}
                    >
                      {item.dobMatch ? "MATCHED (System-set)" : "DOB MISMATCH"}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      DOB: {new Date(item.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-amber-800 font-semibold block">Attached Documents:</span>
                    <div className="space-y-1 mt-0.5">
                      {item.gramaNiladhariDocUrl ? (
                        <a
                          href={`http://localhost:5000${item.gramaNiladhariDocUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-700 hover:underline flex items-center space-x-1 font-semibold"
                        >
                          <ExternalLink size={12} />
                          <span>Grama Niladhari Cert</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">No Grama Cert</span>
                      )}
                      {item.businessRegDocUrl && (
                        <a
                          href={`http://localhost:5000${item.businessRegDocUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-700 hover:underline flex items-center space-x-1 font-semibold"
                        >
                          <ExternalLink size={12} />
                          <span>Business Reg Doc</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Pitches Review Queue */}
      {activeTab === "pitches" && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-medium">Loading pitch queue...</div>
          ) : pitchQueue.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
              <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={40} />
              <p className="font-bold text-gray-700">All pending pitches have been reviewed!</p>
            </div>
          ) : (
            pitchQueue.map((pitch) => (
              <div
                key={pitch.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="font-bold text-base sm:text-lg text-gray-900">{pitch.title}</h2>
                    <p className="text-xs text-gray-500">
                      By: <strong>{pitch.entrepreneur?.fullName}</strong> ({pitch.entrepreneur?.email}) • District: <strong>{pitch.district?.nameEn}</strong> • Sector: <strong>{pitch.sector?.nameEn}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenReview(pitch, "pitch")}
                    className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm"
                  >
                    Review Pitch
                  </button>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-700 space-y-1">
                  <div className="flex justify-between font-bold text-teal-800">
                    <span>Target: Rs. {pitch.fundingNeeded?.toLocaleString()} ({pitch.fundingType})</span>
                    <span>Submitted: {new Date(pitch.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="line-clamp-3 leading-relaxed mt-1 text-gray-600">{pitch.story}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Review Modal Dialog */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              Verifier Decision: {reviewType === "identity" ? "Identity Verification" : "Pitch Review"}
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Checklist */}
            {reviewType === "identity" && (
              <div className="space-y-2 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-800 uppercase text-[11px]">Verification Checklist:</p>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={checklist.nicValidFormat}
                    onChange={(e) => setChecklist({ ...checklist, nicValidFormat: e.target.checked })}
                    className="rounded text-primary-600"
                  />
                  <span>NIC format conforms to DRP standard (old/new)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={checklist.dobMatchesNic}
                    onChange={(e) => setChecklist({ ...checklist, dobMatchesNic: e.target.checked })}
                    className="rounded text-primary-600"
                  />
                  <span>System DOB check confirmed match with NIC embedded birth date</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={checklist.gramaDocAuthentic}
                    onChange={(e) => setChecklist({ ...checklist, gramaDocAuthentic: e.target.checked })}
                    className="rounded text-primary-600"
                  />
                  <span>Grama Niladhari certificate stamp & division verified</span>
                </label>
              </div>
            )}

            {/* Decision Radio */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Decision</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision("APPROVE")}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition ${
                    decision === "APPROVE"
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>Approve & Publish</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("REJECT")}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition ${
                    decision === "REJECT"
                      ? "bg-red-700 text-white border-red-700 shadow-sm"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  <XCircle size={16} />
                  <span>Reject / Decline</span>
                </button>
              </div>
            </div>

            {/* Required Rejection Reason if rejecting */}
            {decision === "REJECT" && (
              <div>
                <label className="block text-xs font-bold text-red-700 uppercase mb-1">
                  Required Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify why this was rejected (e.g. NIC DOB mismatch, blurry Grama Niladhari certificate, incomplete business story)..."
                  className="w-full px-3 py-2 border border-red-300 rounded-lg text-xs"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSubmitDecision}
                className="px-5 py-2 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white rounded-xl shadow disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Confirm Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

