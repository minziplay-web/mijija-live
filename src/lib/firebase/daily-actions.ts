"use client";

import {
  deleteDoc,
  doc,
  runTransaction,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  dailyRunDoc,
  dailyAnswerDoc,
  dailyFirstAnswerDoc,
  dailyMemeVoteDoc,
  dailyPrivateAnswerDoc,
  questionsCollection,
} from "@/lib/firebase/collections";
import { logAnswerSubmittedActivity } from "@/lib/firebase/activity-events";
import { shouldHideUserTrophyQuestionForUser } from "@/lib/daily/custom-daily-questions";
import { assertValidDraftForQuestion } from "@/lib/mapping/answer-guards";
import { resolveDailyRunStatus } from "@/lib/mapping/daily-run";
import { berlinDateKey } from "@/lib/mapping/date";
import type {
  AppUser,
  DailyAnswerDraft,
  DailyQuestion,
} from "@/lib/types/frontend";
import type {
  DailyAnswerDoc,
  DailyFirstAnswerDoc,
  DailyMemeVoteDoc,
  DailyPrivateAnswerDoc,
  DailyRunDoc,
  QuestionDoc,
} from "@/lib/types/firestore";

export async function submitDailyAnswer(params: {
  dateKey: string;
  user: AppUser;
  question: DailyQuestion;
  draft: DailyAnswerDraft;
}) {
  const { dateKey, user, question, draft } = params;
  const runId = question.runId ?? dateKey;
  const answerId = `${runId}_${question.questionId}_${user.userId}`;
  const privateRef = dailyPrivateAnswerDoc(answerId);
  const publicRef = dailyAnswerDoc(answerId);
  const firstAnswerRef = dailyFirstAnswerDoc(`${runId}_${question.questionId}`);
  const runRef = dailyRunDoc(runId);
  const questionsRef = questionsCollection();
  const questionRef = questionsRef ? doc(questionsRef, question.questionId) : null;

  if (
    !privateRef ||
    !publicRef ||
    !firstAnswerRef ||
    !runRef ||
    !questionRef
  ) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  assertValidDraftForQuestion(question, draft);

  let shouldTryFirstAnswerLock = false;

  await runTransaction(privateRef.firestore, async (transaction) => {
    const [runSnap, previousPrivateSnap, firstAnswerSnap, questionSnap] = await Promise.all([
      transaction.get(runRef),
      transaction.get(privateRef),
      transaction.get(firstAnswerRef),
      transaction.get(questionRef),
    ]);

    if (!runSnap.exists()) {
      throw new Error("Der heutige Daily-Run existiert nicht mehr.");
    }

    const run = runSnap.data() as DailyRunDoc;
    const runStatus = resolveDailyRunStatus(run);
    const canCatchUpClosedRun = dateKey < berlinDateKey() && runStatus === "closed";
    if (runStatus !== "active" && !canCatchUpClosedRun) {
      throw new Error("Diese Daily ist nicht mehr aktiv.");
    }
    if (!(run.questionIds ?? []).includes(question.questionId)) {
      throw new Error("Diese Frage gehört nicht mehr zum aktuellen Daily-Run.");
    }

    const persistedQuestion = questionSnap.exists()
      ? (questionSnap.data() as QuestionDoc)
      : null;
    if (
      persistedQuestion
      && shouldHideUserTrophyQuestionForUser(persistedQuestion, user.userId)
    ) {
      throw new Error("Deine eigene Trophy-Frage beantworten die anderen.");
    }

    const previousPrivate = previousPrivateSnap.exists()
      ? (previousPrivateSnap.data() as DailyPrivateAnswerDoc)
      : null;
    const firstAnswer = firstAnswerSnap.exists()
      ? (firstAnswerSnap.data() as DailyFirstAnswerDoc)
      : null;
    const firstSubmit = previousPrivate === null;
    const isFirstAnswerForQuestion = !firstAnswer && firstSubmit;
    shouldTryFirstAnswerLock = isFirstAnswerForQuestion;

    const nextPrivate: DailyPrivateAnswerDoc = {
      runId,
      dateKey,
      questionId: question.questionId,
      userId: user.userId,
      questionType: question.type,
      ...mapDraftPayload(draft, question),
      createdAt: previousPrivate?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(privateRef, nextPrivate, { merge: true });

    const nextPublic: DailyAnswerDoc = {
      runId,
      dateKey,
      questionId: question.questionId,
      userId: user.userId,
      questionType: question.type,
      ...mapDraftPayload(draft, question),
      createdAt: previousPrivate?.createdAt ?? serverTimestamp(),
    };

    transaction.set(publicRef, nextPublic, { merge: true });
  });

  try {
    await logAnswerSubmittedActivity({
      dateKey,
      runId,
      questionId: question.questionId,
      userId: user.userId,
    });
  } catch {
    // Activity logging must not block or undo the saved answer.
  }

  if (!shouldTryFirstAnswerLock) {
    return;
  }

  try {
    await runTransaction(privateRef.firestore, async (transaction) => {
      const firstAnswerSnap = await transaction.get(firstAnswerRef);

      if (firstAnswerSnap.exists()) {
        return;
      }

      transaction.set(firstAnswerRef, {
        runId,
        dateKey,
        questionId: question.questionId,
        userId: user.userId,
        createdAt: serverTimestamp(),
      } satisfies DailyFirstAnswerDoc);
      transaction.set(
        questionRef,
        {
          dailyLocked: true,
          dailyLockedDateKey: dateKey,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });
  } catch {
    // The answer itself is already saved. Locking is a best-effort follow-up.
  }
}

export async function submitMemeCaptionVote(params: {
  dateKey: string;
  runId?: string;
  questionId: string;
  authorUserId: string;
  voterUserId: string;
  on: boolean;
}) {
  const { dateKey, questionId, authorUserId, voterUserId, on } = params;
  const runId = params.runId ?? dateKey;
  const voteId = `${runId}_${questionId}_${authorUserId}_${voterUserId}`;
  const voteRef = dailyMemeVoteDoc(voteId);

  if (!voteRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  if (!on) {
    await deleteDoc(voteRef);
    return;
  }

  await setDoc(voteRef, {
    runId,
    dateKey,
    questionId,
    authorUserId,
    voterUserId,
    createdAt: serverTimestamp(),
  } satisfies DailyMemeVoteDoc);
}

function mapDraftPayload(draft: DailyAnswerDraft, question: DailyQuestion) {
  switch (draft.type) {
    case "single_choice":
      return { selectedUserId: draft.selectedUserId };
    case "multi_choice":
      return { selectedUserIds: draft.selectedUserIds };
    case "open_text":
      return { textAnswer: draft.textAnswer.trim() };
    case "duel_1v1":
      return {
        selectedSide: draft.selectedSide,
        duelContext: extractDuelContext(question),
      };
    case "duel_2v2":
      return {
        selectedTeam: draft.selectedTeam,
        duelContext: extractDuelContext(question),
      };
    case "either_or":
      return { selectedOptionIndex: draft.selectedOptionIndex };
    case "meme_caption":
      return { textAnswer: draft.textAnswer.trim() };
  }
}


function extractDuelContext(question: DailyQuestion) {
  if (question.type === "duel_1v1") {
    return {
      memberIds: [question.left.userId, question.right.userId],
    };
  }

  if (question.type === "duel_2v2") {
    return {
      teamA: question.teamA.map((member) => member.userId),
      teamB: question.teamB.map((member) => member.userId),
    };
  }

  return undefined;
}
