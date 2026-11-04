"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, KeyRound, Leaf, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const demoAccounts = [
  ["Admin", "admin@rakiya.lk"],
  ["Verifier", "verifier@rakiya.lk"],
  ["Job seeker", "kamal.seeker@rakiya.lk"],
  ["Employer", "sunil.employer@rakiya.lk"],
  ["Entrepreneur", "anura.entrepreneur@rakiya.lk"],
  ["Funder", "lanka.funder@rakiya.lk"]
];

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const signedInUser = await login({ email, password });
      if (signedInUser.roles.includes("Admin")) router.push("/admin");
      else if (signedInUser.roles.includes("Verifier")) router.push("/verifier");
      else router.push("/jobs");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgb(21_32_51/8%)] lg:grid-cols-[.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-[#173e2e] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-20 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full border border-white/10" />
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#e2c382]"><Leaf size={24} /></div>
          <p className="mt-10 text-xs font-bold uppercase tracking-[.18em] text-[#e2c382]">Rakiya-Abimana</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">The next step in your journey starts here.</h1>
          <p className="mt-4 text-sm leading-6 text-white/70">Sign in to explore jobs, manage your proposals, and connect with opportunities.</p>
        </div>
        <div className="relative space-y-3 rounded-2xl border border-white/10 bg-white/[.06] p-5">
          <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-[#e2c382]" />Find a place to grow</p>
          <p className="flex items-center gap-2 text-sm text-white/70"><BriefcaseBusiness size={16} />Discover work opportunities</p>
          <p className="flex items-center gap-2 text-sm text-white/70"><ShieldCheck size={16} />Connect through a trusted platform</p>
          <p className="pt-1 text-xs text-white/50">English · සිංහල · தமிழ்</p>
        </div>
      </aside>

      <section className="p-6 sm:p-9 lg:p-11">
        <div className="mb-8 lg:hidden">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-800"><Leaf size={21} /></span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-primary-700">Welcome back</p>
        </div>
        <div>
          <p className="hidden text-xs font-bold uppercase tracking-[.18em] text-primary-700 lg:block">Welcome back</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{t("auth.loginTitle", "Sign in to your account")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Continue to your Rakiya-Abimana workspace.</p>
        </div>

        {error && (
          <div role="alert" className="mt-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
            <LockKeyhole size={17} className="mt-0.5 shrink-0" /><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{t("auth.email", "Email address")}</span>
            <span className="relative block">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{t("auth.password", "Password")}</span>
            <span className="relative block">
              <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100" />
            </span>
          </label>
          <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? t("common.loading", "Signing in…") : t("common.signIn", "Sign in")}<ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-7 rounded-2xl border border-[#eee4d2] bg-[#fdfaf4] p-4">
          <p className="text-sm font-semibold text-slate-900">Demo access</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">Password: <span className="font-semibold text-slate-800">Password123!</span></p>
          <ul className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {demoAccounts.map(([role, accountEmail]) => (
              <li key={role} className="flex min-w-0 items-center justify-between gap-2 text-xs">
                <span className="shrink-0 font-semibold text-slate-600">{role}</span>
                <button type="button" onClick={() => setEmail(accountEmail)} className="truncate text-right text-primary-800 underline-offset-2 hover:underline" title={`Use ${accountEmail}`}>{accountEmail}</button>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-7 text-center text-sm text-slate-500">
          {t("auth.noAccount", "Don't have an account?")}{" "}
          <Link href="/register" className="font-semibold text-primary-800 hover:underline">{t("common.register", "Create one")}</Link>
        </p>
      </section>
    </div>
  );
}
