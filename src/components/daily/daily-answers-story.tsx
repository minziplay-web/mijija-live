"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

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
 * Nach Submit der LETZTEN offenen Frage → Auto-Redirect zu "/" via router.push.
 */
export function DailyAnswersStory({ state: initial, onSubmitAnswer }: Props) {
  const router = useRouter();
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
      onFinish={() => router.push("/")}
    />
  );
}

function DailyAnswersStoryReady({
  state,
  setState,
  onSubmitAnswer,
  onFinish,
}: {
  state: ReadyState;
  setState: (updater: (prev: DailyViewState) => DailyViewState) => void;
  onSubmitAnswer?: Props["onSubmitAnswer"];
  onFinish: () => void;
}) {
  const { cards } = state;
  const total = cards.length;

  const initialIndex = useMemo(() => {
    if (cards.length === 0) return 0;
    const firstOpen = cards.findIndex(
      (card) => card.phase === "unanswered" || card.phase === "error",
    );
    return firstOpen === -1 ? 0 : firstOpen;
  }, [cards]);

  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<1 | -1>(1);
  const didSeedRef = useRef(false);
  const finishTimer = useRef<number | null>(null);

  // Seed initial index once when cards arrive.
  useEffect(() => {
    if (cards.length === 0) {
      didSeedRef.current = false;
      return;
    }
    if (didSeedRef.current) return;
    didSeedRef.current = true;
    setIndex(initialIndex);
  }, [cards, initialIndex]);

  // All-answered detection → toast + auto redirect.
  const allAnswered = useMemo(
    () =>
      total > 0 &&
      cards.every(
        (card) =>
          card.phase === "submitted_waiting_reveal" ||
          card.phase === "revealed",
      ),
    [cards, total],
  );

  useEffect(() => {
    if (!allAnswered) return;
    if (finishTimer.current) window.clearTimeout(finishTimer.current);
    finishTimer.current = window.setTimeout(() => {
      onFinish();
    }, 1400);
    return () => {
      if (finishTimer.current) {
        window.clearTimeout(finishTimer.current);
        finishTimer.current = null;
      }
    };
  }, [allAnswered, onFinish]);

  if (total === 0) {
    return (
      <DailyMessage
        eyebrow="HEUTE"
        title="Heute keine Fragen"
        description="Aktuell sind keine spielbaren Fragen vorhanden."
        cta={{ href: "/", label: "ZUR HOME" }}
      />
    );
  }

  const safeIndex = Math.max(0, Math.min(index, total - 1));
  const current = cards[safeIndex];

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
    const willFinish = state.cards.every(
      (card) =>
        getCardKey(card) === cardKey ||
        card.phase === "submitted_waiting_reveal" ||
        card.phase === "revealed",
    );

    const nextOpenIndex = findNextOpenQuestionIndex(state.cards, safeIndex);

    updateCard(cardKey, (card) => ({
      phase: "submitting",
      question: card.question,
      draft,
    }));

    if (!willFinish && nextOpenIndex >= 0) {
      window.setTimeout(() => {
        setDirection(nextOpenIndex > safeIndex ? 1 : -1);
        setIndex(nextOpenIndex);
      }, 320);
    }

    const currentCard = state.cards.find((c) => getCardKey(c) === cardKey);

    if (onSubmitAnswer && currentCard) {
      void onSubmitAnswer(draft, currentCard)
        .then(() => {
          updateCard(cardKey, (card) => ({
            phase: "submitted_waiting_reveal",
            question: card.question,
            myAnswer: draft,
          }));
        })
        .catch((error) => {
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
        });
      return;
    }

    // Mock fallback when no submit handler is wired up.
    window.setTimeout(() => {
      updateCard(cardKey, (card) => ({
        phase: "submitted_waiting_reveal",
        question: card.question,
        myAnswer: draft,
      }));
    }, 350);
  };

  const answeredCount = state.progress.answered;

  return (
    <div className="flex flex-col gap-3 pb-2 pt-2">
      {/* Header: Heute / Counter */}
      <header className="flex items-center justify-between px-1 pt-1">
        <h1
          className="text-[18px] tracking-tight"
          style={{ color: STORY_COLORS.ink, fontWeight: 600 }}
        >
          Antworten
        </h1>
        <span
          className="text-[11px] tabular-nums"
          style={{
            color: STORY_COLORS.ink50,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          {answeredCount}/{total} beantwortet
        </span>
      </header>

      {allAnswered ? (
        <div
          role="status"
          className="mx-1 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[13px]"
          style={{
            backgroundColor: STORY_COLORS.antworten,
            color: "#FFFFFF",
            fontWeight: 600,
          }}
        >
          <span>Daily fertig — leite weiter…</span>
          <Link
            href="/"
            className="text-[11px] underline-offset-2 hover:underline"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            JETZT
          </Link>
        </div>
      ) : null}

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
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 60, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 32,
              mass: 0.6,
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
}: {
  card: DailyQuestionCardState;
  onDraftChange: (next: DailyAnswerDraft) => void;
  onSubmit: (draft: DailyAnswerDraft) => void;
  position: { current: number; total: number };
}) {
  const { question } = card;
  const submitting = card.phase === "submitting";
  const alreadyAnswered =
    card.phase === "submitted_waiting_reveal" || card.phase === "revealed";

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
            disabled={!draftReady || submitting}
            loading={submitting}
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
  label,
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
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
        backgroundColor: STORY_COLORS.antworten,
        color: "#FFFFFF",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        fontWeight: 600,
      }}
    >
      {loading ? (
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
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-sand-100">
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
      <article className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 py-8 text-center shadow-sm ring-1 ring-sand-100">
        <span
          aria-hidden
          className="inline-flex size-10 items-center justify-center rounded-full text-base"
          style={{
            backgroundColor: STORY_COLORS.hairSoft,
            color: accent,
          }}
        >
          ✶
        </span>
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

