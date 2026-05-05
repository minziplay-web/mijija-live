import { FieldValue } from "firebase-admin/firestore";

import {
  buildDailyRunPayload,
  canUseQuestionInDaily,
  DEFAULT_DAILY_CATEGORIES,
} from "@/lib/daily/daily-run-generator";
import { isUserTrophyQuestion } from "@/lib/daily/custom-daily-questions";
import { berlinDateKey } from "@/lib/mapping/date";
import type { Category, DateKey } from "@/lib/types/frontend";
import type { AppConfigDoc, QuestionDoc, UserDoc } from "@/lib/types/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/admin-server";

const SYSTEM_CREATED_BY = "__system__";

export async function maybeAutoCreateDailyRun(
  now: Date = new Date(),
  options?: { force?: boolean },
) {
  const db = getFirebaseAdminDb();
  const configRef = db.collection("appConfig").doc("main");
  const configSnapshot = await configRef.get();
  const config = (configSnapshot.data() ?? null) as AppConfigDoc | null;

  if (!config) {
    return {
      status: "skipped" as const,
      reason: "missing_config",
      message: "appConfig/main fehlt.",
    };
  }

  if (config.dailyAutoCreateEnabled !== true) {
    return {
      status: "skipped" as const,
      reason: "disabled",
      message: "Auto-Daily ist deaktiviert.",
    };
  }

  const dateKey = berlinDateKey(now);

  if (options?.force !== true && config.lastAutoCreatedDateKey === dateKey) {
    return {
      status: "skipped" as const,
      reason: "already_processed_today",
      dateKey,
      message: `Auto-Daily für ${dateKey} wurde bereits ausgeführt.`,
    };
  }

  const runRef = db.collection("dailyRuns").doc(dateKey);
  const existingRun = await runRef.get();

  if (existingRun.exists) {
    if (options?.force !== true) {
      await configRef.set({ lastAutoCreatedDateKey: dateKey }, { merge: true });
    }
    return {
      status: "skipped" as const,
      reason: "already_exists",
      dateKey,
      message: `Für ${dateKey} existiert bereits ein Daily.`,
    };
  }

  const [questionSnapshot, userSnapshot] = await Promise.all([
    db.collection("questions").where("active", "==", true).get(),
    db.collection("users").where("isActive", "==", true).get(),
  ]);

  const users = userSnapshot.docs.map((snapshot) => ({
    userId: snapshot.id,
    ...(snapshot.data() as UserDoc),
  }));

  const allQuestions = questionSnapshot.docs
    .map((snapshot) => ({
      questionId: snapshot.id,
      ...(snapshot.data() as QuestionDoc),
    }));
  const customQuestions = allQuestions.filter(
    (question) =>
      isUserTrophyQuestion(question)
      && question.consumedInDailyDateKey == null
      && typeof question.targetDateKey === "string"
      && question.targetDateKey <= dateKey,
  );
  const eligibleQuestions = allQuestions
    .filter(
      (question) =>
        !isUserTrophyQuestion(question) &&
        question.dailyLocked !== true &&
        canUseQuestionInDaily(question.type, users.length),
    );

  if (eligibleQuestions.length === 0 && customQuestions.length === 0) {
    throw new Error("Keine aktiven Daily-Fragen gefunden.");
  }

  const includedCategories =
    config.dailyIncludedCategories?.length
      ? config.dailyIncludedCategories
      : DEFAULT_DAILY_CATEGORIES;
  const forcedCategories = (config.dailyForcedCategories ?? []).filter((category) =>
    includedCategories.includes(category),
  );

  const payload = buildDailyRunPayload({
    dateKey,
    createdBy: SYSTEM_CREATED_BY,
    questionCount: config.dailyQuestionCount,
    revealPolicy: config.dailyRevealPolicy,
    categoryPlan: {
      includedCategories: includedCategories as Category[],
      forcedCategories: forcedCategories as Category[],
    },
    customQuestions,
    questions: eligibleQuestions,
    userIds: users.map((user) => user.userId),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await runRef.set(payload);
  const consumedQuestionIds = Array.from(new Set(payload.questionIds));
  for (let i = 0; i < consumedQuestionIds.length; i += 450) {
    const batch = db.batch();
    for (const questionId of consumedQuestionIds.slice(i, i + 450)) {
      batch.set(
        db.collection("questions").doc(questionId),
        {
          active: false,
          dailyLocked: true,
          dailyLockedDateKey: dateKey,
          consumedInDailyDateKey: dateKey,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    await batch.commit();
  }

  if (options?.force !== true) {
    await configRef.set({ lastAutoCreatedDateKey: dateKey }, { merge: true });
  }

  return {
    status: "created" as const,
    dateKey: dateKey as DateKey,
    questionCount: payload.questionCount,
    message: `Daily für ${dateKey} automatisch erzeugt.`,
  };
}
