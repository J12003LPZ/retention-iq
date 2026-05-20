import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const jbmono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RetentionIQ — Churn & Revenue Recovery",
  description: "Which customers are likely to churn, why, and how much revenue can we save?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${jbmono.variable} dark`}>
      <body className="min-h-screen bg-surface text-on-surface antialiased">{children}</body>
    </html>
  );
}
