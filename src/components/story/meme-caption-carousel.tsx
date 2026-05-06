"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, type PanInfo } from "motion/react";

import { AvatarCircle } from "@/components/ui/avatar";
import { MemeImage } from "@/components/daily/meme-image";
import { STORY_COLORS } from "@/components/story/constants";
import { HeartIcon } from "@/components/story/comment-icons";
import { submitMemeCaptionVote } from "@/lib/firebase/daily-actions";
import type { MemeCaptionResult } from "@/lib/types/frontend";

// iOS-Photo-Album-Easing — smooth deceleration ohne Bounce
const SLIDE_TRANSITION = {
  type: "tween",
  duration: 0.32,
  ease: [0.22, 0.61, 0.36, 1],
} as const;

/**
 * MemeCaptionCarousel — pro Caption ein Insta-Post als Slide. Track-basierter
 * Swipe (alle Slides side-by-side im flex-Track, x folgt dem Finger). Meta-Row
 * (Author + Like) liegt AUSSERHALB der Track damit Tap-Targets nicht von der
 * Drag-Geste verschluckt werden. Ranking-Slide hängt am Ende.
 */
export function MemeCaptionCarousel({
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
  type LocalVote = { iVoted: boolean; count: number };
  const [localVotes, setLocalVotes] = useState<Record<string, LocalVote>>({});

  const ranked = useMemo(() => {
    return [...result.entries]
      .map((entry, originalIdx) => {
        const authorId = entry.author?.userId;
        const local = authorId ? localVotes[authorId] : undefined;
        const count = local?.count ?? entry.thumbsUpCount ?? 0;
        const iVoted = local?.iVoted ?? entry.iVoted ?? false;
        return { entry, originalIdx, count, iVoted };
      })
      .sort((a, b) => b.count - a.count || a.originalIdx - b.originalIdx);
  }, [result.entries, localVotes]);

  const totalCaptions = ranked.length;
  const hasRankingSlide = totalCaptions > 1;
  const totalSlides = hasRankingSlide ? totalCaptions + 1 : totalCaptions;

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(Math.max(index, 0), Math.max(0, totalSlides - 1));
  const isRankingSlide = hasRankingSlide && safeIndex === totalCaptions;

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

  // useMotionValue + imperative animate — Animationen laufen direkt auf dem
  // motion-value ohne React-Re-Renders pro Frame (deutlich smoother als
  // animate-prop-driven).
  const x = useMotionValue(0);
  useEffect(() => {
    if (width === 0) return;
    const controls = animate(x, -safeIndex * width, SLIDE_TRANSITION);
    return () => controls.stop();
  }, [safeIndex, width, x]);

  const goTo = (next: number) => {
    const target = Math.max(0, Math.min(totalSlides - 1, next));
    if (target === safeIndex) return;
    setIndex(target);
  };

  const SWIPE_DISTANCE = 60;
  const SWIPE_VELOCITY = 320;
  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const { offset, velocity } = info;
    let nextIndex = safeIndex;
    if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) {
      nextIndex = safeIndex + 1;
    } else if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) {
      nextIndex = safeIndex - 1;
    }
    const clamped = Math.max(0, Math.min(totalSlides - 1, nextIndex));
    if (clamped === safeIndex) {
      // Schwelle nicht überschritten — zurück zur aktuellen Position animieren.
      animate(x, -safeIndex * width, SLIDE_TRANSITION);
    } else {
      setIndex(clamped);
    }
  };

  const canVote = Boolean(runId && dateKey && questionId && currentUserId);

  const toggleLike = async (authorUserId: string, currentlyVoted: boolean) => {
    if (!canVote) return;
    if (!runId || !dateKey || !questionId || !currentUserId) return;
    if (authorUserId === currentUserId) return;

    const prev = localVotes[authorUserId];
    const baseCount =
      prev?.count ??
      (result.entries.find((e) => e.author?.userId === authorUserId)
        ?.thumbsUpCount ?? 0);
    const nextVoted = !currentlyVoted;
    const nextCount = Math.max(0, baseCount + (nextVoted ? 1 : -1));

    setLocalVotes((prevState) => ({
      ...prevState,
      [authorUserId]: { iVoted: nextVoted, count: nextCount },
    }));

    try {
      await submitMemeCaptionVote({
        dateKey,
        runId,
        questionId,
        authorUserId,
        voterUserId: currentUserId,
        on: nextVoted,
      });
    } catch {
      setLocalVotes((prevState) => {
        const reverted = { ...prevState };
        if (prev) {
          reverted[authorUserId] = prev;
        } else {
          delete reverted[authorUserId];
        }
        return reverted;
      });
    }
  };

  if (totalCaptions === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div
          className="overflow-hidden rounded-xl"
          style={{ backgroundColor: STORY_COLORS.hairSoft }}
        >
          <MemeImage imagePath={result.imagePath} frame="standalone" />
        </div>
        <p className="text-[13px]" style={{ color: STORY_COLORS.ink50 }}>
          Noch keine Bildunterschriften.
        </p>
      </div>
    );
  }

  const winner = (ranked[0]?.count ?? 0) > 0 ? ranked[0] : null;
  const totalLikes = ranked.reduce((sum, r) => sum + r.count, 0);
  const current = ranked[Math.min(safeIndex, totalCaptions - 1)];

  return (
    <div className="flex flex-col gap-3">
      {/* TRACK — alle Slides side-by-side, x folgt dem Finger.
          Buttons & Like-Aktion liegen UNTER dem Track damit Drag sie nicht
          verschluckt. */}
      <div ref={containerRef} className="relative overflow-hidden">
        <motion.div
          className="flex"
          style={{
            x,
            width: width * totalSlides || undefined,
            willChange: "transform",
          }}
          drag={totalSlides > 1 ? "x" : false}
          dragConstraints={{
            left: -(totalSlides - 1) * width,
            right: 0,
          }}
          dragElastic={0.18}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
        >
          {ranked.map((row) => (
            <div
              key={row.entry.author?.userId ?? `cap-${row.originalIdx}`}
              className="shrink-0"
              style={{ width: width || "100%" }}
            >
              <CaptionImage imagePath={result.imagePath} text={row.entry.text} />
            </div>
          ))}
          {hasRankingSlide ? (
            <div
              key="ranking-slide"
              className="shrink-0"
              style={{ width: width || "100%" }}
            >
              <WinnerHero
                imagePath={result.imagePath}
                winnerName={winner?.entry.author?.displayName ?? null}
              />
            </div>
          ) : null}
        </motion.div>
      </div>

      {/* META-ROW — outside track damit der Like-Button sicher tappable ist. */}
      {isRankingSlide ? (
        <RankingList ranked={ranked} accentColor={accentColor} totalLikes={totalLikes} />
      ) : (
        <CaptionMeta
          current={current}
          accentColor={accentColor}
          isWinner={safeIndex === 0 && current.count > 0}
          canVote={canVote}
          currentUserId={currentUserId}
          onToggleLike={toggleLike}
        />
      )}

      {totalSlides > 1 ? (
        <div className="mt-1 flex flex-col gap-2">
          <div
            className="flex items-center justify-between text-[11px] tabular-nums"
            style={{
              color: STORY_COLORS.ink50,
              fontFamily: "var(--font-mono)",
            }}
          >
            <button
              type="button"
              onClick={() => goTo(safeIndex - 1)}
              disabled={safeIndex === 0}
              className="transition disabled:opacity-30"
              aria-label="Vorheriger Meme-Post"
            >
              ← VORHER
            </button>
            <span>
              {isRankingSlide
                ? "RANKING"
                : `${String(safeIndex + 1).padStart(2, "0")} / ${String(
                    totalCaptions,
                  ).padStart(2, "0")}`}
            </span>
            <button
              type="button"
              onClick={() => goTo(safeIndex + 1)}
              disabled={safeIndex === totalSlides - 1}
              className="transition disabled:opacity-30"
              aria-label="Nächster Meme-Post"
            >
              WEITER →
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => {
              const isRankingDot = hasRankingSlide && i === totalCaptions;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={
                    isRankingDot ? "Ranking-Übersicht" : `Meme-Post ${i + 1}`
                  }
                  className="block rounded-full transition-all"
                  style={{
                    width: i === safeIndex ? 18 : 6,
                    height: 6,
                    backgroundColor:
                      i === safeIndex ? accentColor : STORY_COLORS.hair,
                    outline: isRankingDot ? `1px solid ${accentColor}` : "none",
                    outlineOffset: isRankingDot ? "1px" : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type RankedCaption = {
  entry: MemeCaptionResult["entries"][number];
  originalIdx: number;
  count: number;
  iVoted: boolean;
};

function CaptionImage({
  imagePath,
  text,
}: {
  imagePath: string;
  text: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ backgroundColor: STORY_COLORS.hairSoft }}
    >
      <MemeImage imagePath={imagePath} caption={text} frame="standalone" />
    </div>
  );
}

function WinnerHero({
  imagePath,
  winnerName,
}: {
  imagePath: string;
  winnerName: string | null;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ backgroundColor: STORY_COLORS.hairSoft }}
    >
      <MemeImage imagePath={imagePath} frame="standalone" />
      {winnerName ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 100%)",
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-1">
            <span className="anim-crown-bob text-[28px] leading-none">👑</span>
            <span
              className="text-[15px] font-semibold tracking-tight"
              style={{
                color: "#FFFFFF",
                textShadow: "0 1px 3px rgba(0,0,0,0.55)",
              }}
            >
              {winnerName}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

function CaptionMeta({
  current,
  accentColor,
  isWinner,
  canVote,
  currentUserId,
  onToggleLike,
}: {
  current: RankedCaption;
  accentColor: string;
  isWinner: boolean;
  canVote: boolean;
  currentUserId?: string;
  onToggleLike: (authorUserId: string, currentlyVoted: boolean) => void;
}) {
  const authorUserId = current.entry.author?.userId;
  const isOwnCaption = Boolean(
    authorUserId && authorUserId === currentUserId,
  );
  const likeDisabled = !canVote || !authorUserId || isOwnCaption;

  return (
    <div className="flex items-center gap-2.5">
      {current.entry.author ? (
        <AvatarCircle member={current.entry.author} size="sm" />
      ) : (
        <div
          className="size-8 shrink-0 rounded-full"
          style={{ backgroundColor: STORY_COLORS.hairSoft }}
        />
      )}
      <span
        className="truncate text-[13px]"
        style={{
          color: STORY_COLORS.ink,
          fontWeight: isWinner ? 600 : 500,
        }}
      >
        {current.entry.author?.displayName ?? "Unbekannt"}
      </span>
      {isWinner ? (
        <span
          className="text-[10px] tabular-nums"
          style={{
            color: accentColor,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.14em",
          }}
        >
          TOP
        </span>
      ) : null}

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() =>
            authorUserId && onToggleLike(authorUserId, current.iVoted)
          }
          disabled={likeDisabled}
          aria-label={current.iVoted ? "Like entfernen" : "Liken"}
          aria-pressed={current.iVoted}
          className="inline-flex items-center justify-center rounded-full p-1 transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            color: current.iVoted ? "#E5594F" : STORY_COLORS.ink70,
          }}
          title={
            isOwnCaption
              ? "Eigene Captions kannst du nicht liken"
              : undefined
          }
        >
          <HeartIcon size={20} filled={current.iVoted} />
        </button>
        <span
          className="text-[12px] tabular-nums"
          style={{
            color: current.count > 0 ? STORY_COLORS.ink : STORY_COLORS.ink50,
            fontFamily: "var(--font-mono)",
            minWidth: "1.25ch",
          }}
        >
          {current.count}
        </span>
      </div>
    </div>
  );
}

function RankingList({
  ranked,
  accentColor,
  totalLikes,
}: {
  ranked: RankedCaption[];
  accentColor: string;
  totalLikes: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col">
        {ranked.map((row, idx) => {
          let rank = idx + 1;
          for (let i = idx - 1; i >= 0; i -= 1) {
            if (ranked[i].count === row.count) {
              rank = i + 1;
              break;
            }
          }
          const isLeader = idx === 0 && row.count > 0;
          return (
            <li
              key={row.entry.author?.userId ?? `row-${idx}`}
              className="flex items-center gap-3 border-b py-2.5 last:border-b-0"
              style={{ borderColor: STORY_COLORS.hairSoft }}
            >
              <span
                className="w-6 shrink-0 text-[12px] tabular-nums"
                style={{
                  color: isLeader ? accentColor : STORY_COLORS.ink50,
                  fontFamily: "var(--font-mono)",
                  fontWeight: isLeader ? 600 : 400,
                }}
              >
                {String(rank).padStart(2, "0")}
              </span>
              {row.entry.author ? (
                <AvatarCircle member={row.entry.author} size="sm" />
              ) : (
                <div
                  className="size-8 shrink-0 rounded-full"
                  style={{ backgroundColor: STORY_COLORS.hairSoft }}
                />
              )}
              <span
                className="min-w-0 flex-1 truncate text-[13px]"
                style={{
                  color: STORY_COLORS.ink,
                  fontWeight: isLeader ? 600 : 500,
                }}
              >
                {row.entry.author?.displayName ?? "Unbekannt"}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    color: row.iVoted ? "#E5594F" : STORY_COLORS.ink50,
                  }}
                >
                  <HeartIcon size={14} filled={row.iVoted} />
                </span>
                <span
                  className="text-[12px] tabular-nums"
                  style={{
                    color:
                      row.count > 0 ? STORY_COLORS.ink : STORY_COLORS.ink50,
                    fontFamily: "var(--font-mono)",
                    minWidth: "1.5ch",
                    textAlign: "right",
                  }}
                >
                  {row.count}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <p
        className="text-[11px] tabular-nums"
        style={{
          color: STORY_COLORS.ink50,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.04em",
        }}
      >
        {totalLikes === 1 ? "1 LIKE" : `${totalLikes} LIKES`} GESAMT
      </p>
    </div>
  );
}
