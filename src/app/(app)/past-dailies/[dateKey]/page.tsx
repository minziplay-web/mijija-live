"use client";

import Link from "next/link";
import { use } from "react";

import { CATEGORY_COLOR, STORY_COLORS } from "@/components/story";
import { CommentCountBadge } from "@/components/story/inline-comments";
import { AvatarCircle } from "@/components/ui/avatar";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ThreeBodyLoader } from "@/components/ui/loader";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useDailyViewState } from "@/lib/firebase/daily";
import { CATEGORY_LABELS } from "@/lib/mapping/categories";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import { extractAnswerers } from "@/lib/mapping/past-dailies";
import type {
  DailyQuestion,
  DailyQuestionCardState,
  MemberLite,
  QuestionResult,
} from "@/lib/types/frontend";

type RevealedCard = Extract<DailyQuestionCardState, { phase: "revealed" }>;

/**
 * Tagesübersicht (`/past-dailies/[dateKey]`).
 *
 * Reddit-dense Liste der 5 Fragen — Mockup Section 02:
 *   - Mono-Index "01..05"
 *   - Kategorie-Pill (eyebrow-Stil aus StoryShell)
 *   - Frage-Snippet (line-clamp-2)
 *   - Avatar-Stack der Beantworter
 *   - Comment-Counter (Stage 5 verdrahtet das live; vorher 0)
 *
 * Klick auf Item → /past-dailies/[dateKey]/[index]
 *
 * Datenquelle: useDailyViewState(dateKey) — kein neuer Firestore-Read.
 */
