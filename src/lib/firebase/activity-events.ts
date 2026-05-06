"use client";

import { serverTimestamp, setDoc } from "firebase/firestore";

import { activityEventDoc } from "@/lib/firebase/collections";
import type { ActivityEventDoc } from "@/lib/types/firestore";

export async function logAnswerSubmittedActivity(params: {
  dateKey: string;
  runId: string;
  questionId: string;
  userId: string;
}) {
  const { dateKey, runId, questionId, userId } = params;
  const eventRef = activityEventDoc(`${dateKey}_answer_submitted_${userId}_${questionId}`);

  if (!eventRef) {
    return;
  }

  await setDoc(eventRef, {
    dateKey,
    runId,
    questionId,
    userId,
    type: "answer_submitted",
    createdAt: serverTimestamp(),
  } satisfies ActivityEventDoc);
}

export async function logCommentCreatedActivity(params: {
  dateKey: string;
  runId: string;
  questionId: string;
  userId: string;
  commentId: string;
  text: string;
}) {
  const { dateKey, runId, questionId, userId, commentId, text } = params;
  const eventRef = activityEventDoc(`${dateKey}_comment_created_${userId}_${commentId}`);

  if (!eventRef) {
    return;
  }

  const commentPreview = text.trim().slice(0, 80);

  await setDoc(eventRef, {
    dateKey,
    runId,
    questionId,
    userId,
    type: "comment_created",
    payload: { commentPreview },
    createdAt: serverTimestamp(),
  } satisfies ActivityEventDoc);
}
