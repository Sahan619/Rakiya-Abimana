"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Send, ArrowLeft, Languages, User, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { api } from "../../../lib/api";
import { VerifiedBadge } from "../../../components/VerifiedBadge";

export default function ConversationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const { t, locale } = useLanguage();

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) fetchMessages();
  }, [id, locale]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/conversations/${id}`);
      if (res) {
        setConversation(res.conversation);
        setMessages(res.messages);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await api.post(`/messages/conversations/${id}`, {
        content: newMessage.trim(),
        sourceLanguage: locale || "en"
      });
      setNewMessage("");
      await fetchMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Loading conversation...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Conversation Top Header */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/inbox" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-sm">
            {conversation?.otherUser?.fullName?.charAt(0) || "U"}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-gray-900">{conversation?.otherUser?.fullName}</span>
              <VerifiedBadge isVerified={conversation?.otherUser?.isVerified} size="sm" showLabel={false} />
            </div>
            {conversation?.otherUser?.employerProfile?.companyName && (
              <span className="text-[11px] text-gray-500 block">
                {conversation.otherUser.employerProfile.companyName}
              </span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200 flex items-center space-x-1">
          <Languages size={13} className="text-primary-700" />
          <span>Reader Lang: {locale.toUpperCase()}</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm min-h-[400px] max-h-[550px] overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            Start the conversation by sending a message below.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;

            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-sm text-xs sm:text-sm space-y-1.5 ${
                    isMe
                      ? "bg-primary-700 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {/* Primary text shown in reader's language */}
                  <p className="font-medium leading-relaxed">
                    {msg.translatedContent || msg.originalContent}
                  </p>

                  {/* Side-by-side / subordinate display of original text if translated */}
                  {msg.isMachineTranslated && (
                    <div
                      className={`text-[11px] pt-1 border-t ${
                        isMe ? "border-primary-600 text-primary-100" : "border-gray-200 text-gray-500"
                      }`}
                    >
                      <span className="font-semibold block">
                        Original ({msg.originalLanguage?.toUpperCase()}):
                      </span>
                      <p className="italic">{msg.originalContent}</p>
                    </div>
                  )}

                  <span
                    className={`block text-[10px] text-right mt-1 ${
                      isMe ? "text-primary-200" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSendMessage} className="bg-white border border-gray-200 p-3 rounded-2xl shadow-sm flex items-center space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t("inbox.typeMessage", "Type a message in your language...")}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-primary-700 hover:bg-primary-800 text-white p-2.5 rounded-xl shadow transition disabled:opacity-40"
          title={t("inbox.send", "Send")}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

