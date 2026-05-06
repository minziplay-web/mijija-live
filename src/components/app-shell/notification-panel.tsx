"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { AvatarCircle } from "@/components/ui/avatar";
import { STORY_COLORS } from "@/components/story/constants";
import { useAuth } from "@/lib/auth/auth-context";
import {
  dailyPrivateAnswersCollection,
  dailyRunDoc,
  usersCollection,
} from "@/lib/firebase/collections";
import { subscribeDailyActivityEvents } from "@/lib/firebase/daily-activity";
import { formatListenerError } from "@/lib/firebase/listener-errors";
import { berlinDateKey } from "@/lib/mapping/date";
import { mapActivityEventsToFeedItems } from "@/lib/mapping/activity";
import type { ActivityEvent } from "@/lib/firebase/daily-activity";
import type { DailyPrivateAnswerDoc, DailyRunDoc, UserDoc } from "@/lib/types/firestore";

const DARK = {
  elevated: "#161616",
  text: "#FAFAFA",
  muted: "#A8A8A8",
  dim: "#6E6E73",
  hair: "#1F1F1F",
  hairStrong: "#2C2C2E",
};

type NotificationPanelState =
  | {
      status: "loading";
      hasUnseen: false;
      unansweredCount: number;
      latestCreatedAtMs: number;
    }
  | {
      status: "ready";
      dateKey: string;
      userId: string;
      hasUnseen: boolean;
      unansweredCount: number;
      latestCreatedAtMs: number;
      items: ReturnType<typeof mapActivityEventsToFeedItems>;
      users: Map<string, UserDoc>;
    }
  | { status: "error"; message: string; hasUnseen: false; unansweredCount: 0; latestCreatedAtMs: 0 };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const state = useNotificationPanelState(open);
  const canPortal = typeof document !== "undefined";

  return (
    <>
      <button
        type="button"
        className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur ring-1"
        style={{
          backgroundColor: "rgba(22,22,22,0.88)",
          color: DARK.text,
          borderColor: DARK.hairStrong,
        }}
        aria-label="Tageslog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <BellIcon />
        {state.hasUnseen ? (
          <span
            className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full"
            style={{
              backgroundColor: STORY_COLORS.archiv,
              boxShadow: "0 0 0 2px #161616",
            }}
          />
        ) : null}
      </button>

      {open && canPortal
        ? createPortal(
            <NotificationPanel
              state={state}
              onClose={() => setOpen(false)}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function NotificationPanel({
  state,
  onClose,
}: {
  state: NotificationPanelState;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }

    setLastSeenActivity(state.userId, state.latestCreatedAtMs || Date.now());
  }, [state]);

  const goToDaily = () => {
    onClose();
    router.push("/daily");
  };

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Tageslog">
      <button
        type="button"
        className="absolute inset-0 h-full w-full backdrop-blur-[2px]"
        style={{ backgroundColor: "rgba(0,0,0,0.58)" }}
        aria-label="Tageslog schließen"
        onClick={onClose}
      />

      <section
        className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-hidden rounded-t-2xl border-t shadow-[0_-18px_54px_-30px_rgba(0,0,0,0.8)] sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-12 sm:w-[360px] sm:max-w-[calc(100vw-24px)] sm:rounded-2xl sm:border sm:shadow-[0_20px_70px_-38px_rgba(0,0,0,0.9)]"
        style={{ backgroundColor: DARK.elevated, borderColor: DARK.hairStrong }}
      >
        <header className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: DARK.hair }}>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: DARK.dim, fontFamily: "var(--font-mono)" }}
            >
              Heute
            </p>
            <h2 className="text-base font-semibold" style={{ color: DARK.text }}>Tageslog</h2>
          </div>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full transition"
            style={{ color: DARK.muted }}
            aria-label="Tageslog schließen"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        {state.status === "ready" && state.unansweredCount > 0 ? (
          <button
            type="button"
            className="mx-4 mt-4 flex w-[calc(100%-2rem)] items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-white"
            style={{ backgroundColor: STORY_COLORS.daily }}
            onClick={goToDaily}
          >
            <span>{state.unansweredCount} Fragen offen</span>
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Antworten
            </span>
          </button>
        ) : null}

        <div className="max-h-[62dvh] overflow-y-auto px-4 py-3 sm:max-h-[420px]">
          {state.status === "loading" ? (
            <PanelMessage title="Lade Tageslog..." />
          ) : null}

          {state.status === "error" ? (
            <PanelMessage title="Tageslog nicht verfügbar" detail={state.message} />
          ) : null}

          {state.status === "ready" && state.items.length === 0 ? (
            <PanelMessage
              title="Noch nichts passiert"
              detail="Sobald jemand antwortet oder kommentiert, erscheint es hier."
            />
          ) : null}

          {state.status === "ready" && state.items.length > 0 ? (
            <ol className="space-y-1">
              {state.items.map((item) => {
                const actor = state.users.get(item.actorUserId);
                return (
                  <li key={item.id} className="flex gap-3 rounded-xl py-2.5">
                    <AvatarCircle
                      member={{
                        userId: item.actorUserId,
                        displayName: item.actorDisplayName,
                        photoURL: actor?.photoURL ?? null,
                      }}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-5" style={{ color: DARK.text }}>
                        <span className="font-semibold">{item.actorDisplayName}</span>{" "}
                        <span>{activityActionText(item)}</span>
                      </p>
                      {item.payload?.commentPreview ? (
                        <p className="mt-1 truncate text-xs" style={{ color: DARK.muted }}>
                          &quot;{item.payload.commentPreview}&quot;
                        </p>
                      ) : null}
                    </div>
                    <time
                      className="shrink-0 pt-0.5 text-[10px] uppercase tracking-[0.12em]"
                      style={{ color: DARK.dim, fontFamily: "var(--font-mono)" }}
                    >
                      {item.timeLabel}
                    </time>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function useNotificationPanelState(panelOpen: boolean): NotificationPanelState {
  const { authState, isMockMode } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [users, setUsers] = useState<Map<string, UserDoc>>(new Map());
  const [run, setRun] = useState<DailyRunDoc | null>(null);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [readyParts, setReadyParts] = useState(() => new Set<string>());
  const dateKey = berlinDateKey();
  const userId = authState.status === "authenticated" ? authState.user.userId : null;

  useEffect(() => {
    if (isMockMode || !userId) {
      return;
    }

    queueMicrotask(() => {
      setError(null);
      setReadyParts(new Set());
      setEvents([]);
      setUsers(new Map());
      setRun(null);
      setAnsweredQuestionIds(new Set());
    });

    const runRef = dailyRunDoc(dateKey);
    const privateAnswersRef = dailyPrivateAnswersCollection();
    const usersRef = usersCollection();

    if (!runRef || !privateAnswersRef || !usersRef) {
      queueMicrotask(() => setError("Firestore ist noch nicht verbunden."));
      return;
    }

    const markReady = (part: string) => {
      setReadyParts((prev) => new Set(prev).add(part));
    };

    const unsubscribers = [
      subscribeDailyActivityEvents(
        { dateKey, limit: 50 },
        (nextEvents) => {
          setEvents(nextEvents);
          markReady("events");
        },
        (listenerError) => setError(formatListenerError("Tageslog", listenerError)),
      ),
      onSnapshot(
        runRef,
        (snapshot) => {
          setRun(snapshot.exists() ? (snapshot.data() as DailyRunDoc) : null);
          markReady("run");
        },
        (listenerError) => setError(formatListenerError("Daily", listenerError)),
      ),
      onSnapshot(
        query(
          privateAnswersRef,
          where("dateKey", "==", dateKey),
          where("userId", "==", userId),
        ),
        (snapshot) => {
          setAnsweredQuestionIds(
            new Set(
              snapshot.docs.map((answerDoc) => {
                const answer = answerDoc.data() as DailyPrivateAnswerDoc;
                return answer.questionId;
              }),
            ),
          );
          markReady("answers");
        },
        (listenerError) => setError(formatListenerError("Antworten", listenerError)),
      ),
      onSnapshot(
        query(usersRef, where("isActive", "==", true)),
        (snapshot) => {
          setUsers(
            new Map(
              snapshot.docs.map((userDoc) => [
                userDoc.id,
                userDoc.data() as UserDoc,
              ]),
            ),
          );
          markReady("users");
        },
        (listenerError) => setError(formatListenerError("Mitglieder", listenerError)),
      ),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [dateKey, isMockMode, userId]);

  const items = useMemo(
    () => mapActivityEventsToFeedItems({ events, users }),
    [events, users],
  );
  const latestCreatedAtMs = items[0]?.createdAtMs ?? 0;
  const lastSeenAtMs = userId
    ? panelOpen
      ? latestCreatedAtMs
      : readLastSeenActivity(userId)
    : 0;
  const hasUnseen = latestCreatedAtMs > lastSeenAtMs;
  const questionIds = run?.questionIds ?? [];
  const unansweredCount = Math.max(
    0,
    questionIds.filter((questionId) => !answeredQuestionIds.has(questionId)).length,
  );

  if (isMockMode) {
    return {
      status: "ready",
      dateKey,
      userId: "mock",
      hasUnseen: false,
      unansweredCount: 0,
      latestCreatedAtMs: 0,
      items: [],
      users: new Map(),
    };
  }

  if (!userId) {
    return {
      status: "loading",
      hasUnseen: false,
      unansweredCount: 0,
      latestCreatedAtMs: 0,
    };
  }

  if (error) {
    return {
      status: "error",
      message: error,
      hasUnseen: false,
      unansweredCount: 0,
      latestCreatedAtMs: 0,
    };
  }

  if (readyParts.size < 4) {
    return {
      status: "loading",
      hasUnseen: false,
      unansweredCount,
      latestCreatedAtMs,
    };
  }

  return {
    status: "ready",
    dateKey,
    userId,
    hasUnseen,
    unansweredCount,
    latestCreatedAtMs,
    items,
    users,
  };
}

function activityActionText(item: ReturnType<typeof mapActivityEventsToFeedItems>[number]) {
  switch (item.kind) {
    case "answer_submitted":
      return "hat geantwortet";
    case "comment_created":
      return "hat kommentiert";
    case "meme_winner":
      return item.payload?.memeWinnerDisplayName
        ? `ist Meme-Winner: ${item.payload.memeWinnerDisplayName}`
        : "ist Meme-Winner";
  }
}

function PanelMessage({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-semibold" style={{ color: DARK.text }}>{title}</p>
      {detail ? (
        <p className="mx-auto mt-2 max-w-64 text-xs leading-5" style={{ color: DARK.muted }}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function readLastSeenActivity(userId: string) {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(lastSeenKey(userId));
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function setLastSeenActivity(userId: string, value: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(lastSeenKey(userId), String(value));
}

function lastSeenKey(userId: string) {
  return `mijija.lastSeenActivity.${userId}`;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        d="M5.5 17.5h13M7.2 17.5V11a4.8 4.8 0 0 1 9.6 0v6.5M10.4 20.5a1.8 1.8 0 0 0 3.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        d="m7 7 10 10M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}
