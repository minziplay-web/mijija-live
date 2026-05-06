"use client";

import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { QuestionInput } from "@/components/daily/question-input";
import { STORY_COLORS, StoryShell } from "@/components/story";
import { ThreeBodyLoader } from "@/components/ui/loader";
import { CATEGORY_LABELS } from "@/lib/mapping/categories";
import { mergeDailyState } from "@/lib/mapping/state-merge";
import type {
  DailyAnswerDraft,
  DailyQuestionCardState,
  DailyViewState,
} from "@/lib/types/frontend";

const SWIPE_DISTANCE = 80;
const SWIPE_VELOCITY = 500;

type ReadyState = Extract<DailyViewState, { status: "ready" }>;

interface Props {
  state: DailyViewState;
  onSubmitAnswer?: (
    draft: DailyAnswerDraft,
    card: DailyQuestionCardState,
  ) => Promise<void>;
}

/**
 * DailyAnswersStory — Stage-1 Story-Format-Antwort-Page.
 *
 * Die /daily-Route ist eine Antwort-Surface (kein Reveal). Pro Frage gibt es
 * einen Slide in einer StoryShell. Type-spezifische Antwort-Renderer werden
 * via QuestionInput (single_choice, multi_choice, open_text, either_or,
 * duel_1v1, duel_2v2, meme_caption) eingehängt.
 *
 * Navigation: horizontale Swipe-Geste via motion drag. Threshold ~80px ODER
 * Velocity > 500. Snap-back wenn nicht genug. Pagination-Dots als Fallback.
 *
 * User darf nur die "current"-Frage beantworten — alle anderen Slides werden
 * als read-only Preview angezeigt (disabled QuestionInput, Status-Badge).
 *
 * Kein Auto-Redirect mehr (User-Decision 2026-05-06 R3): wenn alle Fragen
 * beantwortet sind, zeigt die Page einen Empty-State mit CTA zur Home.
 */
export function DailyAnswersStory({ state: initial, onSubmitAnswer }: Props) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    queueMicrotask(() => setState((prev) => mergeDailyState(prev, initial)));
  }, [initial]);

  if (state.status === "loading") {
    return <DailyLoading />;
  }

  if (state.status === "error") {
    return <DailyMessage title="Fehler" description={state.message} variant="error" />;
  }

  if (state.status === "no_run") {
    return (
      <DailyMessage
        eyebrow="HEUTE"
        title="Heute keine Fragen"
        description={state.message}
        cta={{ href: "/", label: "ZUR HOME" }}
      />
    );
  }

  if (state.status === "run_unplayable") {
    return (
      <DailyMessage
        eyebrow="HEUTE"
        title="Daily nicht spielbar"
        description={
          state.isAdmin
            ? `${state.reason} Erzeuge im Admin einen neuen Run.`
            : `${state.reason} Ein Admin muss den Run neu erzeugen.`
        }
        cta={{ href: "/", label: "ZUR HOME" }}
      />
    );
  }

  return (
    <DailyAnswersStoryReady
      state={state}
      setState={setState}
      onSubmitAnswer={onSubmitAnswer}
    />
  );
}

