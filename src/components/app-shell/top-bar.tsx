"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

const TITLE_BY_PATH: Array<{ test: (p: string) => boolean; label: string }> = [
  { test: (p) => p === "/", label: "Daily" },
  { test: (p) => p.startsWith("/daily"), label: "Antworten" },
  { test: (p) => p.startsWith("/past-dailies"), label: "Archiv" },
  { test: (p) => p.startsWith("/profile"), label: "Profil" },
  { test: (p) => p.startsWith("/admin"), label: "Admin" },
  { test: (p) => p.startsWith("/resolved"), label: "Recap" },
];

function resolveTitle(pathname: string): string {
  for (const entry of TITLE_BY_PATH) {
    if (entry.test(pathname)) return entry.label;
  }
  return "Mijija";
}

export function TopBar() {
  const pathname = usePathname() ?? "/";
  const title = resolveTitle(pathname);
  const [hasUnseen] = useState(true);

  return (
    <header className="sticky top-0 z-30 border-b border-sand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-screen-sm items-center justify-between px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[16px] font-bold tracking-tight text-sand-900">
            mijija
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sand-500"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            · {title}
          </span>
        </div>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center text-sand-900"
          aria-label="Tageslog"
          onClick={() => {
            // TODO: Stage 4 — Notification-Panel öffnen
          }}
        >
          <BellIcon />
          {hasUnseen ? (
            <span
              className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full"
              style={{
                backgroundColor: "#E5594F",
                boxShadow: "0 0 0 2px #FFFFFF",
              }}
            />
          ) : null}
        </button>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden>
      <path
        d="M5.5 17.5h13M7.2 17.5V11a4.8 4.8 0 0 1 9.6 0v6.5M10.4 20.5a1.8 1.8 0 0 0 3.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
