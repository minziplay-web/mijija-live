"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { STORY_COLORS } from "@/components/story/constants";
import { ChatLineIcon, HeartIcon } from "@/components/story/comment-icons";
import { AvatarCircle } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { usersCollection } from "@/lib/firebase/collections";
import {
  createDailyComment,
  deleteDailyComment,
  subscribeDailyComments,
  updateDailyComment,
  type DailyComment,
} from "@/lib/firebase/daily-comments";
import {
  subscribeDailyQuestionLikes,
  toggleDailyQuestionLike,
} from "@/lib/firebase/daily-question-likes";
import { formatListenerError } from "@/lib/firebase/listener-errors";
import type { UserDoc } from "@/lib/types/firestore";

const MAX_COMMENT_LENGTH = 1000;
const DARK = {
  elevated: "#161616",
  text: "#FAFAFA",
  muted: "#A8A8A8",
  dim: "#6E6E73",
  hair: "#1F1F1F",
  hairStrong: "#2C2C2E",
};

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [likeState, setLikeState] = useState({ count: 0, likedByMe: false });
  const [likeBusy, setLikeBusy] = useState(false);
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
    const unsubscribeLikes = subscribeDailyQuestionLikes(
      { runId: resolvedRunId, questionId, userId: currentUser?.userId },
      setLikeState,
      (listenerError) => setError(formatListenerError("Likes", listenerError)),
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
      unsubscribeLikes();
      unsubscribeUsers();
    };
  }, [currentUser?.userId, questionId, resolvedRunId]);

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (left, right) =>
          readTimestampMs(left.createdAt) - readTimestampMs(right.createdAt),
      ),
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

  const toggleLike = async () => {
    if (!currentUser || likeBusy) {
      return;
    }

    setLikeBusy(true);
    setError(null);
    try {
      await toggleDailyQuestionLike({
        dateKey,
        runId: resolvedRunId,
        questionId,
        userId: currentUser.userId,
        liked: likeState.likedByMe,
      });
    } catch (likeError) {
      setError(errorMessage(likeError, "Like konnte nicht gespeichert werden."));
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <section className="space-y-3" aria-label="Kommentare und Likes">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition disabled:opacity-40"
          style={{ color: likeState.likedByMe ? STORY_COLORS.archiv : DARK.muted }}
          disabled={!currentUser || likeBusy}
          aria-pressed={likeState.likedByMe}
          aria-label={likeState.likedByMe ? "Like entfernen" : "Frage liken"}
          onClick={() => void toggleLike()}
        >
          <HeartIcon size={20} filled={likeState.likedByMe} />
          <span
            className="text-[11px] tabular-nums"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {likeState.count}
          </span>
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition"
          style={{ color: sheetOpen ? STORY_COLORS.daily : DARK.muted }}
          aria-expanded={sheetOpen}
          aria-label="Kommentare anzeigen"
          onClick={() => setSheetOpen(true)}
        >
          <ChatLineIcon size={20} />
          <span
            className="text-[11px] tabular-nums"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {comments.length}
          </span>
        </button>
      </div>

      <CommentBottomSheet
        open={sheetOpen}
        comments={sortedComments}
        users={users}
        currentUser={currentUser}
        text={text}
        editing={editing}
        submitting={submitting}
        error={error}
        onClose={() => setSheetOpen(false)}
        onTextChange={setText}
        onSubmit={() => void submit()}
        onEditChange={setEditing}
        onSaveEdit={() => void saveEdit()}
        onRemove={(commentId) => void remove(commentId)}
      />
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
      (nextComments) => setCount(nextComments.length),
      () => setCount(0),
    );

    return () => {
      unsubscribe();
    };
  }, [questionId, runId]);

  return <>{count}</>;
}

function CommentTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  rows,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      maxLength={MAX_COMMENT_LENGTH}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className="min-h-11 w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition placeholder:text-[#6E6E73] disabled:opacity-60"
      style={{
        borderColor: DARK.hairStrong,
        backgroundColor: DARK.hair,
        color: DARK.text,
      }}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function CommentBottomSheet({
  open,
  comments,
  users,
  currentUser,
  text,
  editing,
  submitting,
  error,
  onClose,
  onTextChange,
  onSubmit,
  onEditChange,
  onSaveEdit,
  onRemove,
}: {
  open: boolean;
  comments: DailyComment[];
  users: Map<string, UserDoc>;
  currentUser: { userId: string; displayName: string; photoURL: string | null } | null;
  text: string;
  editing: { commentId: string; text: string } | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  onEditChange: (value: { commentId: string; text: string } | null) => void;
  onSaveEdit: () => void;
  onRemove: (commentId: string) => void;
}) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;
    const updateOffset = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(offset);
    };

    updateOffset();
    viewport.addEventListener("resize", updateOffset);
    viewport.addEventListener("scroll", updateOffset);

    return () => {
      viewport.removeEventListener("resize", updateOffset);
      viewport.removeEventListener("scroll", updateOffset);
    };
  }, [open]);

  if (typeof document === "undefined") {
    return null;
  }

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) {
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Kommentare">
          <motion.button
            type="button"
            aria-label="Kommentare schließen"
            className="absolute inset-0 cursor-default"
            style={{ backgroundColor: "rgba(0,0,0,0.58)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto flex h-[90dvh] max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border"
            style={{
              "--sheet-keyboard-offset": `${keyboardOffset}px`,
              backgroundColor: DARK.elevated,
              borderColor: DARK.hairStrong,
              color: DARK.text,
            } as CSSProperties}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36, mass: 0.8 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.22 }}
            onDragEnd={handleDragEnd}
          >
            <header
              className="sticky top-0 z-10 flex shrink-0 cursor-grab touch-none items-center justify-between border-b px-4 pb-2 pt-1 active:cursor-grabbing"
              style={{ borderColor: DARK.hair, backgroundColor: DARK.elevated }}
              onPointerDown={(event) => dragControls.start(event)}
            >
              <button
                type="button"
                className="flex flex-1 justify-center py-1.5"
                aria-label="Kommentare nach unten ziehen zum Schließen"
              >
                <span className="h-0.5 w-8 rounded-full" style={{ backgroundColor: DARK.hairStrong }} />
              </button>
              <button
                type="button"
                className="absolute right-4 top-3 inline-flex size-8 items-center justify-center rounded-full text-xl leading-none"
                style={{ color: DARK.muted, backgroundColor: DARK.hair }}
                aria-label="Kommentare schließen"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={onClose}
              >
                ×
              </button>
            </header>

            <div
              className="flex cursor-grab touch-none items-center justify-center border-b px-4 py-3 active:cursor-grabbing"
              style={{ borderColor: DARK.hair }}
              onPointerDown={(event) => dragControls.start(event)}
            >
              <span className="text-sm font-semibold" style={{ color: DARK.text }}>
                Kommentare
              </span>
              <span
                className="ml-2 text-[11px] tabular-nums"
                style={{ color: DARK.dim, fontFamily: "var(--font-mono)" }}
              >
                {comments.length}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {error ? (
                <p
                  className="mb-3 rounded-lg px-3 py-2 text-xs text-red-200"
                  style={{ backgroundColor: "#3A1414" }}
                >
                  {error}
                </p>
              ) : null}

              {comments.length === 0 ? (
                <div className="flex min-h-[40vh] items-center justify-center text-center">
                  <p className="text-sm" style={{ color: DARK.muted }}>
                    Noch keine Kommentare.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {comments.map((comment) => {
                    const user = users.get(comment.userId);
                    const isOwn = currentUser?.userId === comment.userId;
                    const isEditing = editing?.commentId === comment.commentId;
                    const displayName =
                      user?.displayName ?? (isOwn ? currentUser.displayName : "Jemand");

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
                              <span className="text-sm font-semibold" style={{ color: DARK.text }}>
                                {displayName}
                              </span>
                              <span
                                className="shrink-0 text-[10px] uppercase"
                                style={{ color: DARK.dim, fontFamily: "var(--font-mono)" }}
                              >
                                {formatCommentTime(comment.createdAt)}
                              </span>
                            </div>

                            {isEditing ? (
                              <div className="mt-2 space-y-2">
                                <CommentTextarea
                                  value={editing.text}
                                  rows={2}
                                  disabled={submitting}
                                  onChange={(value) =>
                                    onEditChange({ commentId: editing.commentId, text: value })
                                  }
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                                    style={{ color: DARK.muted }}
                                    onClick={() => onEditChange(null)}
                                  >
                                    Abbrechen
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                    style={{ backgroundColor: STORY_COLORS.profil }}
                                    disabled={submitting || !editing.text.trim()}
                                    onClick={onSaveEdit}
                                  >
                                    Speichern
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p
                                  className="mt-1 whitespace-pre-wrap text-sm leading-5"
                                  style={{ color: DARK.muted }}
                                >
                                  {comment.text}
                                </p>
                                {isOwn ? (
                                  <div className="hidden" aria-hidden>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onEditChange({
                                          commentId: comment.commentId,
                                          text: comment.text,
                                        })
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onRemove(comment.commentId)}
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
            </div>

            <footer
              className="shrink-0 border-t px-4 py-3"
              style={{
                borderColor: DARK.hair,
                backgroundColor: DARK.elevated,
                paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom) + var(--sheet-keyboard-offset))`,
              }}
            >
              <div className="flex min-h-[52px] items-center gap-3">
                {currentUser ? (
                  <AvatarCircle
                    member={{
                      userId: currentUser.userId,
                      displayName: currentUser.displayName,
                      photoURL: currentUser.photoURL,
                    }}
                    size="sm"
                  />
                ) : (
                  <div className="size-8 shrink-0 rounded-full" style={{ backgroundColor: DARK.hair }} />
                )}
                <div className="min-w-0 flex-1">
                  <CommentTextarea
                    value={text}
                    rows={1}
                    placeholder={currentUser ? "Kommentieren..." : "Einloggen zum Kommentieren"}
                    disabled={!currentUser || submitting}
                    onChange={onTextChange}
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-white transition disabled:opacity-35"
                  style={{ backgroundColor: STORY_COLORS.daily }}
                  disabled={!currentUser || submitting || !text.trim()}
                  aria-label="Kommentar senden"
                  onClick={onSubmit}
                >
                  <SendIcon />
                </button>
              </div>
            </footer>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        d="M4 12 20 4l-4.5 16-3.2-6.4L4 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path
        d="m12.3 13.6 3.2-3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
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
