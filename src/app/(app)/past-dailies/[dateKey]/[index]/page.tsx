"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo } from "react";
import { motion, type PanInfo } from "motion/react";

import {
  MemeCaptionCarousel,
  RevealBarChart,
  STORY_COLORS,
  StoryShell,
} from "@/components/story";
import { InlineCommentsSection } from "@/components/story/inline-comments";
import { AvatarCircle } from "@/components/ui/avatar";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ThreeBodyLoader } from "@/components/ui/loader";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyViewState } from "@/lib/firebase/daily";
import { CATEGORY_LABELS } from "@/lib/mapping/categories";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import {
  isChartableResult,
  resultToRevealOptions,
} from "@/lib/mapping/past-dailies";
import type {
  DailyQuestionCardState,
  MemeCaptionResult,
  OpenTextResult,
  QuestionResult,
} from "@/lib/types/frontend";

type RevealedCard = Extract<DailyQuestionCardState, { phase: "revealed" }>;

const SWIPE_DISTANCE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 350;

/**
 * Story-Detail (`/past-dailies/[dateKey]/[index]`).
 *
 * Rendert eine StoryShell mit Reveal-Body. URL-Param `[index]` ist
 * single source of truth — Browser-Back & Refresh funktionieren ohne
 * weiteren State.
 *
 * Swipe: motion.div drag horizontal. drag-end → router.replace auf
 * `[dateKey]/[index±1]`. Verwendet replace statt push, damit der
 * Browser-Verlauf nicht zugemüllt wird (analog Insta-Stories).
 *
 * Footer-Slot bleibt leer — Stage 5 verdrahtet dort die InlineComments.
 */
export default function PastDailyStoryPage({
  params,
}: {
  params: Promise<{ dateKey: string; index: string }>;
}) {
  const { dateKey, index: rawIndex } = use(params);
  const router = useRouter();
  const state = useDailyViewState(dateKey);
  const { authState } = useAuth();
  const currentUserId =
    authState.status === "authenticated" ? authState.user.userId : undefined;

  const parsedIndex = Number.parseInt(rawIndex, 10);
  const safeIndex = Number.isFinite(parsedIndex) && parsedIndex >= 0 ? parsedIndex : 0;

  const revealedCards = useMemo(() => {
    if (state.status !== "ready") return [] as RevealedCard[];
    return state.cards.filter(
      (card): card is RevealedCard => card.phase === "revealed",
    );
  }, [state]);

  if (state.status === "loading") {
    return (
      <PageFrame dateKey={dateKey}>
        <div className="flex justify-center py-12">
          <ThreeBodyLoader size={48} label="Frage wird geladen" />
        </div>
      </PageFrame>
    );
  }

  if (state.status === "error") {
    return (
      <PageFrame dateKey={dateKey}>
        <ErrorBanner message={state.message} />
      </PageFrame>
    );
  }

  if (state.status === "no_run" || state.status === "run_unplayable") {
    return (
      <PageFrame dateKey={dateKey}>
        <p className="rounded-2xl bg-[#1A1A1A] p-6 text-center text-sm text-[#A8A8A8] ring-1 ring-[#1F1F1F]">
          Diese Frage ist gerade nicht verfügbar.
        </p>
      </PageFrame>
    );
  }

  if (revealedCards.length === 0) {
    return (
      <PageFrame dateKey={dateKey}>
        <p className="rounded-2xl bg-[#1A1A1A] p-6 text-center text-sm text-[#A8A8A8] ring-1 ring-[#1F1F1F]">
          Für diesen Tag liegen noch keine Reveal-Daten vor.
        </p>
      </PageFrame>
    );
  }

  const total = revealedCards.length;
  const clampedIndex = Math.min(Math.max(0, safeIndex), total - 1);
  const card = revealedCards[clampedIndex];

  const goTo = (nextIndex: number) => {
    const target = Math.min(Math.max(0, nextIndex), total - 1);
    if (target === clampedIndex) return;
    router.replace(`/past-dailies/${dateKey}/${target}`);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const distance = info.offset.x;
    const velocity = info.velocity.x;
    const goPrev =
      distance > SWIPE_DISTANCE_THRESHOLD ||
      velocity > SWIPE_VELOCITY_THRESHOLD;
    const goNext =
      distance < -SWIPE_DISTANCE_THRESHOLD ||
      velocity < -SWIPE_VELOCITY_THRESHOLD;
    if (goPrev) goTo(clampedIndex - 1);
    else if (goNext) goTo(clampedIndex + 1);
  };

  return (
    <PageFrame dateKey={dateKey}>
      <motion.div
        key={`${dateKey}-${clampedIndex}`}
        drag="x"
        dragElastic={0.2}
        dragMomentum={false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="touch-pan-y"
      >
        <StoryShell
          position={{ current: clampedIndex + 1, total }}
          categoryLabel={CATEGORY_LABELS[card.question.category]}
          accentColor={STORY_COLORS.archiv}
          questionText={card.question.text}
          body={
            <RevealBody
              result={card.result}
              runId={card.question.runId ?? dateKey}
              dateKey={dateKey}
              questionId={card.question.questionId}
              currentUserId={currentUserId}
            />
          }
          footer={
            <InlineCommentsSection
              dateKey={dateKey}
              runId={card.question.runId ?? dateKey}
              questionId={card.question.questionId}
            />
          }
        />
      </motion.div>

      <PagerControls
        index={clampedIndex}
        total={total}
        dateKey={dateKey}
        onJump={(targetIndex) => goTo(targetIndex)}
      />
    </PageFrame>
  );
}

function PageFrame({
  dateKey,
  children,
}: {
  dateKey: string;
  children: React.ReactNode;
}) {
  const dateLabel = formatBerlinDateLabel(dateKey);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/past-dailies/${dateKey}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-archive-primary"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span aria-hidden>‹</span> {dateLabel}
        </Link>
        <span
          className="text-[10px] uppercase tracking-[0.2em]"
          style={{
            fontFamily: "var(--font-mono)",
            color: STORY_COLORS.ink50,
          }}
        >
          {dateKey}
        </span>
      </div>
      {children}
    </div>
  );
}

