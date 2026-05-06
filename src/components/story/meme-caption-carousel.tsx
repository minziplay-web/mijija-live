"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";

import { AvatarCircle } from "@/components/ui/avatar";
import { MemeImage } from "@/components/daily/meme-image";
import { STORY_COLORS } from "@/components/story/constants";
import { HeartIcon } from "@/components/story/comment-icons";
import { submitMemeCaptionVote } from "@/lib/firebase/daily-actions";
import type { MemeCaptionResult } from "@/lib/types/frontend";

/**
 * MemeCaptionCarousel — jedes erstellte Meme als eigenständiger "Insta-Post".
 *
 * User-Decision 2026-05-06: pro Caption ein eigener Slide. Plus pro Slide ein
 * Like-Button (HeartIcon, calls submitMemeCaptionVote). Letzter Slide ist die
 * Ranking-Übersicht: Top-Liste sortiert nach Likes.
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
  // Optimistic-State pro authorUserId — überschreibt server thumbsUpCount/iVoted
  // sofort beim Klick. State wird beim nächsten snapshot vom Server überschrieben.
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

  const [index, setIndex] = useState(0);
  const totalCaptions = ranked.length;
  // Ranking-Slide nur wenn überhaupt mehr als eine Caption existiert.
  const hasRankingSlide = totalCaptions > 1;
  const totalSlides = hasRankingSlide ? totalCaptions + 1 : totalCaptions;
  const showedHintRef = useRef(false);

  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (showedHintRef.current) return;
    if (totalSlides <= 1) return;
    showedHintRef.current = true;
    const t = setTimeout(() => setHint(true), 350);
    const t2 = setTimeout(() => setHint(false), 1300);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [totalSlides]);

  const goTo = (next: number) => {
    const target = Math.max(0, Math.min(totalSlides - 1, next));
    if (target === index) return;
    setIndex(target);
  };

  const SWIPE_DISTANCE = 60;
  const SWIPE_VELOCITY = 320;
  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      goTo(index + 1);
    } else if (
      info.offset.x > SWIPE_DISTANCE ||
      info.velocity.x > SWIPE_VELOCITY
    ) {
      goTo(index - 1);
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

  const safeIndex = Math.min(Math.max(index, 0), totalSlides - 1);
  const isRankingSlide = hasRankingSlide && safeIndex === totalCaptions;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-clip">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isRankingSlide ? "ranking" : safeIndex}
            initial={{ opacity: 0 }}
            animate={
              hint
                ? {
                    x: [-10, 0],
                    opacity: 1,
                    transition: { duration: 0.6, ease: "easeOut" },
                  }
                : { opacity: 1 }
            }
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            drag={totalSlides > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="touch-pan-y"
          >
            {isRankingSlide ? (
              <RankingSlide
                ranked={ranked}
                accentColor={accentColor}
                imagePath={result.imagePath}
              />
            ) : (
              <CaptionSlide
                ranked={ranked}
                safeIndex={safeIndex}
                accentColor={accentColor}
                imagePath={result.imagePath}
                canVote={canVote}
                currentUserId={currentUserId}
                onToggleLike={toggleLike}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

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

function CaptionSlide({
  ranked,
  safeIndex,
  accentColor,
  imagePath,
  canVote,
  currentUserId,
  onToggleLike,
}: {
  ranked: RankedCaption[];
  safeIndex: number;
  accentColor: string;
  imagePath: string;
  canVote: boolean;
  currentUserId?: string;
  onToggleLike: (authorUserId: string, currentlyVoted: boolean) => void;
}) {
  const current = ranked[safeIndex];
  const isWinner = safeIndex === 0 && current.count > 0;
  const authorUserId = current.entry.author?.userId;
  const isOwnCaption = Boolean(authorUserId && authorUserId === currentUserId);
  const likeDisabled = !canVote || !authorUserId || isOwnCaption;

  return (
    <>
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: STORY_COLORS.hairSoft }}
      >
        <MemeImage
          imagePath={imagePath}
          caption={current.entry.text}
          frame="standalone"
        />
      </div>

      <div className="mt-3 flex items-center gap-2.5">
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
    </>
  );
}

function RankingSlide({
  ranked,
  accentColor,
  imagePath,
}: {
  ranked: RankedCaption[];
  accentColor: string;
  imagePath: string;
}) {
  const totalLikes = ranked.reduce((sum, r) => sum + r.count, 0);
  const winnerCount = ranked[0]?.count ?? 0;
  const winner = winnerCount > 0 ? ranked[0] : null;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ backgroundColor: STORY_COLORS.hairSoft }}
      >
        <MemeImage imagePath={imagePath} frame="standalone" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <span
            className="text-[10px] tabular-nums"
            style={{
              color: accentColor,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.22em",
            }}
          >
            ENDSTAND
          </span>
          <h3
            className="text-[22px] font-semibold leading-tight"
            style={{ color: "#FFFFFF", textWrap: "balance" }}
          >
            {winner ? `${winner.entry.author?.displayName ?? "Unbekannt"}` : "Noch keine Likes"}
          </h3>
          {winner ? (
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.78)" }}
            >
              {winnerCount === 1 ? "1 Like" : `${winnerCount} Likes`} ·{" "}
              gewinnt diese Runde
            </p>
          ) : (
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.78)" }}
            >
              Niemand hat bisher geliked.
            </p>
          )}
        </div>
      </div>

      <ol className="flex flex-col">
        {ranked.map((row, idx) => {
          // Standard-Ranking mit Lücken bei Gleichstand: 1, 2, 2, 4 …
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