export default function PastDailyOverviewPage({
  params,
}: {
  params: Promise<{ dateKey: string }>;
}) {
  const { dateKey } = use(params);
  const state = useDailyViewState(dateKey);
  const dateLabel = formatBerlinDateLabel(dateKey);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <PastDailyHeader dateKey={dateKey} dateLabel={dateLabel} />
        <div className="flex justify-center py-12">
          <ThreeBodyLoader size={48} label="Tag wird geladen" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <PastDailyHeader dateKey={dateKey} dateLabel={dateLabel} />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  if (state.status === "no_run") {
    return (
      <div className="space-y-4">
        <PastDailyHeader dateKey={dateKey} dateLabel={dateLabel} />
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-sand-600 ring-1 ring-sand-100">
          Für diesen Tag wurde kein Run gefunden.
        </p>
      </div>
    );
  }

  if (state.status === "run_unplayable") {
    return (
      <div className="space-y-4">
        <PastDailyHeader dateKey={dateKey} dateLabel={dateLabel} />
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-sand-600 ring-1 ring-sand-100">
          {state.reason}
        </p>
      </div>
    );
  }

  const revealedCards = state.cards.filter(
    (card): card is RevealedCard => card.phase === "revealed",
  );
  const unansweredCount = state.cards.filter(
    (card) => card.phase === "unanswered",
  ).length;

  if (revealedCards.length === 0 && unansweredCount > 0) {
    // Tag liegt in der Vergangenheit, aber Reveals sind nicht freigegeben
    // (kann bei "after_answer"-Policy passieren falls der Run-Status sich
    // verschoben hat). User bekommt einen "Daily nachholen"-Hinweis.
    return (
      <div className="space-y-4">
        <PastDailyHeader dateKey={dateKey} dateLabel={dateLabel} />
        <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-sand-100">
          <p className="text-sm text-sand-700">
            Du hast dieses Daily noch nicht fertig beantwortet.
          </p>
          <Link
            href={`/daily?date=${dateKey}`}
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-archive-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Daily nachholen
          </Link>
        </div>
      </div>
    );
  }

  if (revealedCards.length === 0) {
    return (
      <div className="space-y-4">
        <PastDailyHeader dateKey={dateKey} dateLabel={dateLabel} />
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-sand-600 ring-1 ring-sand-100">
          Dieser Tag lässt sich gerade nicht mehr vollständig anzeigen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PastDailyHeader dateKey={dateKey} dateLabel={dateLabel} />
      <QuestionList dateKey={dateKey} cards={revealedCards} />
    </div>
  );
}

function PastDailyHeader({
  dateKey,
  dateLabel,
}: {
  dateKey: string;
  dateLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Link
        href="/past-dailies"
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-archive-primary"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span aria-hidden>‹</span> Archiv
      </Link>
      <ScreenHeader
        eyebrow={dateKey}
        title={dateLabel}
        theme="archive"
      />
    </div>
  );
}

function QuestionList({
  dateKey,
  cards,
}: {
  dateKey: string;
  cards: RevealedCard[];
}) {
  return (
    <ul className="overflow-hidden rounded-2xl bg-white ring-1 ring-sand-100">
      {cards.map((card, idx) => {
        const isLast = idx === cards.length - 1;
        const answerers = extractAnswerers(card.result);
        return (
          <li
            key={`${dateKey}-${card.question.questionId}`}
            className={isLast ? "" : "border-b border-sand-100"}
          >
            <Link
              href={`/past-dailies/${dateKey}/${idx}`}
              className="flex items-start gap-4 px-4 py-3.5 transition hover:bg-sand-50"
            >
              <span
                className="shrink-0 leading-none tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 22,
                  color: STORY_COLORS.hair,
                  fontWeight: 500,
                  width: 28,
                }}
                aria-hidden
              >
                {String(idx + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <CategoryEyebrow question={card.question} />
                <h4
                  className="mt-1.5 line-clamp-2 text-[14px] leading-snug"
                  style={{ color: STORY_COLORS.ink, fontWeight: 500 }}
                >
                  {card.question.text}
                </h4>
                <RowMeta
                  answerers={answerers}
                  result={card.result}
                  runId={card.question.runId ?? dateKey}
                  questionId={card.question.questionId}
                />
              </div>

              <span
                aria-hidden
                className="pt-2 text-[14px]"
                style={{ color: STORY_COLORS.hair }}
              >
                ›
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CategoryEyebrow({ question }: { question: DailyQuestion }) {
  const accent = CATEGORY_COLOR[question.category] ?? STORY_COLORS.daily;
  const label = CATEGORY_LABELS[question.category];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: accent, fontFamily: "var(--font-mono)" }}
    >
      <span
        aria-hidden
        className="block h-1 w-1 rounded-full"
        style={{ backgroundColor: accent }}
      />
      {label}
    </span>
  );
}

function RowMeta({
  answerers,
  result,
  runId,
  questionId,
}: {
  answerers: MemberLite[];
  result: QuestionResult;
  runId: string;
  questionId: string;
}) {
  const visible = answerers.slice(0, 4);
  const overflow = answerers.length - visible.length;
  const totalLabel = answererCountLabel(result, answerers.length);

  return (
    <div className="mt-2 flex items-center gap-3">
      {visible.length > 0 ? (
        <div className="flex -space-x-1.5">
          {visible.map((m) => (
            <AvatarCircle
              key={m.userId}
              member={m}
              size="xs"
              className="size-5 ring-2 ring-white"
            />
          ))}
        </div>
      ) : null}

      {overflow > 0 ? (
        <span
          className="text-[11px] tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            color: STORY_COLORS.ink50,
          }}
        >
          +{overflow}
        </span>
      ) : null}

      {totalLabel ? (
        <span
          className="text-[11px] tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            color: STORY_COLORS.ink50,
          }}
        >
          {totalLabel}
        </span>
      ) : null}

      <span aria-hidden className="block h-3 w-px bg-sand-100" />

      <span
        className="inline-flex items-center gap-1 text-[11px] tabular-nums"
        style={{
          fontFamily: "var(--font-mono)",
          color: STORY_COLORS.ink50,
        }}
      >
        <CommentIcon />
        <CommentCountBadge runId={runId} questionId={questionId} />
      </span>
    </div>
  );
}

function answererCountLabel(result: QuestionResult, distinctCount: number): string | null {
  // Wenn Avatar-Stack schon den vollen Count zeigt, kein Extra-Label.
  // Bei meme_caption oder open_text wollen wir die Author-Anzahl als
  // primäres Signal — das deckt der distinctCount.
  if (distinctCount === 0) {
    if (result.questionType === "meme_caption") return "0 Captions";
    if (result.questionType === "open_text") return "0 Antworten";
    return "0 Stimmen";
  }
  return null;
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width={13} height={13} aria-hidden>
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
