"use client";

import { AdminScreen } from "@/components/admin/admin-screen";
import { useAuth } from "@/lib/auth/auth-context";
import {
  addSpecificQuestionToDailyRun,
  bulkDeleteQuestions,
  bulkSetQuestionsActive,
  createQuestion,
  createDailyRun,
  deleteDailyRun,
  deleteDailyRunComplete,
  deactivateUser,
  grantBonusTrophy,
  removeDailyRunQuestion,
  resetUserProfilePhoto,
  resetDailyRunAnswers,
  replaceDailyRun,
  rerollDailyRunQuestion,
  saveAdminConfig,
  toggleQuestionActive,
  updateQuestion,
} from "@/lib/firebase/admin-actions";
import { useAdminViewState } from "@/lib/firebase/admin";
import { berlinDateKey } from "@/lib/mapping/date";

export default function AdminPage() {
  const { authState } = useAuth();
  const state = useAdminViewState();

  return (
    <AdminScreen
      state={state}
      currentUserId={authState.status === "authenticated" ? authState.user.userId : undefined}
      onToggleActive={toggleQuestionActive}
      onCreateQuestion={async (input) => {
        if (authState.status !== "authenticated") {
          throw new Error("Nicht eingeloggt.");
        }

        return createQuestion(input, authState.user.userId);
      }}
      onUpdateQuestion={updateQuestion}
      onBulkSetActive={bulkSetQuestionsActive}
      onBulkDelete={bulkDeleteQuestions}
      onCreateRun={async (mode, categoryPlan) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        const payload = {
          dateKey: berlinDateKey(),
          createdBy: authState.user.userId,
          questionCount: state.config.draft.dailyQuestionCount,
          revealPolicy: state.config.draft.dailyRevealPolicy,
          categoryPlan,
        };

        if (mode === "replace") {
          return replaceDailyRun(payload);
        }

        return createDailyRun(payload);
      }}
      onDeleteRun={async (dateKey) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return deleteDailyRun(dateKey);
      }}
      onDeleteRunComplete={async (dateKey) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return deleteDailyRunComplete(dateKey);
      }}
      onResetToday={async (dateKey) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return resetDailyRunAnswers(dateKey);
      }}
      onRerollQuestion={async (dateKey, runId, questionId) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return rerollDailyRunQuestion({ dateKey, runId, questionId });
      }}
      onRemoveQuestion={async (dateKey, runId, questionId) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return removeDailyRunQuestion({ dateKey, runId, questionId });
      }}
      onAddSpecificQuestion={async (dateKey, questionId) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return addSpecificQuestionToDailyRun({ dateKey, questionId });
      }}
      onDeactivateUser={async (userId) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return deactivateUser({
          userId,
          actingUserId: authState.user.userId,
        });
      }}
      onGrantTrophy={async (userId) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return grantBonusTrophy(userId);
      }}
      onResetProfilePhoto={async (userId) => {
        if (authState.status !== "authenticated" || state.status !== "ready") {
          throw new Error("Nicht bereit.");
        }

        return resetUserProfilePhoto(userId);
      }}
      onSaveConfig={saveAdminConfig}
    />
  );
}
