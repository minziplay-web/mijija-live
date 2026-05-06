"use client";

import {
  addDoc,
  deleteDoc,
  doc,
  getCountFromServer,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { dailyCommentsCollection } from "@/lib/firebase/collections";
import { logCommentCreatedActivity } from "@/lib/firebase/activity-events";
import type { DailyCommentDoc } from "@/lib/types/firestore";

export type DailyComment = DailyCommentDoc & {
  commentId: string;
};

export function subscribeDailyComments(
  params: {
    runId: string;
    questionId: string;
  },
  onNext: (comments: DailyComment[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const commentsRef = dailyCommentsCollection();

  if (!commentsRef) {
    queueMicrotask(() => onError?.(new Error("Firestore ist nicht verfügbar.")));
    return () => undefined;
  }

  return onSnapshot(
    query(
      commentsRef,
      where("runId", "==", params.runId),
      where("questionId", "==", params.questionId),
      orderBy("createdAt", "asc"),
    ),
    (snapshot) => {
      onNext(
        snapshot.docs.map((commentDoc) => ({
          commentId: commentDoc.id,
          ...(commentDoc.data() as DailyCommentDoc),
        })),
      );
    },
    (error) => onError?.(error),
  );
}

export async function getDailyCommentCount(params: {
  runId: string;
  questionId: string;
}) {
  const commentsRef = dailyCommentsCollection();

  if (!commentsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const snapshot = await getCountFromServer(
    query(
      commentsRef,
      where("runId", "==", params.runId),
      where("questionId", "==", params.questionId),
    ),
  );

  return snapshot.data().count;
}

export async function createDailyComment(params: {
  dateKey: string;
  runId: string;
  questionId: string;
  userId: string;
  text: string;
}) {
  const commentsRef = dailyCommentsCollection();
  const text = params.text.trim();

  if (!commentsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  if (!text) {
    throw new Error("Kommentar darf nicht leer sein.");
  }

  if (text.length > 1000) {
    throw new Error("Kommentar darf maximal 1000 Zeichen lang sein.");
  }

  const commentRef = await addDoc(commentsRef, {
    dateKey: params.dateKey,
    runId: params.runId,
    questionId: params.questionId,
    userId: params.userId,
    text,
    createdAt: serverTimestamp(),
    editedAt: null,
  } satisfies DailyCommentDoc);

  try {
    await logCommentCreatedActivity({
      dateKey: params.dateKey,
      runId: params.runId,
      questionId: params.questionId,
      userId: params.userId,
      commentId: commentRef.id,
      text,
    });
  } catch {
    // Activity logging must not block the comment itself.
  }

  return commentRef.id;
}

export async function updateDailyComment(params: {
  commentId: string;
  text: string;
}) {
  const commentsRef = dailyCommentsCollection();
  const text = params.text.trim();

  if (!commentsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  if (!text) {
    throw new Error("Kommentar darf nicht leer sein.");
  }

  if (text.length > 1000) {
    throw new Error("Kommentar darf maximal 1000 Zeichen lang sein.");
  }

  await updateDoc(doc(commentsRef, params.commentId), {
    text,
    editedAt: serverTimestamp(),
  });
}

export async function deleteDailyComment(commentId: string) {
  const commentsRef = dailyCommentsCollection();

  if (!commentsRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await deleteDoc(doc(commentsRef, commentId));
}
