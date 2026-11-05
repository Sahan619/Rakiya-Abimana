"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  MapPin,
  DollarSign,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  ShieldAlert
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { api } from "../../../lib/api";
import { VerifiedBadge } from "../../../components/VerifiedBadge";
import { MachineTranslationNotice } from "../../../components/MachineTranslationNotice";

export default function PitchDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, can, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();

  const [pitch, setPitch] = useState<any>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState("");
  const [pledgeMessage, setPledgeMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingPledge, setSubmittingPledge] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasPitchAccess = can("pitch:browse_approved") || can("pitch:manage_own") || can("pitch:review");

  useEffect(() => {
    if (authLoading) return;
    if (id && hasPitchAccess) {
      fetchPitch();
    } else {
      setLoading(false);
    }
  }, [id, locale, authLoading, hasPitchAccess]);

  const fetchPitch = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/pitches/${id}?lang=${locale}`);
      if (res?.pitch) setPitch(res.pitch);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load pitch details");
    } finally {
      setLoading(false);
    }
  };

  const handlePledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    setSubmittingPledge(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.post(`/pitches/${id}/interest`, {
        pledgeAmount: pledgeAmount ? parseFloat(pledgeAmount) : null,
        message: pledgeMessage
      });
      setSuccessMsg(res.message || "Your funding interest has been registered!");
      setPledgeAmount("");
      setPledgeMessage("");
      fetchPitch();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to express funding interest");
    } finally {
      setSubmittingPledge(false);
    }
  };

  const handleStartMessage = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await api.post("/messages/conversations", {
        recipientId: pitch.entrepreneur.id,
        type: "PITCH_INTEREST",
        referenceId: pitch.id
      });
      if (res?.conversation) {
        router.push(`/inbox/${res.conversation.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start conversation");
    }
  };

  if (authLoading) {
    return <div className="text-center py-12 font-medium text-gray-500">Checking access...</div>;
  }

  if (!hasPitchAccess) {
    return <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6"><p className="font-bold text-gray-700">{user ? "Pitch details are not available to this account." : "Sign in to browse approved pitches."}</p>{!user && <Link href="/login" className="mt-3 inline-block text-teal-700 font-bold text-xs">Sign In</Link>}</div>;
  }

  if (loading) {
    return <div className="text-center py-12 font-medium text-gray-500">Loading pitch details...</div>;
  }

  if (!pitch) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
        <p className="font-bold text-gray-700">Pitch proposal not found.</p>
        <Link href="/pitches" className="text-teal-700 text-sm font-bold underline mt-2 inline-block">
          Back to Pitches
        </Link>
      </div>
    );
  }

  const titleToDisplay = showOriginal ? pitch.originalTitle : pitch.title;
  const storyToDisplay = showOriginal ? pitch.originalStory : pitch.story;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/pitches" className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-black">
        <ArrowLeft size={16} />
        <span>Back to Pitches</span>
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-block bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold px-2.5 py-0.5 rounded uppercase">
                {pitch.fundingType === "MICRO_LOAN" ? "Micro-Loan" : "Grant"}
              </span>
              <span className="text-xs font-semibold text-gray-500">{pitch.sector?.nameEn}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
              {titleToDisplay}
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm font-semibold text-gray-800">{pitch.entrepreneur.fullName}</span>
              <VerifiedBadge isVerified={pitch.entrepreneur.isVerified} size="sm" />
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-xl sm:text-2xl font-black text-teal-800 block">
              Rs. {pitch.fundingNeeded?.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 uppercase font-semibold">Funding Target (LKR)</span>
          </div>
        </div>

        <MachineTranslationNotice
          isMachineTranslated={pitch.isMachineTranslated}
          showOriginal={showOriginal}
          onToggle={() => setShowOriginal(!showOriginal)}
          sourceLanguage={pitch.sourceLanguage}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <span className="text-gray-500 block">District:</span>
            <span className="font-bold text-gray-800">{pitch.district?.nameEn}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Funding Type:</span>
            <span className="font-bold text-gray-800">{pitch.fundingType}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Verification Status:</span>
            <span className="font-bold text-emerald-700">{pitch.status}</span>
          </div>
        </div>

        {/* Business Story */}
        <div>
          <h2 className="text-sm font-bold uppercase text-gray-700 mb-2">Micro-Business Story & Plan</h2>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-gray-100">
            {storyToDisplay}
          </div>
        </div>

        {/* Informational Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl">
          ⚠️ <strong>No direct payments or financial transactions take place on this platform.</strong> Funders express interest and pledge non-binding financial or advisory support. Further legal agreements and disbursements happen independently.
        </div>

        {/* Message Entrepreneur */}
        {user && can("chat:use") && can("pitch:express_interest") && user.id !== pitch.entrepreneur.id && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleStartMessage}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-gray-300 text-gray-800 font-bold text-xs hover:bg-gray-50 shadow-sm"
            >
              <MessageSquare size={16} />
              <span>Contact Entrepreneur</span>
            </button>
          </div>
        )}
      </div>

      {/* Funder Pledge Interest Form */}
      {can("pitch:express_interest") && (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
          <HeartHandshake className="text-teal-700" size={22} />
          <span>Express Funding Interest / Pledge</span>
        </h2>
        <p className="text-xs text-gray-500">
          Are you a CSR program, diaspora donor, or microfinance provider? Connect with this entrepreneur to support their venture.
        </p>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePledgeSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Indicative Pledge Amount (LKR) - Optional
            </label>
            <input
              type="number"
              min="0"
              value={pledgeAmount}
              onChange={(e) => setPledgeAmount(e.target.value)}
              placeholder="e.g. 100000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Message to Entrepreneur *
            </label>
            <textarea
              required
              rows={3}
              value={pledgeMessage}
              onChange={(e) => setPledgeMessage(e.target.value)}
              placeholder="Explain how you can support (funding, equipment, business mentorship, grant terms)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submittingPledge}
            className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <HeartHandshake size={18} />
            <span>{submittingPledge ? "Submitting..." : "Submit Funding Expression"}</span>
          </button>
        </form>

      </div>
      )}

      {can("pitch:manage_own") && user?.id === pitch.entrepreneur.id && pitch.interests?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-bold text-gray-700 uppercase mb-3">Registered Funder Expressions ({pitch.interests.length}):</h2>
          <div className="space-y-2">
            {pitch.interests.map((interest: any) => (
              <div key={interest.id} className="bg-gray-50 p-3 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">{interest.funder?.fullName}</span>
                  {interest.pledgeAmount && <span className="font-bold text-teal-800">Pledged: Rs. {interest.pledgeAmount.toLocaleString()}</span>}
                </div>
                <p className="text-gray-600">{interest.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
