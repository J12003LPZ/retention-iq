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
  { href: "/sql-explorer",      label: "SQL Explorer",    icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <>
      <nav className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col border-r border-outline-variant/50 bg-[--color-surface-container-low]/80 px-5 py-7 backdrop-blur-xl lg:flex">
        {/* Wordmark */}
        <div className="mb-10 px-2">
          <h1
            className="font-display text-[1.95rem] font-medium leading-none tracking-[-0.03em] text-[--color-on-surface]"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}
          >
            Retention<span className="italic text-[--color-primary]">IQ</span>
          </h1>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[--color-on-surface-variant]">
            Churn Intelligence
          </p>
        </div>

        <ul className="flex flex-1 flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "group relative flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all",
                    active
                      ? "bg-[--color-primary]/10 text-[--color-primary]"
                      : "text-[--color-on-surface-variant] hover:bg-[--color-surface-container-high] hover:text-[--color-on-surface]",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[--color-primary]" />
                  )}
                  <Icon size={17} strokeWidth={active ? 2 : 1.75} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto border-t border-outline-variant/50 pt-4">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all",
              pathname === "/settings"
                ? "bg-[--color-primary]/10 text-[--color-primary]"
                : "text-[--color-on-surface-variant] hover:bg-[--color-surface-container-high] hover:text-[--color-on-surface]",
            )}
          >
            <Settings size={17} strokeWidth={1.75} />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-outline-variant/50 bg-[--color-surface-container-low]/95 py-2 backdrop-blur-xl lg:hidden">
        {NAV.slice(0, 5).map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors",
                active ? "text-[--color-primary]" : "text-[--color-on-surface-variant]",
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
