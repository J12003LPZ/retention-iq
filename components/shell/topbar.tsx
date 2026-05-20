"use client";
import { Search, Bell, HelpCircle, User } from "lucide-react";
import { useState } from "react";

const RANGES = ["7d", "30d", "Quarter", "Year"] as const;
type Range = (typeof RANGES)[number];

export function Topbar() {
  const [range, setRange] = useState<Range>("30d");
  return (
    <header className="sticky top-0 z-30 flex h-[72px] w-full items-center justify-between border-b border-outline-variant/50 bg-[--color-surface]/70 px-8 backdrop-blur-2xl">
      <div className="flex items-center gap-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={15} strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search accounts, insights…"
            aria-label="Search"
            className="w-80 rounded-lg border border-outline-variant/60 bg-[--color-surface-container]/50 py-2 pl-10 pr-4 text-[14px] text-on-surface placeholder:text-on-surface-variant focus:border-[--color-primary]/50 focus:bg-[--color-surface-container] focus:outline-none focus:ring-1 focus:ring-[--color-primary]/30"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-outline-variant/60 bg-[--color-surface-container-high] px-1.5 py-0.5 font-mono text-[10px] text-on-surface-variant sm:flex">
            ⌘K
          </kbd>
        </div>

        {/* Range toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border border-outline-variant/60 bg-[--color-surface-container]/50 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${
                range === r
                  ? "bg-[--color-surface-container-highest] text-[--color-on-surface] shadow-sm"
                  : "text-[--color-on-surface-variant] hover:text-[--color-on-surface]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className="mr-2 flex items-center gap-2 rounded-full border border-outline-variant/40 bg-[--color-surface-container]/40 px-3 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">Live</span>
        </div>

        <button aria-label="Notifications" className="relative rounded-lg p-2.5 text-on-surface-variant transition-colors hover:bg-[--color-surface-container-high] hover:text-on-surface">
          <Bell size={17} strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[--color-surface] bg-rose-400" />
        </button>
        <button aria-label="Help" className="rounded-lg p-2.5 text-on-surface-variant transition-colors hover:bg-[--color-surface-container-high] hover:text-on-surface">
          <HelpCircle size={17} strokeWidth={1.75} />
        </button>
        <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[--color-primary] to-[--color-primary-container] text-[--color-on-primary] ring-2 ring-[--color-surface]">
          <User size={15} strokeWidth={2} />
        </div>
      </div>
    </header>
  );
}
