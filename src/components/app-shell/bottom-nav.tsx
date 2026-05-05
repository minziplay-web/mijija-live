"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AvatarCircle } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";

type Tab = {
  href: string;
  label: string;
  color: string;
  match: (pathname: string) => boolean;
  Icon: (props: { active: boolean; tone: "active" | "idle" }) => React.ReactNode;
};

const TABS: Tab[] = [
  {
    href: "/",
    label: "Daily",
    color: "#F39A2B",
    match: (p) => p === "/",
    Icon: HomeIcon,
  },
  {
    href: "/daily",
    label: "Antworten",
    color: "#C45FA0",
    match: (p) => p === "/daily" || p.startsWith("/daily/"),
    Icon: PencilIcon,
  },
  {
    href: "/past-dailies",
    label: "Archiv",
    color: "#E5594F",
    match: (p) => p.startsWith("/past-dailies"),
    Icon: ArchiveIcon,
  },
  // Profil-Tab is rendered separately because the icon = current user's avatar
];

const PROFIL: Omit<Tab, "Icon"> = {
  href: "/profile",
  label: "Profil",
  color: "#4A5699",
  match: (p) => p.startsWith("/profile"),
};

const IDLE = "#64768D"; // sand-500

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { authState } = useAuth();
  const profile = authState.status === "authenticated" ? authState.user : null;

  return (
    <nav
      className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-white"
      aria-label="Hauptnavigation"
    >
      <ul className="mx-auto grid max-w-screen-sm grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const color = active ? tab.color : IDLE;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex w-full flex-col items-center justify-center gap-1.5 py-3"
                style={{ color }}
              >
                <tab.Icon active={active} tone={active ? "active" : "idle"} />
                <span
                  className="text-[10px] uppercase tracking-[0.16em]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color,
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}

        {/* Profil-Tab — Icon = Avatar of current user */}
        <li>
          <Link
            href={PROFIL.href}
            aria-current={PROFIL.match(pathname) ? "page" : undefined}
            className="flex w-full flex-col items-center justify-center gap-1.5 py-3"
          >
            <ProfilTabIcon
              active={PROFIL.match(pathname)}
              activeColor={PROFIL.color}
              displayName={profile?.displayName ?? "Du"}
              userId={profile?.userId ?? "anon"}
              photoURL={profile?.photoURL ?? null}
            />
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{
                fontFamily: "var(--font-mono)",
                color: PROFIL.match(pathname) ? PROFIL.color : IDLE,
                fontWeight: PROFIL.match(pathname) ? 600 : 500,
              }}
            >
              {PROFIL.label}
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function ProfilTabIcon({
  active,
  activeColor,
  displayName,
  userId,
  photoURL,
}: {
  active: boolean;
  activeColor: string;
  displayName: string;
  userId: string;
  photoURL: string | null;
}) {
  return (
    <span
      className="flex size-6 items-center justify-center rounded-full"
      style={{
        boxShadow: active ? `0 0 0 2px ${activeColor}` : "none",
      }}
    >
      <AvatarCircle
        member={{ userId, displayName, photoURL }}
        size="xs"
        className="size-6 text-[10px]"
      />
    </span>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
      <path
        d="M3.5 11.4 12 4.5l8.5 6.9V19a1 1 0 0 1-1 1h-3.6v-5.4h-3.8V20H7.5a1 1 0 0 1-1-1v-7.6"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 1.6 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
      <path
        d="M14.7 4.5 19.5 9.3 8.6 20.2H3.8v-4.8L14.7 4.5Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 1.4 : 1.7}
        strokeLinejoin="round"
      />
      <path d="M13 6.2 17.8 11" stroke="currentColor" strokeWidth={1.7} fill="none" />
    </svg>
  );
}

function ArchiveIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
      <rect
        x="3.5"
        y="6.5"
        width="17"
        height="13"
        rx="1.6"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.7}
      />
      <path
        d="M3.5 10h17"
        stroke={active ? "white" : "currentColor"}
        strokeWidth={1.4}
      />
      <path
        d="M9.5 13.5h5"
        stroke={active ? "white" : "currentColor"}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}
