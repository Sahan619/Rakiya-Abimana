import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "Rakiya Abimana | Jobs & Micro-Business Funding Platform (Sri Lanka)",
  description: "Multilingual platform connecting Sri Lankan job seekers, verified employers, local micro-business entrepreneurs, and funders across all 25 districts."
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <footer className="bg-gray-900 text-gray-300 py-8 border-t border-gray-800 text-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-white text-base">🇱🇰 Rakiya Abimana Platform (Sri Lanka)</p>
                  <p className="text-gray-400 text-xs mt-1">Connecting Job Seekers, Verified Employers, Micro-Business Entrepreneurs & Funders.</p>
                </div>
                <div className="text-xs text-gray-400 text-center md:text-right">
                  <p>English • සිංහල • தமிழ்</p>
                  <p className="mt-1">Identity & Business Verified • AES-256 Protected • Zero Platform Financial Transactions</p>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

