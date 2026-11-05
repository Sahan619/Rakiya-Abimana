"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ShieldCheck, ClipboardList, MessageSquare, HeartHandshake, Info } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function NotificationsPage() {
  const { can, loading: authLoading, user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !can("notification:view_own")) return;
    fetchNotifications();
  }, [authLoading, can]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      if (res?.notifications) setNotifications(res.notifications);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "VERIFICATION":
        return <ShieldCheck size={20} className="text-emerald-700" />;
      case "APPLICATION":
        return <ClipboardList size={20} className="text-blue-700" />;
      case "MESSAGE":
        return <MessageSquare size={20} className="text-purple-700" />;
      case "PLEDGE":
        return <HeartHandshake size={20} className="text-teal-700" />;
      default:
        return <Info size={20} className="text-gray-700" />;
    }
  };

  if (authLoading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Checking access...</div>;
  }

  if (!can("notification:view_own")) {
    return <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-gray-200 p-6"><p className="font-bold text-gray-700">{user ? "Notifications are not available to this account." : "Please sign in to view notifications."}</p>{!user && <Link href="/login" className="mt-3 inline-block text-primary-700 font-bold text-xs">Sign In</Link>}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Bell className="text-primary-700" size={24} />
            <span>Notifications Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Stay informed on identity verifications, job applications, messages, and funding interest.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1.5 text-xs font-bold text-primary-700 hover:bg-primary-50 px-3 py-2 rounded-xl transition"
          >
            <CheckCheck size={16} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <Bell className="mx-auto text-gray-300 mb-2" size={36} />
          <p className="font-bold text-gray-700">No notifications to display.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && handleMarkSingleRead(notif.id)}
              className={`p-4 sm:p-5 flex items-start space-x-3 transition ${
                notif.isRead ? "bg-white" : "bg-emerald-50/40"
              }`}
            >
              <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900">{notif.title}</h3>
                  <span className="text-[11px] text-gray-400">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
                {notif.link && (
                  <Link
                    href={notif.link}
                    className="text-xs font-bold text-primary-700 hover:underline inline-block pt-1"
                  >
                    View Details →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