function DailyAnswersStoryReady({
  state,
  setState,
  onSubmitAnswer,
}: {
  state: ReadyState;
  setState: (updater: (prev: DailyViewState) => DailyViewState) => void;
  onSubmitAnswer?: Props["onSubmitAnswer"];
}) {
  const { cards } = state;

  // recentlySaved trackt Cards die gerade gespeichert wurden — während dieser
  // 1200ms zeigt der Submit-Button "GESPEICHERT ✓" als Feedback bevor die Card
  // aus openCards rausfliegt.
  const [recentlySaved, setRecentlySaved] = useState<Set<string>>(new Set());

  // User-Decision 2026-05-06 R3: Antworten-Tab zeigt NUR offene Fragen.
  // Submitting bleibt drin damit Loading-State sichtbar ist. recentlySaved
  // hält die Card auch nach Server-Snapshot kurz drin damit GESPEICHERT-
  // Flash sichtbar bleibt (Snapshot würde sonst sofort auf submitted_*-
  // Phase wechseln und Filter würde Card rauswerfen).
  const openCards = useMemo(
    () =>
      cards.filter((card) => {
        if (
          card.phase === "unanswered" ||
          card.phase === "error" ||
          card.phase === "submitting"
        ) {
          return true;
        }
        return recentlySaved.has(getCardKey(card));
      }),
    [cards, recentlySaved],
  );
  const total = openCards.length;
  const initialIndex = 0;

  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Wenn keine offenen Fragen mehr → Empty-State, kein Slide-Stack.
  if (total === 0) {
    return (
      <DailyMessage
        eyebrow="HEUTE"
        title="Keine offenen Fragen"
        description="Sobald neue Daily-Fragen da sind, tauchen sie hier auf."
        cta={{ href: "/", label: "ZU DEN ANTWORTEN" }}
      />
    );
  }

  const safeIndex = Math.max(0, Math.min(index, total - 1));
  const current = openCards[safeIndex];

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

  const updateCard = (
    cardKey: string,
    mutate: (card: DailyQuestionCardState) => DailyQuestionCardState,
  ) => {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      const nextCards = prev.cards.map((card) =>
        getCardKey(card) === cardKey ? mutate(card) : card,
      );
      const answered = nextCards.filter(
        (c) => c.phase === "submitted_waiting_reveal" || c.phase === "revealed",
      ).length;
      return {
        ...prev,
        cards: nextCards,
        progress: { answered, total: nextCards.length },
      };
    });
  };

  const handleDraftChange = (cardKey: string, draft: DailyAnswerDraft) => {
    updateCard(cardKey, (card) => {
      if (card.phase === "unanswered") return { ...card, draft };
      if (card.phase === "error") return { ...card, lastDraft: draft };
      return card;
    });
  };

  const handleSubmit = (cardKey: string, draft: DailyAnswerDraft) => {
    // UI-getriebene Sequenz unabhängig von Server-Speed:
    //   t=0     → submitting (Loader-Button "WIRD GESENDET")
    //   t=400   → saved (grüner "GESPEICHERT ✓"-Button)
    //   t=1200  → submitted_waiting_reveal (Card transitioniert weg)
    // Server läuft parallel; Fehler bricht die Sequenz und schaltet auf phase=error.
    updateCard(cardKey, (card) => ({
      phase: "submitting",
      question: card.question,
      draft,
    }));

    const currentCard = state.cards.find((c) => getCardKey(c) === cardKey);
    let aborted = false;

    const loaderTimer = window.setTimeout(() => {
      if (aborted) return;
      setRecentlySaved((prev) => {
        const next = new Set(prev);
        next.add(cardKey);
        return next;
      });
    }, 400);

    const finalTimer = window.setTimeout(() => {
      if (aborted) return;
      updateCard(cardKey, (card) => ({
        phase: "submitted_waiting_reveal",
        question: card.question,
        myAnswer: draft,
      }));
      setRecentlySaved((prev) => {
        const next = new Set(prev);
        next.delete(cardKey);
        return next;
      });
    }, 1200);

    const handleError = (error: unknown) => {
      aborted = true;
      window.clearTimeout(loaderTimer);
      window.clearTimeout(finalTimer);
      setRecentlySaved((prev) => {
        const next = new Set(prev);
        next.delete(cardKey);
        return next;
      });
      const message =
        error instanceof Error
          ? error.message
          : "Antwort konnte nicht gespeichert werden.";
      updateCard(cardKey, (card) => ({
        phase: "error",
        question: card.question,
        message,
        lastDraft: draft,
      }));
    };

    if (onSubmitAnswer && currentCard) {
      void onSubmitAnswer(draft, currentCard).catch(handleError);
    }
    // Im Mock-Mode (kein onSubmitAnswer) läuft die Sequenz auch durch — die
    // Timer fahren das Phase-Update wie auf Live-System.
  };

  return (
    <div className="flex flex-col gap-3 pb-2 pt-2">
      {/* Page-Header — eyebrow + title in Antworten-Tab-Akzent (brand blue) */}
      <header className="flex items-end justify-between gap-3 px-1 pt-1">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{
              color: STORY_COLORS.antworten,
              fontFamily: "var(--font-mono)",
            }}
          >
            FRAGEN AUF DIESER SEITE
          </p>
          <h1
            className="mt-0.5 text-[26px] font-semibold leading-[1.1] tracking-tight"
            style={{ color: STORY_COLORS.ink }}
          >
            Fragen
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
          {total === 1 ? "1 offen" : `${total} offen`}
        </span>
      </header>

      {state.hasIncompleteItems ? (
        <div
          className="mx-1 flex items-start gap-3 rounded-2xl px-4 py-3 text-[13px]"
          style={{
            backgroundColor: STORY_COLORS.hairSoft,
            color: STORY_COLORS.ink70,
          }}
        >
          <span aria-hidden className="shrink-0 text-[15px] leading-none">⚠️</span>
          <p className="leading-snug">
            Einige Fragen konnten nicht geladen werden und sind übersprungen.
          </p>
        </div>
      ) : null}

      {/* Slide-Stack */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={getCardKey(current)}
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
            <AnswerSlide
              card={current}
              onDraftChange={(draft) =>
                handleDraftChange(getCardKey(current), draft)
              }
              onSubmit={(draft) => handleSubmit(getCardKey(current), draft)}
              position={{ current: safeIndex + 1, total }}
              saved={recentlySaved.has(getCardKey(current))}
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
          {cards.map((card, i) => {
            const isCurrent = i === safeIndex;
            const slideAnswered =
              card.phase === "submitted_waiting_reveal" ||
              card.phase === "revealed";
            return (
              <button
                key={getCardKey(card)}
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
                    ? STORY_COLORS.antworten
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

function AnswerSlide({
  card,
  onDraftChange,
  onSubmit,
  position,
  saved = false,
}: {
  card: DailyQuestionCardState;
  onDraftChange: (next: DailyAnswerDraft) => void;
  onSubmit: (draft: DailyAnswerDraft) => void;
  position: { current: number; total: number };
  saved?: boolean;
}) {
  const { question } = card;
  const submitting = card.phase === "submitting";
  // Wenn `saved` aktiv ist (GESPEICHERT-Flash), behandle die Card noch nicht
  // als "alreadyAnswered" — sonst würde die Submit-Button-Section vom
  // Pill-Hinweis ersetzt und der Flash wäre nicht mehr sichtbar.
  const alreadyAnswered =
    !saved &&
    (card.phase === "submitted_waiting_reveal" || card.phase === "revealed");

  const draft =
    card.phase === "unanswered"
      ? card.draft
      : card.phase === "submitting"
        ? card.draft
        : card.phase === "error"
          ? card.lastDraft
          : card.phase === "submitted_waiting_reveal"
            ? card.myAnswer
            : card.myAnswer;

  const errorMessage = card.phase === "error" ? card.message : undefined;
  const draftReady = draftIsComplete(draft);

  return (
    <StoryShell
      position={position}
      category={question.category}
      categoryLabel={CATEGORY_LABELS[question.category]}
      questionText={question.text}
      body={
        <div className="space-y-3">
          {alreadyAnswered ? (
            <div
              className="rounded-2xl px-4 py-3 text-[12px]"
              style={{
                backgroundColor: STORY_COLORS.hairSoft,
                color: STORY_COLORS.ink70,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              ANTWORT GESPEICHERT
            </div>
          ) : null}
          <QuestionInput
            question={question}
            draft={draft}
            disabled={submitting || alreadyAnswered}
            onDraftChange={onDraftChange}
          />
          {errorMessage ? (
            <p
              className="text-[12px]"
              style={{ color: "#B0353A", fontWeight: 500 }}
            >
              {errorMessage}
            </p>
          ) : null}
        </div>
      }
      footer={
        alreadyAnswered ? (
          <p
            className="text-center text-[11px]"
            style={{
              color: STORY_COLORS.ink50,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            SWIPE ZU NÄCHSTER FRAGE
          </p>
        ) : (
          <SubmitButton
            disabled={!draftReady || submitting || saved}
            loading={submitting && !saved}
            saved={saved}
            label={
              question.type === "meme_caption"
                ? "MEME ABSCHICKEN"
                : "ABSCHICKEN"
            }
            onClick={() => {
              if (draft && draftIsComplete(draft)) {
                onSubmit(draft);
              }
            }}
          />
        )
      }
    />
  );
}

function SubmitButton({
  disabled,
  loading,
  saved = false,
  label,
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
  saved?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[13px] transition disabled:opacity-40"
      style={{
        backgroundColor: saved ? "#1F8B5A" : STORY_COLORS.antworten,
        color: "#FFFFFF",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        fontWeight: 600,
      }}
    >
      {saved ? (
        <>
          <span aria-hidden>✓</span>
          GESPEICHERT
        </>
      ) : loading ? (
        <>
          <ThreeBodyLoader size={14} color="#FFFFFF" label="Wird gesendet" />
          WIRD GESENDET
        </>
      ) : (
        label
      )}
    </button>
  );
}

function DailyLoading() {
  return (
    <div className="flex flex-col gap-3 pb-2 pt-2">
      <header className="flex items-center justify-between px-1 pt-1">
        <h1
          className="text-[18px] tracking-tight"
          style={{ color: STORY_COLORS.ink, fontWeight: 600 }}
        >
          Antworten
        </h1>
      </header>
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-[#161616]">
        <ThreeBodyLoader size={48} label="Daily wird geladen" />
      </div>
    </div>
  );
}

function DailyMessage({
  eyebrow,
  title,
  description,
  cta,
  variant = "info",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  cta?: { href: string; label: string };
  variant?: "info" | "error";
}) {
  const accent =
    variant === "error" ? "#B0353A" : STORY_COLORS.antworten;
  return (
    <div className="flex flex-col gap-3 pb-2 pt-2">
      <header className="px-1 pt-1">
        {eyebrow ? (
          <p
            className="text-[10px] tabular-nums"
            style={{
              color: STORY_COLORS.ink50,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.18em",
              fontWeight: 600,
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="mt-1 text-[24px] tracking-tight"
          style={{ color: STORY_COLORS.ink, fontWeight: 600 }}
        >
          {title}
        </h1>
      </header>
      <article className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#161616] px-6 py-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={variant === "error" ? "/accents/target.svg" : "/accents/inspiration.svg"}
          alt=""
          aria-hidden
          width={64}
          height={64}
          className="opacity-90"
        />
        {description ? (
          <p
            className="max-w-[28ch] text-[13px] leading-snug"
            style={{ color: STORY_COLORS.ink70 }}
          >
            {description}
          </p>
        ) : null}
        {cta ? (
          <Link
            href={cta.href}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] tabular-nums transition hover:opacity-90"
            style={{
              backgroundColor: STORY_COLORS.hairSoft,
              color: STORY_COLORS.ink,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            {cta.label}
          </Link>
        ) : null}
      </article>
    </div>
  );
}

function getCardKey(card: DailyQuestionCardState) {
  return `${card.question.runId ?? "daily"}:${card.question.questionId}`;
}

function findNextOpenQuestionIndex(
  cards: DailyQuestionCardState[],
  currentIndex: number,
) {
  for (let offset = 1; offset < cards.length; offset += 1) {
    const idx = (currentIndex + offset) % cards.length;
    const card = cards[idx];
    if (card.phase === "unanswered" || card.phase === "error") {
      return idx;
    }
  }
  return -1;
}

function draftIsComplete(
  draft: DailyAnswerDraft | undefined,
): draft is DailyAnswerDraft {
  if (!draft) return false;
  switch (draft.type) {
    case "single_choice":
      return Boolean(draft.selectedUserId);
    case "multi_choice":
      return draft.selectedUserIds.length > 0;
    case "open_text":
      return draft.textAnswer.trim().length > 0;
    case "duel_1v1":
      return Boolean(draft.selectedSide);
    case "duel_2v2":
      return Boolean(draft.selectedTeam);
    case "either_or":
      return draft.selectedOptionIndex !== undefined;
    case "meme_caption":
      return draft.textAnswer.trim().length > 0;
  }
}

