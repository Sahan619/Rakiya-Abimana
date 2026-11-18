
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Rakiya Abimana | Jobs & Micro-Business Funding Platform (Sri Lanka)",
  description:
    "Multilingual platform connecting Sri Lankan job seekers, verified employers, local micro-business entrepreneurs, and funders across all 25 districts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
