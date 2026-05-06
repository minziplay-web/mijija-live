"use client";

import Link from "next/link";
import { animate, motion, useMotionValue, type PanInfo } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

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
const SLIDE_TRANSITION = {
  type: "tween",
  duration: 0.32,
  ease: [0.22, 0.61, 0.36, 1],
} as const;

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

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => setWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const safeIndex = Math.max(0, Math.min(index, Math.max(0, total - 1)));
  // motion-value-getriebene Animation — kein React-Re-Render pro Frame.
  const x = useMotionValue(0);
  useEffect(() => {
    if (width === 0 || total === 0) return;
    const controls = animate(x, -safeIndex * width, SLIDE_TRANSITION);
    return () => controls.stop();
  }, [safeIndex, width, x, total]);

  if (total === 0) {
    return <NoDailySlide displayName={state.greeting.displayName} />;
  }

  // Page-Akzent = Tab-Farbe (Daily-Orange). Kategorie-Farben sind deprecated.
  const accent = STORY_COLORS.daily;

  const goNext = () => {
    if (safeIndex < total - 1) setIndex(safeIndex + 1);
  };
  const goPrev = () => {
    if (safeIndex > 0) setIndex(safeIndex - 1);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const distance = info.offset.x;
    const velocity = info.velocity.x;

    let nextIndex = safeIndex;
    if (distance < -SWIPE_DISTANCE || velocity < -SWIPE_VELOCITY) {
      nextIndex = safeIndex + 1;
    } else if (distance > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY) {
      nextIndex = safeIndex - 1;
    }
    const clamped = Math.max(0, Math.min(total - 1, nextIndex));
    if (clamped === safeIndex) {
      animate(x, -safeIndex * width, SLIDE_TRANSITION);
    } else {
      setIndex(clamped);
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

      {/* Slide-Track — alle Slides side-by-side, x folgt dem Finger.
          Photo-gallery feel: drag → translate, drop → spring snap to nearest. */}
      <div ref={containerRef} className="relative overflow-hidden">
        <motion.div
          className="flex"
          style={{
            x,
            width: width * total || undefined,
            willChange: "transform",
          }}
          drag={total > 1 ? "x" : false}
          dragConstraints={{ left: -(total - 1) * width, right: 0 }}
          dragElastic={0.18}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
        >
          {slides.map((slide, slideIdx) => {
            const slideAnswered = isAnsweredByMe(slide.result, currentUserId);
            const slideRunId = slide.runId ?? slide.dateKey;
            return (
              <div
                key={`${slideRunId}:${slide.questionId}`}
                className="shrink-0"
                style={{ width: width || "100%" }}
              >
                <StoryShell
                  position={{ current: slideIdx + 1, total }}
                  categoryLabel={CATEGORY_LABELS[slide.category]}
                  questionText={slide.questionText}
                  accentColor={accent}
                  body={
                    slideAnswered ? (
                      <RevealBody
                        result={slide.result}
                        accentColor={accent}
                        runId={slideRunId}
                        dateKey={slide.dateKey}
                        questionId={slide.questionId}
                        currentUserId={currentUserId}
                      />
                    ) : (
                      <LockedRevealBody />
                    )
                  }
                  footer={
                    slideAnswered ? (
                      <InlineCommentsSection
                        dateKey={slide.dateKey}
                        runId={slideRunId}
                        questionId={slide.questionId}
                        hideLike={slide.result.questionType === "meme_caption"}
                      />
                    ) : undefined
                  }
                />
              </div>
            );
          })}
        </motion.div>
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
                onClick={() => setIndex(i)}
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
