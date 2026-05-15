"use client";

import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type {
  AdminDailyDiagnostics,
  AdminDiagnosticIssue,
} from "@/lib/types/frontend";

type StateTone = "neutral" | "success" | "warning" | "danger";

const DAILY_STATE_TONE: Record<
  AdminDailyDiagnostics["state"],
  { label: string; tone: StateTone }
> = {
  missing: { label: "Kein Run", tone: "neutral" },
  ready: { label: "Spielbar", tone: "success" },
  incomplete: { label: "Unvollständig", tone: "warning" },
  unplayable: { label: "Nicht spielbar", tone: "danger" },
};

const STATE_COLOR: Record<StateTone, string> = {
  neutral: "#A8A8A8",
  success: "#5DD27D",
  warning: "#F39A2B",
  danger: "#E5594F",
};

export function AdminDiagnostics({
  daily,
}: {
  daily: AdminDailyDiagnostics;
}) {
  const { tone, label } = DAILY_STATE_TONE[daily.state];
  const { counts } = daily;
  const accent = STATE_COLOR[tone];

  return (
    <section className="space-y-3 rounded-2xl bg-[#1A1A1A] p-4 ring-1 ring-[#1F1F1F]">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "#A8A8A8", fontFamily: "var(--font-mono)" }}
          >
            Daily-Status
          </p>
          <p className="text-[15px] font-semibold text-[#FAFAFA]">
            {formatBerlinDateLabel(daily.dateKey)}
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
          style={{
            backgroundColor: `${accent}1A`,
            color: accent,
            fontFamily: "var(--font-mono)",
          }}
        >
          <span
            aria-hidden
            className="block size-1.5 rounded-full"
            style={{ backgroundColor: accent }}
          />
          {label}
        </span>
      </header>

      {daily.state !== "missing" ? (
        <CountRow
          items={[
            {
              label: "Fragen",
              value: `${counts.playableItems}/${counts.runItems}`,
            },
            {
              label: "Antworten",
              value: `${counts.publicAnswers + counts.privateAnswers}`,
            },
            {
              label: "Locks",
              value: `${counts.firstAnswerLocks}`,
            },
          ]}
        />
      ) : null}

      <IssueList issues={daily.issues} />
    </section>
  );
}

function CountRow({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="rounded-xl bg-[#0E0E0E] px-3 py-2 text-center ring-1 ring-[#1F1F1F]"
        >
          <dt
            className="text-[9px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "#6E6E73", fontFamily: "var(--font-mono)" }}
          >
            {item.label}
          </dt>
          <dd
            className="mt-0.5 text-[15px] font-semibold tabular-nums text-[#FAFAFA]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function IssueList({ issues }: { issues: AdminDiagnosticIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {issues.map((issue, idx) => {
        const isError = issue.severity === "error";
        const accent = isError ? "#E5594F" : "#F39A2B";
        return (
          <li
            key={`${issue.code}-${idx}`}
            className="flex items-start gap-2 rounded-xl px-3 py-2 text-[12px] leading-relaxed"
            style={{
              backgroundColor: `${accent}14`,
              color: accent,
            }}
          >
            <span aria-hidden className="shrink-0 leading-tight">
              {isError ? "⛔" : "⚠️"}
            </span>
            <span className="flex-1">{issue.message}</span>
          </li>
        );
      })}
    </ul>
  );
}
