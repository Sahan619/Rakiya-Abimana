"use client";

import React from "react";
import { I18nextProvider } from "react-i18next";

import i18n from "../lib/i18n";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../components/SiteFooter";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <SiteFooter />
        </AuthProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}
