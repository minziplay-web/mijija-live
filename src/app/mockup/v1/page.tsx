"use client";

import { useState } from "react";

// ---- Brand palette -----------------------------------------------------------
const C = {
  // Backgrounds
  bg: "#000000",
  bgElev: "#161616",
  bgSubtle: "#0E0E0E",
  // Text
  white: "#FAFAFA",
  textMuted: "#A8A8A8",
  textDim: "#6E6E73",
  // Hairlines (dark mode)
  hair: "#1F1F1F",
  hairStrong: "#2C2C2E",
  // SVG-derived brand
  daily: "#F39A2B",
  antworten: "#C45FA0",
  archiv: "#E5594F",
  profil: "#4A5699",
  yellow: "#F0D043",
  blueLight: "#6277BA",
} as const;

// ---- Mock data ---------------------------------------------------------------
type Friend = { id: string; name: string };

const FRIENDS: Friend[] = [
  { id: "u1", name: "Tom" },
  { id: "u2", name: "Lisa" },
  { id: "u3", name: "Marie" },
  { id: "u4", name: "Ben" },
  { id: "u5", name: "Anna" },
];

function pickColor(seed: string): string {
  const palette = [C.daily, C.antworten, C.archiv, C.profil, C.blueLight, C.yellow];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// ---- Tiny SVG icons ----------------------------------------------------------
function HomeIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
      <path
        d="M3.5 11.4 12 4.5l8.5 6.9V19a1 1 0 0 1-1 1h-3.6v-5.4h-3.8V20H7.5a1 1 0 0 1-1-1v-7.6"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 1.6 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
      <path
        d="M14.7 4.5 19.5 9.3 8.6 20.2H3.8v-4.8L14.7 4.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 1.4 : 1.7}
        strokeLinejoin="round"
      />
      <path d="M13 6.2 17.8 11" stroke="currentColor" strokeWidth={1.7} fill="none" />
    </svg>
  );
}

function ArchiveIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
      <rect
        x="3.5"
        y="6.5"
        width="17"
        height="13"
        rx="1.6"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.7}
      />
      <path d="M3.5 10h17" stroke={filled ? C.bg : "currentColor"} strokeWidth={1.4} />
      <path
        d="M9.5 13.5h5"
        stroke={filled ? C.bg : "currentColor"}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </svg>
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        d="M5.6 5.6 18.4 18.4M18.4 5.6 5.6 18.4"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
      <path
        d="M4 5.5h16v10.5H10l-4 3.5v-3.5H4v-10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        d="m9.5 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden>
      <path
        d="m6 14.5 6-6 6 6"
        stroke="currentColor"
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---- Atomic components -------------------------------------------------------
function Avatar({
  name,
  size = 36,
  ring,
}: {
  name: string;
  size?: number;
  ring?: string;
}) {
  const initial = name.slice(0, 1).toUpperCase();
  const bg = pickColor(name);
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full font-semibold leading-none select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color: "#FFFFFF",
        fontSize: Math.round(size * 0.42),
        fontFamily: "var(--mockup-body)",
        boxShadow: ring ? `0 0 0 2px ${ring}` : undefined,
      }}
    >
      {initial}
    </span>
  );
}

function CategoryEyebrow({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
      style={{ color, fontFamily: "var(--mockup-mono)" }}
    >
      <span
        aria-hidden
        className="block h-1 w-1 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function Mono({
  children,
  size = 11,
  color = C.textDim,
  weight = 500,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: number;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--mockup-mono)",
        fontSize: size,
        letterSpacing: "0.02em",
        color,
        fontWeight: weight,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </span>
  );
}

function SectionLabel({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="px-5 pt-12 pb-5">
      <Mono size={10} color={C.textDim} weight={500}>
        {number}
      </Mono>
      <h2
        className="mt-2 text-[20px] leading-tight tracking-tight"
        style={{ color: C.white, fontWeight: 600 }}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.textMuted }}>
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

