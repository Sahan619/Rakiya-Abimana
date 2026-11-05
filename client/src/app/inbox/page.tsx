"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, User, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import { VerifiedBadge } from "../../components/VerifiedBadge";

export default function InboxPage() {
  const { user, can, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !can("chat:use")) return;
    fetchConversations();
  }, [authLoading, can]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/messages/conversations");
      if (res?.conversations) setConversations(res.conversations);
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Checking access...</div>;
  }

  if (!can("chat:use")) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
        <p className="font-bold text-gray-700">{user ? "Messaging is not available to this account." : "Please sign in to view your messages."}</p>
        {!user && <Link href="/login" className="mt-3 inline-block bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-lg">
          Sign In
        </Link>}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <MessageSquare className="text-primary-700" size={24} />
          <span>{t("inbox.title", "Messages & In-App Translation")}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {t("inbox.autoTranslateNotice", "Messages are automatically translated into your preferred language with the original message shown beside it.")}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <MessageSquare className="mx-auto text-gray-300 mb-2" size={40} />
          <p className="font-bold text-gray-700">No active conversations yet.</p>
          <p className="text-gray-400 text-xs mt-1">Start a conversation from any job or pitch page.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/inbox/${conv.id}`}
              className="p-5 flex items-center justify-between hover:bg-gray-50 transition block"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-sm">
                  {conv.otherUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-gray-900">{conv.otherUser.fullName}</span>
                    <VerifiedBadge isVerified={conv.otherUser.isVerified} size="sm" showLabel={false} />
                  </div>
                  {conv.otherUser.companyName && (
                    <span className="text-[11px] text-gray-500 block">{conv.otherUser.companyName}</span>
                  )}
                  {conv.lastMessage && (
                    <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                      {conv.lastMessage.translatedContent || conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Clock size={12} />
                <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                <ArrowRight size={14} className="text-gray-400 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
