"use client";

import type { AdminTab } from "@/lib/types/frontend";

const TABS: Array<{ value: AdminTab; label: string }> = [
  { value: "questions", label: "Fragen" },
  { value: "daily", label: "Daily" },
  { value: "members", label: "Mitglieder" },
  { value: "config", label: "Config" },
];

const ADMIN_ACCENT = "#4A5699";

export function AdminTabs({
  value,
  onChange,
}: {
  value: AdminTab;
  onChange: (next: AdminTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Admin-Bereich"
      className="grid grid-cols-4 gap-1 rounded-2xl bg-[#1A1A1A] p-1.5 ring-1 ring-[#1F1F1F]"
    >
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className="flex min-h-10 items-center justify-center rounded-xl px-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition min-[380px]:text-xs"
            style={{
              backgroundColor: active ? ADMIN_ACCENT : "transparent",
              color: active ? "#FAFAFA" : "#A8A8A8",
              fontFamily: "var(--font-mono)",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
