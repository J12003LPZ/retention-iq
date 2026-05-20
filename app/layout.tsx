import type { Metadata } from "next";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const jbmono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RetentionIQ — Churn & Revenue Recovery",
  description: "Which customers are likely to churn, why, and how much revenue can we save?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} ${jbmono.variable} dark`}>
      <body className="min-h-screen bg-surface text-on-surface antialiased">{children}</body>
    </html>
  );
}