// ---- Story slide (Daily reveal) — Insta-clean --------------------------------
function StorySlide() {
  const totalVoters = 5;
  const winnerName = "Tom";
  const winnerCount = 3;
  const runnerUpName = "Lisa";
  const runnerUpCount = 2;
  const winnerVoters = ["Lisa", "Marie", "Ben"];
  const runnerUpVoters = ["Tom", "Anna"];

  const winnerPct = (winnerCount / totalVoters) * 100;
  const runnerUpPct = (runnerUpCount / totalVoters) * 100;

  return (
    <div
      className="relative mx-5 overflow-hidden"
      style={{
        height: 600,
        backgroundColor: C.bg,
        borderRadius: 16,
        border: `1px solid ${C.hair}`,
      }}
    >
      {/* top header — just position + category, no story-chrome */}
      <div className="absolute inset-x-5 top-4 z-10 flex items-center justify-between">
        <CategoryEyebrow label="Charakter" color={C.daily} />
        <Mono size={11} color={C.textDim}>
          03 / 05
        </Mono>
      </div>

      {/* content stack */}
      <div className="absolute inset-x-5 top-[44px] flex flex-col gap-5">

        {/* question — kept small + clean */}
        <h3
          className="text-[18px] leading-snug tracking-tight"
          style={{ color: C.white, fontWeight: 500 }}
        >
          Wer würde am ehesten in einem Marathon mitten in der Strecke umfallen?
        </h3>

        {/* result label */}
        <div className="pt-2">
          <Mono size={10} color={C.textDim}>
            ERGEBNIS
          </Mono>
        </div>

        {/* Each option as a self-contained block: bar + voters together */}
        <div className="flex flex-col gap-5">
          {/* Winner */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="flex items-center gap-2">
                <Avatar name={winnerName} size={22} />
                <span
                  className="text-[15px]"
                  style={{ color: C.white, fontWeight: 600 }}
                >
                  {winnerName}
                </span>
              </span>
              <Mono size={13} color={C.daily} weight={500}>
                {Math.round(winnerPct)}%
              </Mono>
            </div>
            <div
              className="relative h-1.5 overflow-hidden rounded-full"
              style={{ backgroundColor: "#FFFFFF12" }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${winnerPct}%`, backgroundColor: C.daily }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {winnerVoters.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1"
                  style={{ backgroundColor: C.bgElev }}
                >
                  <Avatar name={v} size={16} />
                  <span
                    className="text-[12px]"
                    style={{ color: C.white, fontWeight: 500 }}
                  >
                    {v}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Runner-up */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="flex items-center gap-2">
                <Avatar name={runnerUpName} size={22} />
                <span
                  className="text-[15px]"
                  style={{ color: C.textMuted, fontWeight: 500 }}
                >
                  {runnerUpName}
                </span>
              </span>
              <Mono size={13} color={C.textMuted} weight={500}>
                {Math.round(runnerUpPct)}%
              </Mono>
            </div>
            <div
              className="relative h-1.5 overflow-hidden rounded-full"
              style={{ backgroundColor: "#FFFFFF12" }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${runnerUpPct}%`, backgroundColor: C.textDim }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {runnerUpVoters.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1"
                  style={{ backgroundColor: C.bgElev }}
                >
                  <Avatar name={v} size={16} />
                  <span
                    className="text-[12px]"
                    style={{ color: C.white, fontWeight: 500 }}
                  >
                    {v}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* bottom comment trigger */}
      <button
        className="absolute inset-x-5 bottom-5 flex items-center justify-between"
        style={{ color: C.white }}
      >
        <span className="flex items-center gap-2">
          <CommentIcon />
          <span className="text-[14px]" style={{ fontWeight: 500 }}>
            5 Kommentare
          </span>
        </span>
        <span style={{ color: C.textDim }}>
          <ChevronUp />
        </span>
      </button>
    </div>
  );
}

// ---- Reddit-dense list (Section 02 — UNCHANGED LOOK, dark-themed) -----------
type ListItem = {
  index: number;
  category: string;
  color: string;
  question: string;
  answeredBy: string[];
  comments: number;
};

const LIST_ITEMS: ListItem[] = [
  {
    index: 1,
    category: "Glück",
    color: C.archiv,
    question: "Wer hatte heute den glücklichsten Zufall?",
    answeredBy: ["Tom", "Lisa", "Marie", "Ben", "Anna"],
    comments: 3,
  },
  {
    index: 2,
    category: "Charakter",
    color: C.daily,
    question: "Wer würde am ehesten den ganzen Sommer nur Pasta essen?",
    answeredBy: ["Tom", "Lisa", "Marie", "Ben"],
    comments: 7,
  },
  {
    index: 3,
    category: "Charakter",
    color: C.daily,
    question: "Wer würde am ehesten in einem Marathon mitten in der Strecke umfallen?",
    answeredBy: ["Tom", "Lisa", "Marie", "Ben", "Anna"],
    comments: 5,
  },
  {
    index: 4,
    category: "Beziehung",
    color: C.antworten,
    question: "Mit wem würde Tom am ehesten ein Roadtrip machen ohne Plan?",
    answeredBy: ["Tom", "Lisa", "Marie"],
    comments: 1,
  },
  {
    index: 5,
    category: "Meme",
    color: C.profil,
    question: "Bestes Caption für dieses Bild von Ben am Strand?",
    answeredBy: ["Tom", "Lisa", "Marie", "Ben", "Anna"],
    comments: 12,
  },
];

function ListRow({ item, last }: { item: ListItem; last?: boolean }) {
  return (
    <article
      className="relative flex items-start gap-4 px-5 py-3.5"
      style={{
        borderBottom: last ? "none" : `1px solid ${C.hair}`,
      }}
    >
      <span
        className="leading-none"
        style={{
          fontFamily: "var(--mockup-mono)",
          fontSize: 22,
          color: C.hairStrong,
          fontWeight: 500,
          width: 28,
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(item.index).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1">
        <CategoryEyebrow label={item.category} color={item.color} />
        <h4
          className="mt-1.5 text-[14px] leading-snug line-clamp-2"
          style={{ color: C.white, fontWeight: 500 }}
        >
          {item.question}
        </h4>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex -space-x-1.5">
            {item.answeredBy.slice(0, 4).map((name) => (
              <Avatar key={name} name={name} size={20} ring={C.bg} />
            ))}
          </div>
          {item.answeredBy.length > 4 ? (
            <Mono size={11} color={C.textDim}>
              +{item.answeredBy.length - 4}
            </Mono>
          ) : null}
          <span
            aria-hidden
            className="block h-3 w-px"
            style={{ backgroundColor: C.hairStrong }}
          />
          <span
            className="flex items-center gap-1"
            style={{ color: C.textDim }}
          >
            <CommentIcon />
            <Mono size={11} color={C.textDim}>
              {item.comments}
            </Mono>
          </span>
        </div>
      </div>

      <div className="pt-2" style={{ color: C.hairStrong }}>
        <ChevronRight />
      </div>
    </article>
  );
}

// ---- Notification panel (dark) ----------------------------------------------
type ActivityRow = {
  who: string;
  action: string;
  detail?: string;
  ago: string;
};

const ACTIVITY: ActivityRow[] = [
  { who: "Tom", action: "hat Frage 4 beantwortet", ago: "vor 12 min" },
  { who: "Lisa", action: "hat Frage 3 beantwortet", ago: "vor 23 min" },
  {
    who: "Marie",
    action: "hat einen Kommentar geschrieben",
    detail: "boah jaaa der würde sowas von umfallen",
    ago: "vor 1 h",
  },
  { who: "Ben", action: "hat Frage 2 beantwortet", ago: "vor 2 h" },
  { who: "Anna", action: "hat Frage 1 beantwortet", ago: "vor 3 h" },
];

function NotificationPanel() {
  const answered = 2;
  const total = 5;
  const open = total - answered;

  return (
    <div
      className="mx-5 overflow-hidden"
      style={{
        backgroundColor: C.bgElev,
        borderRadius: 16,
        border: `1px solid ${C.hair}`,
      }}
    >
      {/* sticky CTA */}
      <button
        className="relative flex w-full items-center gap-4 px-5 py-4 text-left"
        style={{ borderBottom: `1px solid ${C.hair}` }}
      >
        <div className="flex-1">
          <Mono size={10} color={C.daily}>
            DAILY HEUTE
          </Mono>
          <div
            className="mt-1 text-[17px] leading-tight tracking-tight"
            style={{ color: C.white, fontWeight: 600 }}
          >
            {open} Fragen noch offen
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div
              className="relative h-1 flex-1 overflow-hidden rounded-full"
              style={{ backgroundColor: "#FFFFFF12" }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${(answered / total) * 100}%`,
                  backgroundColor: C.daily,
                }}
              />
            </div>
            <Mono size={11} color={C.textMuted}>
              {answered}/{total}
            </Mono>
          </div>
        </div>
        <span style={{ color: C.daily }}>
          <ChevronRight />
        </span>
      </button>

      {/* events */}
      <ul>
        {ACTIVITY.map((row, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 px-5 py-3"
            style={{
              borderTop: idx === 0 ? "none" : `1px solid ${C.hair}`,
            }}
          >
            <Avatar name={row.who} size={28} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug">
                <span style={{ color: C.white, fontWeight: 600 }}>{row.who}</span>{" "}
                <span style={{ color: C.textMuted }}>{row.action}</span>
              </p>
              {row.detail ? (
                <p
                  className="mt-1 text-[12px] leading-snug"
                  style={{ color: C.textDim }}
                >
                  „{row.detail}"
                </p>
              ) : null}
            </div>
            <Mono size={10} color={C.textDim}>
              {row.ago}
            </Mono>
          </li>
        ))}
      </ul>

      <div
        className="px-5 py-3 text-center"
        style={{ borderTop: `1px solid ${C.hair}` }}
      >
        <Mono size={10} color={C.textDim}>
          MITTERNACHT BERLIN · LOG RESET
        </Mono>
      </div>
    </div>
  );
}

// ---- Bottom nav (dark, fixed) -----------------------------------------------
type Tab = "daily" | "antworten" | "archiv" | "profil";

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: "daily", label: "Daily", color: C.daily },
  { id: "antworten", label: "Antworten", color: C.antworten },
  { id: "archiv", label: "Archiv", color: C.archiv },
  { id: "profil", label: "Profil", color: C.profil },
];

function BottomNav({
  active,
  onChange,
  fixed = false,
}: {
  active: Tab;
  onChange?: (t: Tab) => void;
  fixed?: boolean;
}) {
  return (
    <nav
      className={
        fixed
          ? "fixed inset-x-0 bottom-0 z-30 mx-auto max-w-screen-sm"
          : "relative mx-5"
      }
      style={{
        backgroundColor: C.bg,
        borderTop: `1px solid ${C.hair}`,
        borderRadius: fixed ? 0 : 14,
        border: fixed ? `1px solid ${C.hair}` : `1px solid ${C.hair}`,
      }}
      aria-label="Hauptnavigation"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const isActive = active === t.id;
          const color = isActive ? t.color : C.textMuted;
          return (
            <li key={t.id}>
              <button
                onClick={() => onChange?.(t.id)}
                className="flex w-full flex-col items-center justify-center gap-1.5 py-3 transition-colors"
                style={{ color }}
                aria-current={isActive ? "page" : undefined}
              >
                <span style={{ color }}>
                  {t.id === "daily" ? (
                    <HomeIcon filled={isActive} />
                  ) : t.id === "antworten" ? (
                    <PencilIcon filled={isActive} />
                  ) : t.id === "archiv" ? (
                    <ArchiveIcon filled={isActive} />
                  ) : (
                    <ProfilNavIcon filled={isActive} />
                  )}
                </span>
                <span
                  className="text-[10px] uppercase tracking-[0.16em]"
                  style={{
                    fontFamily: "var(--mockup-mono)",
                    color,
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ProfilNavIcon({ filled = false }: { filled?: boolean }) {
  return (
    <span
      className="flex items-center justify-center rounded-full"
      style={{
        width: 24,
        height: 24,
        backgroundColor: filled ? C.profil : "transparent",
        border: filled ? "none" : `1.7px solid ${C.textMuted}`,
        color: filled ? "#FFFFFF" : C.textMuted,
        fontFamily: "var(--mockup-body)",
        fontWeight: 600,
        fontSize: 11,
      }}
    >
      L
    </span>
  );
}

// ---- Top bar -----------------------------------------------------------------
function TopBar({ activeLabel }: { activeLabel: string }) {
  return (
    <header
      className="sticky top-0 z-20 mx-auto flex max-w-screen-sm items-center justify-between px-5 py-3.5"
      style={{
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: `1px solid ${C.hair}`,
      }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="text-[16px] tracking-tight"
          style={{ color: C.white, fontWeight: 700 }}
        >
          mijija
        </span>
        <Mono size={10} color={C.textDim}>
          · {activeLabel}
        </Mono>
      </div>
      <button
        className="relative flex h-9 w-9 items-center justify-center"
        style={{ color: C.white }}
        aria-label="Tageslog"
      >
        <BellIcon />
        <span
          className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full"
          style={{ backgroundColor: C.archiv, boxShadow: `0 0 0 2px ${C.bg}` }}
        />
      </button>
    </header>
  );
}

function FrameLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 px-1">
      <Mono size={10} color={C.textDim}>
        {children}
      </Mono>
    </div>
  );
}

// ---- Page --------------------------------------------------------------------
export default function MockupV1Page() {
  const [activeTab, setActiveTab] = useState<Tab>("daily");

  return (
    <div
      className="mx-auto min-h-dvh max-w-screen-sm pb-32"
      style={{ backgroundColor: C.bg }}
    >
      <TopBar activeLabel={TABS.find((t) => t.id === activeTab)?.label ?? "Daily"} />

      {/* Hero */}
      <section className="px-5 pt-8 pb-2">
        <Mono size={10} color={C.textDim}>
          MOCKUP · v1.1 · DARK
        </Mono>
        <h1
          className="mt-3 text-[28px] leading-tight tracking-tight"
          style={{ color: C.white, fontWeight: 700 }}
        >
          Sieht das nach uns aus?
        </h1>
        <p
          className="mt-3 text-[14px] leading-relaxed"
          style={{ color: C.textMuted }}
        >
          5 Surfaces im Insta-Dark mit unseren SVG-Farben. Wenn der Vibe stimmt,
          übernehme ich die Komponenten in Stage 0.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <span
            aria-hidden
            className="block h-px flex-1"
            style={{ backgroundColor: C.hairStrong }}
          />
          <Mono size={10} color={C.textDim}>
            5 SECTIONS
          </Mono>
        </div>
      </section>

      {/* Section 1 — Story slide */}
      <section>
        <SectionLabel
          number="01 · STORY"
          title="Eine Frage, eine Auflösung"
          subtitle="Daily- und Antworten-Slide. Frage klein und ruhig, Ergebnis als Bar-Chart, Voter als Pills. Kein Magazine, keine Italic, kein Drama."
        />
        <StorySlide />
      </section>

      {/* Section 2 — list density */}
      <section>
        <SectionLabel
          number="02 · LISTE"
          title="Tagesübersicht"
          subtitle="Engzeilig, Mono-Index, Hairlines. Gefiel dir schon."
        />
        <div
          className="mx-5"
          style={{
            backgroundColor: C.bgElev,
            borderRadius: 16,
            border: `1px solid ${C.hair}`,
          }}
        >
          <div
            className="flex items-end justify-between px-5 pt-4 pb-2"
            style={{ borderBottom: `1px solid ${C.hair}` }}
          >
            <div>
              <Mono size={10} color={C.textDim}>
                MO · 04. MAI 2026
              </Mono>
              <h3
                className="mt-1 text-[18px] tracking-tight"
                style={{ color: C.white, fontWeight: 600 }}
              >
                Daily · 5 Fragen
              </h3>
            </div>
            <Mono size={11} color={C.textDim}>
              28 KOMM.
            </Mono>
          </div>
          {LIST_ITEMS.map((item, idx) => (
            <ListRow
              key={item.index}
              item={item}
              last={idx === LIST_ITEMS.length - 1}
            />
          ))}
        </div>
      </section>

      {/* Section 3 — notification panel */}
      <section>
        <SectionLabel
          number="03 · TAGESLOG"
          title="Aus dem Bell-Icon"
          subtitle="Sticky-CTA oben, chronologische Aktivität drunter, Reset um Berlin-Mitternacht."
        />
        <NotificationPanel />
      </section>

      {/* Section 4 — bottom nav states */}
      <section>
        <SectionLabel
          number="04 · BOTTOM-NAV"
          title="4 Tabs, Icon-Swap"
          subtitle="Klick unten — der Tab wandert in den aktiven Zustand. Profil ist dein Avatar."
        />
        <div className="space-y-6 px-5">
          <div>
            <FrameLabel>Live · interaktiv</FrameLabel>
            <BottomNav active={activeTab} onChange={setActiveTab} />
          </div>
          <div>
            <FrameLabel>Alle Active-States</FrameLabel>
            <div className="space-y-2.5">
              {TABS.map((t) => (
                <div key={t.id}>
                  <div
                    className="mb-1 text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: t.color, fontFamily: "var(--mockup-mono)" }}
                  >
                    {t.label}
                  </div>
                  <BottomNav active={t.id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — avatars */}
      <section>
        <SectionLabel
          number="05 · AVATARE"
          title="Initialen, deterministisch gefärbt"
          subtitle="Kein Foto? Jeder Name kriegt eine stabile Farbe aus der Markenpalette."
        />
        <div className="px-5">
          <div className="flex flex-wrap gap-4">
            {FRIENDS.map((f) => (
              <div key={f.id} className="flex flex-col items-center gap-2">
                <Avatar name={f.name} size={56} />
                <span className="text-[12px]" style={{ color: C.textMuted }}>
                  {f.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing strip */}
      <section className="px-5 pt-12 pb-6">
        <div
          className="flex items-center gap-3"
          style={{ borderTop: `1px solid ${C.hair}`, paddingTop: 16 }}
        >
          <Mono size={10} color={C.textDim}>
            ENDE · {new Date().getFullYear()}
          </Mono>
          <span
            aria-hidden
            className="block h-px flex-1"
            style={{ backgroundColor: C.hair }}
          />
          <Mono size={10} color={C.textDim}>
            MIJIJA REDESIGN
          </Mono>
        </div>
      </section>

      {/* Fixed bottom nav */}
      <BottomNav active={activeTab} onChange={setActiveTab} fixed />
    </div>
  );
}
