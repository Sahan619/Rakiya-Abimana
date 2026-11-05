"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Search,
  Building2,
  DollarSign,
  ShieldCheck,
  Compass,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import { VerifiedBadge } from "../../components/VerifiedBadge";
import { MachineTranslationNotice } from "../../components/MachineTranslationNotice";

export default function NearbyJobsPage() {
  const { user, can, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();

  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState(user?.districtId || "");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState("50");

  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translation toggles: { [jobId]: boolean }
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (authLoading) return;
    api.get("/master/districts").then((res) => {
      if (res?.districts) {
        setDistricts(res.districts);
        if (user?.districtId) setSelectedDistrict(user.districtId);
      }
    });

    if (!can("job:nearby")) return;
    if (user?.lat && user?.lng) {
      fetchNearby(user.lat, user.lng, "50");
    } else if (user?.districtId) {
      fetchNearbyByDistrict(user.districtId, "50");
    }
  }, [authLoading, can, user, locale]);

  const fetchNearby = async (lat: number, lng: number, radius = radiusKm) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius,
        lang: locale
      });
      const res = await api.get(`/jobs/nearby?${q.toString()}`);
      if (res?.nearbyJobs) {
        setNearbyJobs(res.nearbyJobs);
      }
    } catch (err: any) {
      setError(err.message || "Failed to calculate nearby jobs.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyByDistrict = (districtId: string, radius = radiusKm) => {
    const dist = districts.find((d) => d.id === districtId);
    if (dist) {
      fetchNearby(dist.lat, dist.lng, radius);
    } else {
      // Default to Colombo coordinates
      fetchNearby(6.9271, 79.8612, radius);
    }
  };

  if (authLoading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Loading account permissions...</div>;
  }

  if (!can("job:nearby")) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h1 className="font-bold text-gray-900">Nearby jobs are available to Job Seekers.</h1>
        {!user && <Link href="/login" className="mt-3 inline-block bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-lg">Sign In</Link>}
      </div>
    );
  }

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setGpsCoords(coords);
        setGpsLoading(false);
        fetchNearby(coords.lat, coords.lng, radiusKm);
      },
      (err) => {
        setGpsLoading(false);
        setError("GPS access was denied or timed out. Falling back to district location.");
        if (selectedDistrict) {
          fetchNearbyByDistrict(selectedDistrict, radiusKm);
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    setSelectedDistrict(distId);
    setGpsCoords(null);
    fetchNearbyByDistrict(distId, radiusKm);
  };

  const handleRadiusChange = (newRadius: string) => {
    setRadiusKm(newRadius);
    if (gpsCoords) {
      fetchNearby(gpsCoords.lat, gpsCoords.lng, newRadius);
    } else if (selectedDistrict) {
      fetchNearbyByDistrict(selectedDistrict, newRadius);
    }
  };

  const toggleOriginal = (jobId: string) => {
    setShowOriginalMap((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Navigation className="text-primary-700" size={24} />
          <span>{t("geo.title", "Nearby Jobs Matching")}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {t("geo.subtitle", "Jobs near your home or business location sorted by distance using geospatial calculations.")}
        </p>

        {/* Location Picker Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="sm:col-span-5">
            <button
              type="button"
              onClick={handleUseGps}
              disabled={gpsLoading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 border transition ${
                gpsCoords
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <Compass size={18} />
              <span>
                {gpsLoading
                  ? "Detecting Location..."
                  : gpsCoords
                  ? `GPS Locked (${gpsCoords.lat.toFixed(2)}, ${gpsCoords.lng.toFixed(2)})`
                  : t("geo.useGps", "Use My Current GPS Location")}
              </span>
            </button>
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white"
            >
              <option value="">{t("geo.fallbackDistrict", "Choose District Fallback")}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {locale === "si" ? d.nameSi : locale === "ta" ? d.nameTa : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={radiusKm}
              onChange={(e) => handleRadiusChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white"
            >
              <option value="15">Within 15 KM</option>
              <option value="30">Within 30 KM</option>
              <option value="50">Within 50 KM (Default)</option>
              <option value="100">Within 100 KM</option>
            </select>
          </div>
        </div>

        {/* Privacy notice banner */}
        <p className="text-[11px] text-gray-500 italic mt-3">
          🛡️ {t("geo.privacyNotice", "For your safety, exact coordinates are never revealed to other users or public visitors.")}
        </p>

        {error && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Matching Jobs Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">
          Calculating distance using Haversine formula...
        </div>
      ) : nearbyJobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <MapPin className="mx-auto text-gray-300 mb-2" size={40} />
          <p className="font-bold text-gray-700">No jobs found within {radiusKm} km of this location.</p>
          <p className="text-gray-400 text-xs mt-1">Try expanding the search radius to 50 km or 100 km.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nearbyJobs.map((job) => {
            const isOriginal = showOriginalMap[job.id];
            const titleToDisplay = isOriginal ? job.originalTitle : job.title;

            return (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {can("job:view_detail") && <div className="flex items-center space-x-2">
                        <span className="inline-block bg-primary-50 text-primary-800 border border-primary-200 text-xs font-bold px-2 py-0.5 rounded uppercase">
                          {job.category}
                        </span>
                        {/* Distance Badge */}
                        <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold px-2 py-0.5 rounded">
                          <Navigation size={11} />
                          <span>{job.distanceKm} km away</span>
                        </span>
                      </div>}
                      <h2 className="font-bold text-base sm:text-lg text-gray-900 mt-2 leading-snug">
                        {titleToDisplay}
                      </h2>
                    </div>
                    {can("job:view_detail") && <VerifiedBadge isVerified={job.employer?.isVerified} size="sm" />}
                  </div>

                  {can("job:view_detail") && <MachineTranslationNotice
                    isMachineTranslated={job.isMachineTranslated}
                    showOriginal={!!isOriginal}
                    onToggle={() => toggleOriginal(job.id)}
                    sourceLanguage={job.sourceLanguage}
                  />}

                  <div className="mt-2 text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {can("job:view_detail") && <span className="flex items-center space-x-1">
                      <Building2 size={14} className="text-gray-400" />
                      <span className="font-semibold text-gray-800">{job.employer?.companyName}</span>
                    </span>}
                    <span className="flex items-center space-x-1">
                      <MapPin size={14} className="text-gray-400" />
                      <span>{job.district?.nameEn}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-emerald-800 font-bold">
                      <DollarSign size={14} />
                      <span>Rs. {job.wage?.toLocaleString()} / {job.wageType}</span>
                    </span>
                  </div>

                  {can("job:view_detail") && job.description && (
                    <p className="text-gray-600 text-xs mt-2.5 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {can("job:view_detail") ? <Link
                    href={`/jobs/${job.id}`}
                    className="text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-3.5 py-2 rounded-lg shadow-sm"
                  >
                    {can("job:apply") ? "View & Apply" : "View details"}
                  </Link> : <span className="text-xs text-gray-500">Limited public listing</span>}
                  <span className="text-[11px] text-gray-400">
                    {job.distanceKm} km
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
