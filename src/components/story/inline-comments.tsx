"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import { AvatarCircle } from "@/components/ui/avatar";
import { STORY_COLORS } from "@/components/story/constants";
import { useAuth } from "@/lib/auth/auth-context";
import { usersCollection } from "@/lib/firebase/collections";
import {
  createDailyComment,
  deleteDailyComment,
  subscribeDailyComments,
  updateDailyComment,
  type DailyComment,
} from "@/lib/firebase/daily-comments";
import { formatListenerError } from "@/lib/firebase/listener-errors";
import type { UserDoc } from "@/lib/types/firestore";

const MAX_COMMENT_LENGTH = 1000;

export function InlineCommentsSection({
  dateKey,
  runId,
  questionId,
}: {
  dateKey: string;
  runId?: string;
  questionId: string;
}) {
  const { authState } = useAuth();
  const [comments, setComments] = useState<DailyComment[]>([]);
  const [users, setUsers] = useState<Map<string, UserDoc>>(new Map());
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<{ commentId: string; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedRunId = runId ?? dateKey;
  const currentUser = authState.status === "authenticated" ? authState.user : null;

  useEffect(() => {
    const usersRef = usersCollection();

    if (!usersRef) {
      queueMicrotask(() => setError("Firestore ist noch nicht verbunden."));
      return;
    }

    const unsubscribeComments = subscribeDailyComments(
      { runId: resolvedRunId, questionId },
      (nextComments) => {
        setComments(nextComments);
        setError(null);
      },
      (listenerError) => setError(formatListenerError("Kommentare", listenerError)),
    );
    const unsubscribeUsers = onSnapshot(
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
      },
      (listenerError) => setError(formatListenerError("Mitglieder", listenerError)),
    );

    return () => {
      unsubscribeComments();
      unsubscribeUsers();
    };
  }, [questionId, resolvedRunId]);

  const sortedComments = useMemo(
    () => [...comments].sort((left, right) => readTimestampMs(left.createdAt) - readTimestampMs(right.createdAt)),
    [comments],
  );

  const submit = async () => {
    if (!currentUser || submitting) {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createDailyComment({
        dateKey,
        runId: resolvedRunId,
        questionId,
        userId: currentUser.userId,
        text: trimmed,
      });
      setText("");
    } catch (submitError) {
      setError(errorMessage(submitError, "Kommentar konnte nicht gesendet werden."));
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updateDailyComment({
        commentId: editing.commentId,
        text: editing.text,
      });
      setEditing(null);
    } catch (submitError) {
      setError(errorMessage(submitError, "Kommentar konnte nicht gespeichert werden."));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (commentId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await deleteDailyComment(commentId);
    } catch (deleteError) {
      setError(errorMessage(deleteError, "Kommentar konnte nicht gelöscht werden."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-3" aria-label="Kommentare">
      <div className="flex items-center justify-between">
        <h3
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: STORY_COLORS.ink50, fontFamily: "var(--font-mono)" }}
        >
          Kommentare
        </h3>
        <span
          className="text-[11px] tabular-nums"
          style={{ color: STORY_COLORS.ink50, fontFamily: "var(--font-mono)" }}
        >
          {comments.length}
        </span>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}

      {sortedComments.length === 0 ? (
        <p className="text-sm text-sand-500">Noch keine Kommentare.</p>
      ) : (
        <ul className="divide-y divide-sand-100">
          {sortedComments.map((comment) => {
            const user = users.get(comment.userId);
            const isOwn = currentUser?.userId === comment.userId;
            const isEditing = editing?.commentId === comment.commentId;
            const displayName = user?.displayName ?? (isOwn ? currentUser.displayName : "Jemand");

            return (
              <li key={comment.commentId} className="py-3">
                <div className="flex gap-3">
                  <AvatarCircle
                    member={{
                      userId: comment.userId,
                      displayName,
                      photoURL: user?.photoURL ?? null,
                    }}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-sand-900">{displayName}</span>
                      <span
                        className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-sand-400"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {formatCommentTime(comment.createdAt)}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editing.text}
                          maxLength={MAX_COMMENT_LENGTH}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm text-sand-900 outline-none focus:border-sand-400"
                          onChange={(event) =>
                            setEditing({ commentId: editing.commentId, text: event.target.value })
                          }
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-sand-500"
                            onClick={() => setEditing(null)}
                          >
                            Abbrechen
                          </button>
                          <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: STORY_COLORS.profil }}
                            disabled={submitting || !editing.text.trim()}
                            onClick={saveEdit}
                          >
                            Speichern
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-sand-700">
                          {comment.text}
                        </p>
                        {isOwn ? (
                          <div className="mt-2 flex gap-3">
                            <button
                              type="button"
                              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sand-400"
                              style={{ fontFamily: "var(--font-mono)" }}
                              onClick={() => setEditing({ commentId: comment.commentId, text: comment.text })}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sand-400"
                              style={{ fontFamily: "var(--font-mono)" }}
                              onClick={() => void remove(comment.commentId)}
                            >
                              Löschen
                            </button>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2">
        <textarea
          value={text}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
          placeholder={currentUser ? "Kommentar schreiben..." : "Einloggen zum Kommentieren"}
          disabled={!currentUser || submitting}
          className="w-full resize-none rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm text-sand-900 outline-none placeholder:text-sand-400 focus:border-sand-400 disabled:opacity-60"
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] tabular-nums text-sand-400"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {text.length}/{MAX_COMMENT_LENGTH}
          </span>
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-40"
            style={{ backgroundColor: STORY_COLORS.ink, fontFamily: "var(--font-mono)" }}
            disabled={!currentUser || submitting || !text.trim()}
            onClick={() => void submit()}
          >
            Senden
          </button>
        </div>
      </div>
    </section>
  );
}

export function CommentCountBadge({
  runId,
  questionId,
}: {
  runId: string;
  questionId: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeDailyComments(
      { runId, questionId },
      (comments) => setCount(comments.length),
      () => setCount(0),
    );

    return () => {
      unsubscribe();
    };
  }, [questionId, runId]);

  return <>{count}</>;
}

function readTimestampMs(value: unknown) {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }

  return 0;
}

function formatCommentTime(value: unknown) {
  const ms = readTimestampMs(value);
  if (!ms) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(new Date(ms));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}
