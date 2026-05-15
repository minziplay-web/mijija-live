"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DailyCompletionCard } from "@/components/daily/daily-completion-card";
import { DailyStepIndicator } from "@/components/daily/daily-step-indicator";
import { QuestionCardShell } from "@/components/daily/question-card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ThreeBodyLoader } from "@/components/ui/loader";
import { ScreenHeader } from "@/components/ui/screen-header";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import { mergeDailyState } from "@/lib/mapping/state-merge";
import type {
  DailyAnswerDraft,
  DailyQuestionCardState,
  DailyViewState,
} from "@/lib/types/frontend";

export function DailyScreen({
  state: initial,
  onSubmitAnswer,
  onVoteMemeCaption,
  completionContent,
}: {
  state: DailyViewState;
  onSubmitAnswer?: (
    draft: DailyAnswerDraft,
    card: DailyQuestionCardState,
  ) => Promise<void>;
  onVoteMemeCaption?: (
    card: DailyQuestionCardState,
    authorUserId: string,
    value: boolean,
  ) => Promise<void>;
  completionContent?: ReactNode;
}) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    queueMicrotask(() => setState((prev) => mergeDailyState(prev, initial)));
  }, [initial]);

  const cards = state.status === "ready" ? state.cards : null;

  const initialIndex = useMemo(() => {
    if (!cards || cards.length === 0) return 0;
    const firstOpen = cards.findIndex(
      (card) => card.phase === "unanswered" || card.phase === "error",
    );
    return firstOpen === -1 ? Math.max(0, cards.length - 1) : firstOpen;
  }, [cards]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showCompletion, setShowCompletion] = useState(false);
  const didInitRef = useRef(false);
  const isFirstIndexChange = useRef(true);

  useEffect(() => {
    if (isFirstIndexChange.current) {
      isFirstIndexChange.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [currentIndex]);

  // Seed currentIndex once the first card array arrives (or resets once the run changes).
  useEffect(() => {
    if (!cards || cards.length === 0) {
      didInitRef.current = false;
      return;
    }
    if (didInitRef.current) return;
    didInitRef.current = true;
    setCurrentIndex(initialIndex);
  }, [cards, initialIndex]);

  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }

    const allAnswered = state.cards.every(
      (card) =>
        card.phase === "submitted_waiting_reveal" || card.phase === "revealed",
    );

    if (allAnswered) {
      queueMicrotask(() => { setShowCompletion(true); window.scrollTo(0, 0); });
      return;
    }

    if (showCompletion) {
      const nextOpen = state.cards.findIndex(
        (card) => card.phase === "unanswered" || card.phase === "error",
      );
      if (nextOpen !== -1) {
        queueMicrotask(() => {
          setCurrentIndex(nextOpen);
          setShowCompletion(false);
        });
      }
    }
  }, [state, showCompletion]);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Heute" title="Daily" theme="daily" />
        <div className="flex justify-center py-12">
          <ThreeBodyLoader size={48} label="Daily wird geladen" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Heute" title="Daily" theme="daily" />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  if (state.status === "no_run") {
    return (
      <div className="space-y-4">
        <ScreenHeader
          eyebrow={formatBerlinDateLabel(state.dateKey)}
          title="Daily"
          theme="daily"
        />
        <EmptyState
          icon="📅"
          title="Heute keine Daily"
          description={state.message}
        />
      </div>
    );
  }

  if (state.status === "run_unplayable") {
    return (
      <div className="space-y-4">
        <ScreenHeader
          eyebrow={formatBerlinDateLabel(state.dateKey)}
          title="Daily"
          theme="daily"
        />
        <EmptyState
          icon="⚠️"
          title="Daily kann nicht gespielt werden"
          description={
            state.isAdmin
              ? `${state.reason} Erzeuge im Admin einen neuen Run.`
              : `${state.reason} Ein Admin muss den Run neu erzeugen.`
          }
        />
      </div>
    );
  }

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
    const previousIndex = currentIndex;
    const nextUnansweredIndex =
      state.status === "ready"
        ? findNextOpenQuestionIndex(state.cards, previousIndex)
        : -1;
    const willFinish =
      state.status === "ready"
        ? state.cards.every(
            (card) =>
              getCardKey(card) === cardKey ||
              card.phase === "submitted_waiting_reveal" ||
              card.phase === "revealed",
          )
        : false;

    updateCard(cardKey, (card) => ({
      phase: "submitting",
      question: card.question,
      draft,
    }));

    if (!willFinish && nextUnansweredIndex >= 0) {
      window.setTimeout(() => setCurrentIndex(nextUnansweredIndex), 350);
    }

    const currentCard =
      state.status === "ready"
        ? state.cards.find((c) => getCardKey(c) === cardKey)
        : undefined;

    if (onSubmitAnswer && currentCard) {
      void onSubmitAnswer(draft, currentCard)
        .then(() => {
          if (willFinish) {
            setShowCompletion(true);
            window.scrollTo(0, 0);
          }

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
          setCurrentIndex(previousIndex);
          updateCard(cardKey, (card) => ({
            phase: "error",
            question: card.question,
            message,
            lastDraft: draft,
          }));
        });
      return;
    }

    // Preview / mock: fake the reveal transition so the flow is fully navigable.
    window.setTimeout(() => {
      if (willFinish) {
        setShowCompletion(true);
      }

      updateCard(cardKey, (card) => {
        return {
          phase: "submitted_waiting_reveal",
          question: card.question,
          myAnswer: draft,
        };
      });
    }, 400);
  };

  const totalCards = state.cards.length;
  const currentCard = state.cards[currentIndex];

  const goTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= totalCards) return;
    setShowCompletion(false);
    setCurrentIndex(nextIndex);
  };

  const nextOpenIndex = findNextOpenQuestionIndex(state.cards, currentIndex);
  const canSkipCurrent =
    currentCard &&
    (currentCard.phase === "unanswered" || currentCard.phase === "error") &&
    nextOpenIndex >= 0;

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        eyebrow={formatBerlinDateLabel(state.dateKey)}
        title="Daily"
        theme="daily"
      />

      {!showCompletion ? (
        <DailyStepIndicator
          cards={state.cards}
          currentIndex={currentIndex}
          onJump={(idx) => goTo(idx)}
        />
      ) : null}

      {state.hasIncompleteItems ? (
        <div className="flex items-start gap-3 rounded-2xl border border-daily-primary/35 bg-white px-4 py-3 text-sm text-daily-text">
          <span aria-hidden className="shrink-0 text-lg leading-none">⚠️</span>
          <p className="leading-relaxed">
            Einige Fragen konnten nicht geladen werden und sind übersprungen.
            Ein Admin kann den Run ersetzen.
          </p>
        </div>
      ) : null}

      {showCompletion || !currentCard ? (
        <div className="space-y-4">
          <DailyCompletionCard cards={state.cards} />
          {showCompletion ? completionContent : null}
        </div>
      ) : (
        <QuestionCardShell
          key={getCardKey(currentCard)}
          state={currentCard}
          onDraftChange={(draft) =>
            handleDraftChange(getCardKey(currentCard), draft)
          }
          onSubmit={(draft) =>
            handleSubmit(getCardKey(currentCard), draft)
          }
          onSkip={canSkipCurrent ? () => goTo(nextOpenIndex) : undefined}
          onVoteMemeCaption={
            onVoteMemeCaption
              ? (authorUserId, value) =>
                  onVoteMemeCaption(currentCard, authorUserId, value)
              : undefined
          }
        />
      )}
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
    const index = (currentIndex + offset) % cards.length;
    const card = cards[index];
    if (card.phase === "unanswered" || card.phase === "error") {
      return index;
    }
  }
  return -1;
}