function PagerControls({
  index,
  total,
  dateKey,
  onJump,
}: {
  index: number;
  total: number;
  dateKey: string;
  onJump: (next: number) => void;
}) {
  return (
    <div
      className="mt-2 flex items-center justify-between"
      aria-label="Story-Navigation"
    >
      <button
        type="button"
        onClick={() => onJump(index - 1)}
        disabled={index === 0}
        className="inline-flex size-9 items-center justify-center rounded-full ring-1 ring-[#1F1F1F] text-[#A8A8A8] transition hover:bg-[#0E0E0E] disabled:opacity-40"
        aria-label="Vorherige Frage"
      >
        ‹
      </button>

      <div className="flex flex-1 items-center justify-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const isCurrent = i === index;
          const dotColor = isCurrent ? STORY_COLORS.archiv : STORY_COLORS.hair;
          const href = `/past-dailies/${dateKey}/${i}`;
          return (
            <Link
              key={i}
              href={href}
              replace
              aria-label={`Zu Frage ${i + 1}`}
              className="block size-1.5 rounded-full transition"
              style={{ backgroundColor: dotColor }}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onJump(index + 1)}
        disabled={index === total - 1}
        className="inline-flex size-9 items-center justify-center rounded-full ring-1 ring-[#1F1F1F] text-[#A8A8A8] transition hover:bg-[#0E0E0E] disabled:opacity-40"
        aria-label="Nächste Frage"
      >
        ›
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reveal-Body — Type-spezifischer Renderer.
// ----------------------------------------------------------------------------

function RevealBody({
  result,
  runId,
  dateKey,
  questionId,
  currentUserId,
}: {
  result: QuestionResult;
  runId?: string;
  dateKey?: string;
  questionId?: string;
  currentUserId?: string;
}) {
  // Archiv-Page-Akzent = Coral (Archiv-Tab-Farbe).
  const accent = STORY_COLORS.archiv;

  if (isChartableResult(result)) {
    const { options, totalVoters } = resultToRevealOptions(result);
    if (totalVoters === 0) {
      return <NoVotesPlaceholder />;
    }
    return (
      <RevealBarChart
        options={options}
        totalVoters={totalVoters}
        primaryColor={accent}
      />
    );
  }

  if (result.questionType === "open_text") {
    return <OpenTextRevealBody result={result} />;
  }

  return (
    <MemeCaptionRevealBody
      result={result}
      accentColor={accent}
      runId={runId}
      dateKey={dateKey}
      questionId={questionId}
      currentUserId={currentUserId}
    />
  );
}

function OpenTextRevealBody({ result }: { result: OpenTextResult }) {
  if (result.entries.length === 0) {
    return (
      <p className="text-[13px]" style={{ color: STORY_COLORS.ink50 }}>
        Noch keine Antworten.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {result.entries.map((entry, idx) => (
        <li
          key={`${entry.author?.userId ?? "anon"}-${idx}`}
          className="flex items-start gap-3"
        >
          {entry.author ? (
            <AvatarCircle
              member={entry.author}
              size="sm"
              className="mt-0.5 size-8 shrink-0"
            />
          ) : (
            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1F1F1F] text-[11px] text-[#6E6E73]">
              ?
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p
              className="text-[12px] font-semibold"
              style={{ color: STORY_COLORS.ink70 }}
            >
              {entry.author?.displayName ?? "Anonym"}
            </p>
            <p
              className="mt-0.5 text-[15px] leading-relaxed"
              style={{ color: STORY_COLORS.ink }}
            >
              {entry.text}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MemeCaptionRevealBody({
  result,
  accentColor,
  runId,
  dateKey,
  questionId,
  currentUserId,
}: {
  result: MemeCaptionResult;
  accentColor: string;
  runId?: string;
  dateKey?: string;
  questionId?: string;
  currentUserId?: string;
}) {
  return (
    <MemeCaptionCarousel
      result={result}
      accentColor={accentColor}
      runId={runId}
      dateKey={dateKey}
      questionId={questionId}
      currentUserId={currentUserId}
    />
  );
}

function NoVotesPlaceholder() {
  return (
    <p className="text-[13px]" style={{ color: STORY_COLORS.ink50 }}>
      Noch keine Stimmen.
    </p>
  );
}
