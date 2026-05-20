"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, HeartPulse, Wallet, Users, LineChart,
  Sparkles, Lightbulb, Database, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",                  label: "Overview",        icon: LayoutDashboard },
  { href: "/customers",         label: "Customer Health", icon: HeartPulse },
  { href: "/revenue",           label: "Revenue Risk",    icon: Wallet },
  { href: "/cohorts",           label: "Cohort Analysis", icon: Users },
  { href: "/support",           label: "Support",         icon: LineChart },
  { href: "/predictions",       label: "Predictions",     icon: Sparkles },
  { href: "/recommendations",   label: "Recommendations", icon: Lightbulb },
  { href: "/sql",               label: "SQL Explorer",    icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <>
      <nav className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-outline-variant bg-surface-container-low px-4 py-6 lg:flex">
        <div className="mb-8 px-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">RetentionIQ</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">Executive Suite</p>
        </div>
        <ul className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-container text-on-primary-container"
                      : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface",
                  )}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto border-t border-outline-variant pt-4">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/settings"
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface",
            )}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-outline-variant bg-surface-container-low py-2 lg:hidden">
        {NAV.slice(0, 5).map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center px-2 py-1 text-[10px] transition-colors",
                active ? "text-primary" : "text-on-surface-variant",
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
