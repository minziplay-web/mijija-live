import type {
  AdminViewState,
  DailyAnswerDraft,
  DailyQuestionCardState,
  DailyViewState,
  LobbyViewState,
} from "@/lib/types/frontend";

/**
 * Merge incoming server state into local state without clobbering transient
 * UI state such as drafts-in-progress, tab selections, or pre-connection flows.
 *
 * These helpers are called from the `setState(prev, incoming)` effect that
 * syncs Firestore snapshots into the screen's local state.
 */

export function mergeDailyState(
  prev: DailyViewState,
  incoming: DailyViewState,
): DailyViewState {
  if (incoming.status !== "ready" || prev.status !== "ready") {
    return incoming;
  }

  const mergedCards = incoming.cards.map((incomingCard): DailyQuestionCardState => {
    const prevCard = prev.cards.find(
      (c) => getDailyCardKey(c) === getDailyCardKey(incomingCard),
    );

    if (!prevCard) return incomingCard;

    if (
      (prevCard.phase === "submitting" || prevCard.phase === "error") &&
      incomingCard.phase === "unanswered"
    ) {
      return { ...prevCard, question: incomingCard.question };
    }

    // Hold submitting locally even if the server already saw the answer —
    // the local flash-timer (400ms loader + 800ms GESPEICHERT) needs the
    // submitting phase to stay alive so the snapshot doesn't yank the
    // card out before the user sees the feedback.
    if (
      prevCard.phase === "submitting" &&
      incomingCard.phase === "submitted_waiting_reveal"
    ) {
      return { ...prevCard, question: incomingCard.question };
    }

    if (
      incomingCard.phase === "unanswered" &&
      prevCard.phase === "unanswered" &&
      prevCard.draft
    ) {
      return { ...incomingCard, draft: prevCard.draft };
    }

    if (
      incomingCard.phase === "unanswered" &&
      prevCard.phase === "error" &&
      prevCard.lastDraft
    ) {
      return { ...incomingCard, draft: prevCard.lastDraft };
    }

    return incomingCard;
  });

  return { ...incoming, cards: mergedCards };
}

function getDailyCardKey(card: DailyQuestionCardState) {
  return `${card.question.runId ?? "daily"}:${card.question.questionId}`;
}

export function mergeAdminState(
  prev: AdminViewState,
  incoming: AdminViewState,
): AdminViewState {
  if (incoming.status !== "ready" || prev.status !== "ready") {
    return incoming;
  }

  return {
    ...incoming,
    activeTab: prev.activeTab,
    questions: {
      ...incoming.questions,
      filter: prev.questions.filter,
      importStatus: prev.questions.importStatus,
      importError: prev.questions.importError,
    },
    config: prev.config.dirty
      ? prev.config
      : {
          ...incoming.config,
          saveStatus: prev.config.saveStatus,
          saveError: prev.config.saveError,
        },
  };
}

export function mergeLobbyState(
  prev: LobbyViewState,
  incoming: LobbyViewState,
): LobbyViewState {
  if (
    (prev.status === "creating" || prev.status === "joining_by_code") &&
    incoming.status === "landing"
  ) {
    return prev;
  }

  if (
    prev.status === "connected" &&
    incoming.status === "connected" &&
    prev.sessionId === incoming.sessionId &&
    prev.live?.phase === "question" &&
    incoming.live?.phase === "question" &&
    prev.live.view.questionIndex === incoming.live.view.questionIndex
  ) {
    const hasLocalDraft = Boolean(prev.live.draft);
    const localSubmitting = prev.live.submitStatus === "submitting";
    const serverSubmitted = incoming.live.submitStatus === "submitted";

    if (serverSubmitted) {
      return incoming;
    }

    if (hasLocalDraft || localSubmitting) {
      return {
        ...incoming,
        live: {
          ...incoming.live,
          draft: (prev.live.draft ?? incoming.live.draft) as
            | DailyAnswerDraft
            | undefined,
          submitStatus: localSubmitting ? "submitting" : incoming.live.submitStatus,
          submitError: prev.live.submitError ?? incoming.live.submitError,
        },
      };
    }
  }

  return incoming;
}
