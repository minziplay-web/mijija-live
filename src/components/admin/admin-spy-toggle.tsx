"use client";

import Link from "next/link";

import { useAdminSpy } from "@/lib/admin/admin-spy-context";
import { berlinDateKey } from "@/lib/mapping/date";

const ADMIN_ACCENT = "#4A5699";

export function AdminSpyToggle() {
  const { spyEnabled, setSpyEnabled } = useAdminSpy();
  const today = berlinDateKey();

  return (
    <section className="space-y-3 rounded-2xl bg-[#1A1A1A] p-4 ring-1 ring-[#1F1F1F]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: ADMIN_ACCENT, fontFamily: "var(--font-mono)" }}
          >
            Admin-Einblick
          </p>
          <p className="text-[13px] leading-relaxed text-[#A8A8A8]">
            Zeigt Daily-Antworten ohne dass du selbst antworten musst.
          </p>
        </div>
        <SpySwitch checked={spyEnabled} onChange={setSpyEnabled} />
      </div>

      {spyEnabled ? (
        <div className="flex flex-wrap gap-2 border-t border-[#1F1F1F] pt-3">
          <SpyLink href={`/past-dailies/${today}`} primary>
            Heutige Daily
          </SpyLink>
          <SpyLink href="/past-dailies">Archiv</SpyLink>
          <SpyLink href="/resolved">Heute aufgelöst</SpyLink>
        </div>
      ) : null}
    </section>
  );
}

function SpySwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Admin-Einblick aktivieren"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition"
      style={{
        backgroundColor: checked ? ADMIN_ACCENT : "#2C2C2E",
      }}
    >
      <span
        className="absolute top-0.5 size-6 rounded-full bg-[#FAFAFA] shadow-sm transition"
        style={{ left: checked ? "1.375rem" : "0.125rem" }}
      />
    </button>
  );
}

function SpyLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition"
      style={{
        backgroundColor: primary ? ADMIN_ACCENT : "#0E0E0E",
        color: "#FAFAFA",
        fontFamily: "var(--font-mono)",
        boxShadow: primary ? undefined : "inset 0 0 0 1px #1F1F1F",
      }}
    >
      {children}
    </Link>
  );
}
