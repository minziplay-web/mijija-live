"use client";

import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useMemo, useState } from "react";

import { LockedRevealBody } from "@/components/home/locked-reveal-body";
import { RevealBody } from "@/components/home/reveal-renderers";
import { InlineCommentsSection } from "@/components/story/inline-comments";
import {
  STORY_COLORS,
  StoryShell,
} from "@/components/story";
import { useAuth } from "@/lib/auth/auth-context";
import { CATEGORY_LABELS } from "@/lib/mapping/categories";
import type { HomeViewState, QuestionResult } from "@/lib/types/frontend";

const SWIPE_DISTANCE = 80;
const SWIPE_VELOCITY = 360;

type ReadyState = Extract<HomeViewState, { status: "ready" }>;

/**
 * HomeRevealFeed — heutiger Daily als Story-Slide-Feed.
 *
 * Slide-Stack:
 *   - Pro heutiger Frage ein Slide (StoryShell + RevealBody | LockedRevealBody)
 *   - Sticky-CTA oben falls nicht alles beantwortet
 *
 * Swipe-Navigation: motion drag mit Distance + Velocity Threshold.
 */
export function HomeRevealFeed({ state }: { state: ReadyState }) {
  const { authState } = useAuth();
  const currentUserId =
    authState.status === "authenticated" ? authState.user.userId : undefined;

  const slides = useMemo(
    () => state.dailyRecap ?? [],
    [state.dailyRecap],
  );

  const total = slides.length;
  const answeredCount = useMemo(
    () =>
      slides.filter((item) => isAnsweredByMe(item.result, currentUserId)).length,
    [slides, currentUserId],
  );

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (total === 0) {
    return <NoDailySlide displayName={state.greeting.displayName} />;
  }

  const safeIndex = Math.max(0, Math.min(index, total - 1));
  const current = slides[safeIndex];
  // Page-Akzent = Tab-Farbe (Daily-Orange). Kategorie-Farben sind deprecated.
  const accent = STORY_COLORS.daily;
  const answered = isAnsweredByMe(current.result, currentUserId);

  const goNext = () => {
    if (safeIndex < total - 1) {
      setDirection(1);
      setIndex(safeIndex + 1);
    }
  };
  const goPrev = () => {
    if (safeIndex > 0) {
      setDirection(-1);
      setIndex(safeIndex - 1);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const distance = info.offset.x;
    const velocity = info.velocity.x;

    if (distance < -SWIPE_DISTANCE || velocity < -SWIPE_VELOCITY) {
      goNext();
    } else if (distance > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY) {
      goPrev();
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-2 pt-2">
      {/* Page-Header — eyebrow + title in Daily-Tab-Akzent (orange).
          Sticky-CTA entfernt (User-Decision 2026-05-06): Bell zeigt eh den
          Tageslog mit offenen Fragen, Sticky-CTA war redundant. */}
      <header className="flex items-end justify-between gap-3 px-1 pt-1">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{
              color: STORY_COLORS.daily,
              fontFamily: "var(--font-mono)",
            }}
          >
            HEUTE
          </p>
          <h1
            className="mt-0.5 text-[26px] font-semibold leading-[1.1] tracking-tight"
            style={{ color: STORY_COLORS.ink }}
          >
            Daily
          </h1>
        </div>
        <span
          className="pb-1 text-[11px] tabular-nums"
          style={{
            color: STORY_COLORS.ink50,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          {answeredCount}/{total} beantwortet
        </span>
      </header>

      {/* Slide-Stack */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`${current.runId ?? current.dateKey}:${current.questionId}`}
            custom={direction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.18,
              ease: "easeOut",
            }}
            drag="x"
            dragElastic={0.2}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="touch-pan-y"
          >
            <StoryShell
              position={{ current: safeIndex + 1, total }}
              categoryLabel={CATEGORY_LABELS[current.category]}
              questionText={current.questionText}
              accentColor={accent}
              body={
                answered ? (
                  <RevealBody
                    result={current.result}
                    accentColor={accent}
                    runId={current.runId ?? current.dateKey}
                    dateKey={current.dateKey}
                    questionId={current.questionId}
                    currentUserId={currentUserId}
                  />
                ) : (
                  <LockedRevealBody />
                )
              }
              footer={
                answered ? (
                  <InlineCommentsSection
                    dateKey={current.dateKey}
                    runId={current.runId ?? current.dateKey}
                    questionId={current.questionId}
                  />
                ) : undefined
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination dots + buttons */}
      <nav className="flex items-center justify-between gap-3 px-1">
        <button
          type="button"
          onClick={goPrev}
          disabled={safeIndex === 0}
          aria-label="Vorheriger Slide"
          className="inline-flex size-9 items-center justify-center rounded-full transition disabled:opacity-30"
          style={{
            backgroundColor: STORY_COLORS.hairSoft,
            color: STORY_COLORS.ink,
          }}
        >
          ‹
        </button>

        <div className="flex flex-1 items-center justify-center gap-1.5">
          {slides.map((slide, i) => {
            const isCurrent = i === safeIndex;
            const slideAnswered = isAnsweredByMe(slide.result, currentUserId);
            return (
              <button
                key={`${slide.runId ?? slide.dateKey}:${slide.questionId}:${i}`}
                type="button"
                onClick={() => {
                  setDirection(i > safeIndex ? 1 : -1);
                  setIndex(i);
                }}
                aria-label={`Slide ${i + 1}`}
                aria-current={isCurrent ? "step" : undefined}
                className="block h-1 rounded-full transition-all"
                style={{
                  width: isCurrent ? 18 : 6,
                  backgroundColor: isCurrent
                    ? STORY_COLORS.ink
                    : slideAnswered
                      ? STORY_COLORS.ink50
                      : STORY_COLORS.hair,
                }}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={safeIndex === total - 1}
          aria-label="Nächster Slide"
          className="inline-flex size-9 items-center justify-center rounded-full transition disabled:opacity-30"
          style={{
            backgroundColor: STORY_COLORS.hairSoft,
            color: STORY_COLORS.ink,
          }}
        >
          ›
        </button>
      </nav>
    </div>
  );
}

/**
 * isAnsweredByMe — leitet aus QuestionResult ab, ob currentUserId selbst
 * beantwortet hat. Für Choice/Duel/EitherOr nutzt myChoice*-Felder. Für
 * open_text / meme_caption checkt Author-Userid in entries.
 */
function isAnsweredByMe(
  result: QuestionResult,
  currentUserId: string | undefined,
): boolean {
  if (!currentUserId) return false;
  switch (result.questionType) {
    case "single_choice":
      return Boolean(result.myChoiceUserId);
    case "multi_choice":
      return (result.myChoiceUserIds?.length ?? 0) > 0;
    case "either_or":
      return typeof result.myChoiceIndex === "number";
    case "duel_1v1":
      return result.myChoice === "left" || result.myChoice === "right";
    case "duel_2v2":
      return result.myChoice === "teamA" || result.myChoice === "teamB";
    case "open_text":
    case "meme_caption":
      return result.entries.some(
        (entry) => entry.author?.userId === currentUserId,
      );
  }
}

function NoDailySlide({ displayName }: { displayName: string }) {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <header className="px-1">
        <p
          className="text-[10px] tabular-nums"
          style={{
            color: STORY_COLORS.ink50,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.18em",
            fontWeight: 600,
          }}
        >
          KEIN DAILY HEUTE
        </p>
        <h1
          className="mt-1 text-[24px] tracking-tight"
          style={{ color: STORY_COLORS.ink, fontWeight: 600 }}
        >
          Hi {displayName}
        </h1>
      </header>
      <article
        className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/accents/game.svg"
          alt=""
          aria-hidden
          width={64}
          height={64}
          className="opacity-90"
        />
        <p
          className="text-[15px] leading-snug"
          style={{ color: STORY_COLORS.ink, fontWeight: 600 }}
        >
          Noch kein Daily heute
        </p>
        <p
          className="max-w-[28ch] text-[13px] leading-snug"
          style={{ color: STORY_COLORS.ink50 }}
        >
          Sobald die Tagesfragen verfügbar sind, tauchen sie hier als Story-Feed
          auf.
        </p>
        <Link
          href="/past-dailies"
          className="mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] tabular-nums transition hover:opacity-90"
          style={{
            backgroundColor: STORY_COLORS.hairSoft,
            color: STORY_COLORS.ink,
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            letterSpacing: "0.06em",
          }}
        >
          ARCHIV ÖFFNEN
        </Link>
      </article>
    </div>
  );
}
