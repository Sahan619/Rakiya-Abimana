"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { VerifiedBadge } from "../../components/VerifiedBadge";
import { api } from "../../lib/api";

interface DirectoryFunder {
  id: string;
  displayName: string;
  funderType: string;
  focusDistricts: string[];
  focusSectors: string[];
  shortBio: string | null;
  isVerified: boolean;
}

interface NamedOption {
  id: string;
  nameEn: string;
  nameSi: string;
  nameTa: string;
}

interface DirectoryResponse {
  funders: DirectoryFunder[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const FUNDER_TYPES = [
  "CSR business",
  "diaspora donor",
  "registered MFI",
  "angel donor",
  "NGO"
];

export default function FundersPage() {
  const { user, can, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [funders, setFunders] = useState<DirectoryFunder[]>([]);
  const [districts, setDistricts] = useState<NamedOption[]>([]);
  const [sectors, setSectors] = useState<NamedOption[]>([]);
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [funderType, setFunderType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !can("funder:browse")) return;

    let active = true;
    Promise.all([
      api.get<{ districts: NamedOption[] }>("/master/districts"),
      api.get<{ sectors: NamedOption[] }>("/master/sectors")
    ]).then(([districtResponse, sectorResponse]) => {
      if (!active) return;
      setDistricts(districtResponse.districts || []);
      setSectors(sectorResponse.sectors || []);
    }).catch((loadError: Error) => {
      console.error("Failed to load funder directory filters:", loadError);
      if (active) setError(loadError.message || "Failed to load directory filters.");
    });

    return () => { active = false; };
  }, [authLoading, can]);

  useEffect(() => {
    if (authLoading) return;
    if (!can("funder:browse")) {
      setLoading(false);
      return;
    }

    let active = true;
    const query = new URLSearchParams({ page: String(page), pageSize: "12" });
    if (district) query.set("district", district);
    if (sector) query.set("sector", sector);
    if (funderType) query.set("funderType", funderType);

    setLoading(true);
    setError("");
    api.get<DirectoryResponse>(`/funders?${query.toString()}`)
      .then((response) => {
        if (!active) return;
        setFunders(response.funders || []);
        setTotalPages(response.totalPages || 0);
      })
      .catch((loadError: Error) => {
        console.error("Failed to load funder directory:", loadError);
        if (active) setError(loadError.message || "Failed to load funders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [authLoading, can, district, funderType, page, sector]);

  const optionName = (option: NamedOption) => {
    if (locale === "si") return option.nameSi || option.nameEn;
    if (locale === "ta") return option.nameTa || option.nameEn;
    return option.nameEn;
  };

  const displayValues = (ids: string[], options: NamedOption[]) =>
    ids.map((id) => options.find((option) => option.nameEn.toLocaleLowerCase() === id.toLocaleLowerCase()))
      .filter((option): option is NamedOption => Boolean(option))
      .map(optionName);

  const startConversation = async (funder: DirectoryFunder) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setContactingId(funder.id);
    setError("");
    try {
      const response = await api.post<{ conversation: { id: string } }>("/messages/conversations", {
        recipientId: funder.id,
        type: "FUNDER_DIRECTORY",
        referenceId: funder.id
      });
      router.push(`/inbox/${response.conversation.id}`);
    } catch (contactError) {
      const message = contactError instanceof Error ? contactError.message : "Failed to contact funder.";
      setError(message);
    } finally {
      setContactingId(null);
    }
  };

  if (authLoading) {
    return <div className="text-center py-12 text-slate-500">{t("common.loading", "Loading...")}</div>;
  }

  if (!can("funder:browse")) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
        <h1 className="text-lg font-semibold text-slate-900">{t("funders.title", "Funder Directory")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("funders.accessDenied", "The funder directory is not available to this account.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">{t("funders.title", "Funder Directory")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("funders.description", "Discover verified funders who have chosen to be listed.")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-slate-700">
            {t("funders.district", "Focus district")}
            <select value={district} onChange={(event) => { setDistrict(event.target.value); setPage(1); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal">
              <option value="">{t("funders.all", "All")}</option>
              {districts.map((option) => <option key={option.id} value={option.nameEn}>{optionName(option)}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            {t("funders.sector", "Focus sector")}
            <select value={sector} onChange={(event) => { setSector(event.target.value); setPage(1); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal">
              <option value="">{t("funders.all", "All")}</option>
              {sectors.map((option) => <option key={option.id} value={option.nameEn}>{optionName(option)}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            {t("funders.funderType", "Funder type")}
            <select value={funderType} onChange={(event) => { setFunderType(event.target.value); setPage(1); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal">
              <option value="">{t("funders.all", "All")}</option>
              {FUNDER_TYPES.map((type) => <option key={type} value={type}>{t(`funders.types.${type}`, type)}</option>)}
            </select>
          </label>
        </div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}

      {loading ? (
        <div className="py-12 text-center text-slate-500">{t("common.loading", "Loading...")}</div>
      ) : funders.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-slate-600">{t("funders.empty", "No funders match these filters.")}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {funders.map((funder) => (
            <article key={funder.id} className="surface-card flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{funder.displayName}</h2>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary-700">{t(`funders.types.${funder.funderType}`, funder.funderType)}</p>
                </div>
                {funder.isVerified && <VerifiedBadge isVerified size="sm" />}
              </div>
              {funder.shortBio && <p className="text-sm leading-6 text-slate-600"><strong>{t("funders.bio", "Funding interests")}:</strong> {funder.shortBio}</p>}
              <div className="space-y-2 text-xs text-slate-600">
                <p><strong>{t("funders.districts", "Focus districts")}:</strong> {displayValues(funder.focusDistricts, districts).join(", ") || t("funders.notSpecified", "Not specified")}</p>
                <p><strong>{t("funders.sectors", "Focus sectors")}:</strong> {displayValues(funder.focusSectors, sectors).join(", ") || t("funders.notSpecified", "Not specified")}</p>
              </div>
              {can("funder:contact") && can("chat:use") && (
                <button type="button" onClick={() => startConversation(funder)} disabled={contactingId === funder.id} className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl bg-primary-700 px-4 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-50">
                  {contactingId === funder.id ? <ShieldCheck size={16} /> : <MessageSquare size={16} />}
                  {t("funders.contact", "Contact")}
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4" aria-label="Funder directory pages">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50">{t("funders.previous", "Previous")}</button>
          <span className="text-sm text-slate-600">{t("funders.page", "Page")} {page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50">{t("funders.next", "Next")}</button>
        </nav>
      )}
    </div>
  );
}
