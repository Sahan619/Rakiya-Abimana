"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Key, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      router.push("/jobs");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary-100 text-primary-800 rounded-xl flex items-center justify-center mx-auto mb-3">
          <LogIn size={26} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {t("auth.loginTitle", "Sign In to Your Account")}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Access verified jobs, micro-business funding, and in-app messages.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-lg flex items-start space-x-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            {t("auth.email", "Email Address")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            {t("auth.password", "Password")}
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 px-4 rounded-xl text-sm shadow transition disabled:opacity-50 mt-2"
        >
          {loading ? t("common.loading", "Signing In...") : t("common.signIn", "Sign In")}
        </button>
      </form>

      {/* Demo Credentials Helper Box */}
      <div className="mt-6 pt-5 border-t border-gray-200 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p className="font-bold text-gray-800 mb-1">🔑 Demo Accounts (Password: Password123!):</p>
        <ul className="space-y-1 text-[11px]">
          <li><strong>Admin:</strong> admin@rakiya.lk</li>
          <li><strong>Verifier:</strong> verifier@rakiya.lk</li>
          <li><strong>Job Seeker:</strong> kamal.seeker@rakiya.lk</li>
          <li><strong>Employer:</strong> sunil.employer@rakiya.lk</li>
          <li><strong>Entrepreneur:</strong> anura.entrepreneur@rakiya.lk</li>
          <li><strong>Funder:</strong> lanka.funder@rakiya.lk</li>
        </ul>
      </div>

      <div className="mt-5 text-center text-xs text-gray-500">
        <span>{t("auth.noAccount", "Don't have an account?")} </span>
        <Link href="/register" className="font-bold text-primary-700 hover:underline">
          {t("common.register", "Register Here")}
        </Link>
      </div>
    </div>
  );
}

