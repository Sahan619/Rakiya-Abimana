"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, GraduationCap, HandCoins, Leaf, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";

type PublicRole = "JobSeeker" | "Employer" | "Entrepreneur" | "Funder" | "TrainingProvider";
const roles: Array<{ id: PublicRole; label: string; description: string; icon: React.ElementType }> = [
  { id: "JobSeeker", label: "Job Seeker", description: "Find work and connect with employers.", icon: Users },
  { id: "Employer", label: "Employer", description: "Build a team and manage job openings.", icon: Building2 },
  { id: "Entrepreneur", label: "Entrepreneur", description: "Grow a venture and seek funding.", icon: Leaf },
  { id: "Funder", label: "Funder / Donor", description: "Support promising businesses and ideas.", icon: HandCoins },
  { id: "TrainingProvider", label: "Training Provider", description: "Share courses and skills development.", icon: GraduationCap }
];
interface District { id: string; nameEn: string; nameSi?: string; nameTa?: string; province?: string }

export default function RegisterPage() {
  const { register } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<PublicRole>("JobSeeker");
  const [districts, setDistricts] = useState<District[]>([]);
  const [form, setForm] = useState<Record<string, string>>({ fullName: "", email: "", password: "", confirmPassword: "", dateOfBirth: "", phone: "", districtId: "", skills: "", experienceYears: "0", educationQualifications: "", preferredCategories: "", preferredLocations: "", expectedSalary: "", companyName: "", companyDescription: "", industry: "", businessAddress: "", contactPhone: "", website: "", businessRegNumber: "", businessName: "", businessCategory: "", businessIdea: "", businessStage: "IDEA", fundingRequirement: "", skillsExperience: "", accountType: "ORGANIZATION", organizationName: "", organizationType: "NGO", fundingInterests: "", focusSectors: "", focusDistricts: "", institutionName: "", trainingCategories: "", coursesOffered: "", accreditation: "", trainingLocation: "", providerWebsite: "", providerPhone: "" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get<{ districts: District[] }>("/master/districts").then((response) => setDistricts(response.districts || [])).catch(() => setError("Districts could not be loaded. Please refresh and try again.")); }, []);
  const selectedRole = useMemo(() => roles.find((item) => item.id === role)!, [role]);
  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const inputClass = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100";
  const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";
  const areaClass = "w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100";
  const validate = () => {
    if (step === 2) {
      if (!form.fullName.trim() || !form.email.trim() || !form.dateOfBirth || !form.districtId) return "Complete all required account fields.";
      if (form.password.length < 8) return "Password must be at least 8 characters long.";
      if (form.password !== form.confirmPassword) return "Password and confirmation do not match.";
    }
    if (step === 3 && role === "Employer" && !form.companyName.trim()) return "Company or business name is required.";
    if (step === 3 && role === "TrainingProvider" && !form.institutionName.trim()) return "Institution name is required.";
    return null;
  };
  const next = () => { const validationError = validate(); if (validationError) return setError(validationError); setError(null); setStep((current) => Math.min(4, current + 1)); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); const validationError = validate(); if (validationError) return setError(validationError); if (!termsAccepted) return setError("Accept the Terms of Service and Privacy Notice to continue."); setLoading(true); setError(null);
    try {
      await register({ fullName: form.fullName, email: form.email, password: form.password, confirmPassword: form.confirmPassword, dateOfBirth: form.dateOfBirth, phone: form.phone, districtId: form.districtId, roles: [role], preferredLanguage: locale, termsAccepted,
        jobSeekerProfile: role === "JobSeeker" ? form : undefined,
        employerProfile: role === "Employer" ? { companyName: form.companyName, description: form.companyDescription, industry: form.industry, businessAddress: form.businessAddress, contactPhone: form.contactPhone, website: form.website, businessRegNumber: form.businessRegNumber } : undefined,
        entrepreneurProfile: role === "Entrepreneur" ? { businessName: form.businessName, businessCategory: form.businessCategory, businessIdea: form.businessIdea, businessStage: form.businessStage, fundingRequirement: form.fundingRequirement, skillsExperience: form.skillsExperience } : undefined,
        funderProfile: role === "Funder" ? { accountType: form.accountType, organizationName: form.organizationName, organizationType: form.organizationType, fundingInterests: form.fundingInterests, focusSectors: form.focusSectors, focusDistricts: form.focusDistricts } : undefined,
        trainingProviderProfile: role === "TrainingProvider" ? { institutionName: form.institutionName, trainingCategories: form.trainingCategories, coursesOffered: form.coursesOffered, accreditation: form.accreditation, trainingLocation: form.trainingLocation, contactPhone: form.providerPhone, website: form.providerWebsite } : undefined
      });
      router.push(role === "JobSeeker" ? "/jobs" : role === "Employer" ? "/jobs/my" : role === "Entrepreneur" ? "/pitches/my" : role === "Funder" ? "/pitches" : "/profile");
    } catch (registrationError: any) { setError(registrationError.message || "Registration failed. Please review your details."); } finally { setLoading(false); }
  };

  const field = (key: string, label: string, type = "text", required = false, extra = "") => <label className={extra}><span className={labelClass}>{label} {required ? "*" : <em className="font-normal normal-case">(optional)</em>}</span><input type={type} required={required} min={type === "number" ? "0" : undefined} className={inputClass} value={form[key] || ""} onChange={(event) => update(key, event.target.value)} /></label>;
  return <div className="mx-auto max-w-4xl">
    <div className="mb-6 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-800"><UserPlus size={25} /></span><p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-primary-700">Rakiya-Abimana</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Create your account</h1><p className="mt-2 text-sm text-slate-600">A role-first registration designed around your goals.</p></div>
    <div className="mb-5 grid grid-cols-4 gap-2" aria-label="Registration progress">{["Account type", "Account details", "Your profile", "Finish"].map((label, index) => <div key={label} className={`rounded-full px-2 py-2 text-center text-[11px] font-semibold ${index + 1 <= step ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-500"}`}><span className="hidden sm:inline">{index + 1}. </span>{label}</div>)}</div>
    <form onSubmit={submit} className="surface-card p-6 sm:p-8">
      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">{error}</div>}
      {step === 1 && <div><h2 className="text-xl font-semibold text-slate-950">What brings you here?</h2><p className="mt-1 text-sm text-slate-500">Admin and Verifier accounts are provisioned by authorized administrators.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{roles.map(({ id, label, description, icon: Icon }) => <button key={id} type="button" onClick={() => setRole(id)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${role === id ? "border-primary-600 bg-primary-50 ring-2 ring-primary-100" : "border-slate-200 hover:border-primary-300 hover:bg-slate-50"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm"><Icon size={19} /></span><span><span className="block font-semibold text-slate-900">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span>{role === id && <Check className="ml-auto shrink-0 text-primary-700" size={18} />}</button>)}</div></div>}
      {step === 2 && <div className="space-y-5"><div><h2 className="text-xl font-semibold text-slate-950">Create your login</h2><p className="mt-1 text-sm text-slate-500">NIC is not required to create an account.</p></div><div className="grid gap-4 sm:grid-cols-2">{field("fullName", "Full name", "text", true)}{field("email", "Email address", "email", true)}{field("password", "Password", "password", true)}{field("confirmPassword", "Confirm password", "password", true)}{field("dateOfBirth", "Date of birth", "date", true)}<label><span className={labelClass}>District *</span><select required className={inputClass} value={form.districtId} onChange={(event) => update("districtId", event.target.value)}><option value="">Select district</option>{districts.map((district) => <option key={district.id} value={district.id}>{district.nameEn}</option>)}</select></label>{field("phone", "Phone number")}</div></div>}
      {step === 3 && <div className="space-y-5"><div><h2 className="text-xl font-semibold text-slate-950">{selectedRole.label} profile</h2><p className="mt-1 text-sm text-slate-500">Only fields relevant to this role are shown.</p></div>{role === "JobSeeker" && <div className="grid gap-4 sm:grid-cols-2">{field("skills", "Skills", "text", true)}{field("experienceYears", "Work experience (years)", "number")}{field("educationQualifications", "Education / qualifications")}{field("preferredCategories", "Preferred job categories")}{field("preferredLocations", "Preferred working locations")}{field("expectedSalary", "Expected salary", "number")}</div>}{role === "Employer" && <div className="grid gap-4 sm:grid-cols-2">{field("companyName", "Company / business name", "text", true)}{field("industry", "Industry / business category")}{field("contactPhone", "Contact phone")}{field("website", "Company website", "url")}{field("businessAddress", "Business address", "text", false, "sm:col-span-2")}<label className="sm:col-span-2"><span className={labelClass}>Company description</span><textarea rows={4} className={areaClass} value={form.companyDescription} onChange={(event) => update("companyDescription", event.target.value)} /></label></div>}{role === "Entrepreneur" && <div className="grid gap-4 sm:grid-cols-2">{field("businessName", "Business / proposed name")}{field("businessCategory", "Business category")}{field("businessStage", "Current business stage")}{field("fundingRequirement", "Funding requirement", "number")}<label className="sm:col-span-2"><span className={labelClass}>Business idea</span><textarea rows={4} className={areaClass} value={form.businessIdea} onChange={(event) => update("businessIdea", event.target.value)} /></label><label className="sm:col-span-2"><span className={labelClass}>Skills and experience</span><textarea rows={3} className={areaClass} value={form.skillsExperience} onChange={(event) => update("skillsExperience", event.target.value)} /></label></div>}{role === "Funder" && <div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className={labelClass}>Account type *</span><select className={inputClass} value={form.accountType} onChange={(event) => update("accountType", event.target.value)}><option value="INDIVIDUAL">Individual donor</option><option value="ORGANIZATION">Organization</option></select></label>{field("organizationName", "Organization name")}{field("organizationType", "Organization type")}{field("fundingInterests", "Funding interests / sectors", "text", false, "sm:col-span-2")}{field("focusDistricts", "Preferred districts")}</div>}{role === "TrainingProvider" && <div className="grid gap-4 sm:grid-cols-2">{field("institutionName", "Institution / provider name", "text", true)}{field("trainingCategories", "Training categories")}{field("coursesOffered", "Courses offered")}{field("accreditation", "Accreditation / qualifications")}{field("trainingLocation", "Training location")}{field("providerPhone", "Contact phone")}{field("providerWebsite", "Website", "url")}</div>}</div>}
      {step === 4 && <div className="text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck size={28} /></span><h2 className="mt-4 text-xl font-semibold text-slate-950">Ready to join as a {selectedRole.label}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Your profile will be created securely. Verification is a separate manual-review process.</p><label className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-700"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-700" /><span>I agree to the Terms of Service and Privacy Notice.</span></label></div>}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={() => { setError(null); setStep((current) => Math.max(1, current - 1)); }} disabled={step === 1 || loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:invisible"><ArrowLeft size={16} />Back</button>{step < 4 ? <button type="button" onClick={next} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-700 px-5 text-sm font-semibold text-white transition hover:bg-primary-800">Continue<ArrowRight size={16} /></button> : <button type="submit" disabled={loading || !termsAccepted} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-700 px-5 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Creating account..." : "Create account"}<Check size={16} /></button>}</div>
    </form><p className="mt-5 text-center text-sm text-slate-500">Already registered? <Link href="/login" className="font-semibold text-primary-800 hover:underline">Sign in</Link></p>
  </div>;
}
