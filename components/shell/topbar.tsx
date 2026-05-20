"use client";
import { Search, Bell, HelpCircle, User } from "lucide-react";
import { useState } from "react";

const RANGES = ["7d", "30d", "Quarter", "Year"] as const;
type Range = (typeof RANGES)[number];

export function Topbar() {
  const [range, setRange] = useState<Range>("30d");
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
          <input
            type="text"
            placeholder="Search accounts, insights…"
            className="w-72 rounded-full border border-outline-variant bg-surface-container py-1.5 pl-9 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r ? "bg-surface-container-highest text-on-surface" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative rounded-full p-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-surface bg-error" />
        </button>
        <button className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface">
          <HelpCircle size={18} />
        </button>
        <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-surface-variant text-on-surface-variant">
          <User size={16} />
        </div>
      </div>
    </header>
  );
}
