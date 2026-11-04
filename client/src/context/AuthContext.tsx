"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useLanguage } from "./LanguageContext";

export interface User {
  id: string;
  email: string;
  fullName: string;
  dateOfBirth?: string;
  phone?: string;
  districtId?: string;
  district?: {
    id: string;
    nameEn: string;
    nameSi: string;
    nameTa: string;
  };
  lat?: number;
  lng?: number;
  preferredLanguage: string;
  isVerified: boolean;
  roles: string[];
  jobSeekerProfile?: any;
  employerProfile?: any;
  funderProfile?: any;
  verification?: {
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string;
    dobMatch?: boolean;
    nicFormat?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isVerifier: boolean;
  isEmployer: boolean;
  isEntrepreneur: boolean;
  isJobSeeker: boolean;
  isFunder: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { throw new Error("Authentication is unavailable."); },
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isAdmin: false,
  isVerifier: false,
  isEmployer: false,
  isEntrepreneur: false,
  isJobSeeker: false,
  isFunder: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { setLocale } = useLanguage();

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      if (res && res.user) {
        setUser(res.user);
        if (res.user.preferredLanguage) {
          setLocale(res.user.preferredLanguage as any);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setLocale]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ user: User }>("/auth/login", credentials);
    setUser(res.user);
    if (res.user.preferredLanguage) {
      setLocale(res.user.preferredLanguage as any);
    }
    return res.user;
  };

  const register = async (data: any) => {
    const res = await api.post<{ user: User }>("/auth/register", data);
    setUser(res.user);
    if (res.user.preferredLanguage) {
      setLocale(res.user.preferredLanguage as any);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  const roles = user?.roles || [];
  const isAdmin = roles.includes("Admin");
  const isVerifier = roles.includes("Verifier") || isAdmin;
  const isEmployer = roles.includes("Employer");
  const isEntrepreneur = roles.includes("Entrepreneur");
  const isJobSeeker = roles.includes("JobSeeker");
  const isFunder = roles.includes("Funder");

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin,
        isVerifier,
        isEmployer,
        isEntrepreneur,
        isJobSeeker,
        isFunder
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
