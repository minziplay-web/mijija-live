"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminConfigForm } from "@/components/admin/admin-config-form";
import { AdminDailyCategoryPanel } from "@/components/admin/admin-daily-category-panel";
import { AdminDailyList } from "@/components/admin/admin-daily-list";
import { AdminDiagnostics } from "@/components/admin/admin-diagnostics";
import { AdminMemberList } from "@/components/admin/admin-member-list";
import { AdminQuestionFilterBar } from "@/components/admin/admin-question-filter-bar";
import { AdminQuestionList } from "@/components/admin/admin-question-list";
import { AdminSpyToggle } from "@/components/admin/admin-spy-toggle";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { mergeAdminState } from "@/lib/mapping/state-merge";
import { berlinDateKey } from "@/lib/mapping/date";
import type {
  AdminDailyDeleteResult,
  AdminDailyCategoryPlan,
  AdminDailyQuestionAddResult,
  AdminDailyQuestionRemoveResult,
  AdminDailyQuestionRerollResult,
  AdminQuestionFilter,
  AdminQuestionEditInput,
  AdminMemberRow,
  AdminQuestionRow,
  AdminRunActionResult,
  AdminTab,
  AdminViewState,
} from "@/lib/types/frontend";

export function AdminScreen({
  state: initial,
  currentUserId,
  onToggleActive,
  onCreateQuestion,
  onUpdateQuestion,
  onBulkSetActive,
  onBulkDelete,
  onCreateRun,
  onDeleteRun,
  onDeleteRunComplete,
  onResetToday,
  onRerollQuestion,
  onRemoveQuestion,
  onAddSpecificQuestion,
  onDeactivateUser,
  onGrantTrophy,
  onResetProfilePhoto,
  onSaveConfig,
}: {
  state: AdminViewState;
  currentUserId?: string;
  onToggleActive?: (questionId: string, active: boolean) => Promise<void>;
  onCreateQuestion?: (input: AdminQuestionEditInput) => Promise<string>;
  onUpdateQuestion?: (
    questionId: string,
    input: AdminQuestionEditInput,
  ) => Promise<void>;
  onBulkSetActive?: (questionIds: string[], active: boolean) => Promise<void>;
  onBulkDelete?: (questionIds: string[]) => Promise<void>;
  onCreateRun?: (
    mode: "create" | "replace",
    plan: AdminDailyCategoryPlan,
  ) => Promise<AdminRunActionResult>;
  onDeleteRun?: (dateKey: string) => Promise<AdminDailyDeleteResult>;
  onDeleteRunComplete?: (dateKey: string) => Promise<AdminDailyDeleteResult & { unlockedQuestions: number }>;
  onResetToday?: (dateKey: string) => Promise<AdminDailyDeleteResult>;
  onRerollQuestion?: (
    dateKey: string,
    runId: string,
    questionId: string,
  ) => Promise<AdminDailyQuestionRerollResult>;
  onRemoveQuestion?: (
    dateKey: string,
    runId: string,
    questionId: string,
  ) => Promise<AdminDailyQuestionRemoveResult>;
  onAddSpecificQuestion?: (
    dateKey: string,
    questionId: string,
  ) => Promise<AdminDailyQuestionAddResult>;
  onDeactivateUser?: (userId: string) => Promise<void>;
  onGrantTrophy?: (userId: string) => Promise<void>;
  onResetProfilePhoto?: (userId: string) => Promise<void>;
  onSaveConfig?: (
    draft: Extract<AdminViewState, { status: "ready" }>["config"]["draft"],
  ) => Promise<void>;
}) {
  const [state, setState] = useState(initial);
  const [replaceConfirm, setReplaceConfirm] = useState<string | null>(null);
  const [deleteRunConfirm, setDeleteRunConfirm] = useState<{
    dateKey: string;
    mode: "delete" | "reset" | "complete_delete";
  } | null>(null);
  const [rerollConfirm, setRerollConfirm] = useState<{
    dateKey: string;
    runId: string;
    questionId: string;
    text: string;
  } | null>(null);
  const [removeQuestionConfirm, setRemoveQuestionConfirm] = useState<{
    dateKey: string;
    runId: string;
    questionId: string;
    text: string;
  } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<AdminMemberRow | null>(null);
  const [runActionState, setRunActionState] = useState<{
    status: "idle" | "running" | "success" | "error";
    message?: string;
    result?: AdminRunActionResult;
    deletedRun?: AdminDailyDeleteResult;
    rerollResult?: AdminDailyQuestionRerollResult;
    removeQuestionResult?: AdminDailyQuestionRemoveResult;
  }>({
    status: "idle",
  });
  const [memberActionState, setMemberActionState] = useState<{
    status: "idle" | "running" | "success" | "error";
    message?: string;
  }>({
    status: "idle",
  });
  useEffect(() => {
    queueMicrotask(() => setState((prev) => mergeAdminState(prev, initial)));
  }, [initial]);

  const filteredRows = useMemo(() => {
    if (state.status !== "ready") return [];
    return filterRows(state.questions.rows, state.questions.filter);
  }, [state]);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Admin" title="Verwaltung" theme="admin" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Admin" title="Verwaltung" theme="admin" />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  if (state.status === "forbidden") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Admin" title="Verwaltung" theme="admin" />
        <EmptyState
          icon="🔒"
          title="Nur für Admins"
          description="Du hast keine Admin-Rechte in dieser Gruppe."
        />
      </div>
    );
  }

  const setTab = (activeTab: AdminTab) =>
    setState((prev) => (prev.status === "ready" ? { ...prev, activeTab } : prev));

  const updateQuestionFilter = (filter: AdminQuestionFilter) =>
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, questions: { ...prev.questions, filter } }
        : prev,
    );

  const toggleActive = (questionId: string, next: boolean) =>
    setState((prev) =>
      prev.status === "ready"
        ? {
            ...prev,
            questions: {
              ...prev.questions,
              rows: prev.questions.rows.map((r) =>
                r.questionId === questionId ? { ...r, active: next } : r,
              ),
            },
          }
        : prev,
    );


  const runCreate = async (mode: "create" | "replace") => {
    setRunActionState((prev) => ({
      status: "running",
      message: undefined,
      result: prev.result,
      deletedRun: prev.deletedRun,
      rerollResult: prev.rerollResult,
    }));

    if (onCreateRun) {
      try {
        const result = await onCreateRun(mode, {
          includedCategories: state.config.draft.dailyIncludedCategories,
          forcedCategories: state.config.draft.dailyForcedCategories,
        });
        setRunActionState({
          status: "success",
          message: buildRunActionMessage(result),
          result,
        });
      } catch (error) {
        setRunActionState((prev) => ({
          status: "error",
          message: getErrorMessage(
            error,
            mode === "replace"
              ? "Das heutige Daily konnte nicht gererollt werden."
              : "Die Frage konnte nicht hinzugefügt oder der Run nicht erzeugt werden.",
          ),
          result: prev.result,
          deletedRun: prev.deletedRun,
          rerollResult: prev.rerollResult,
        }));
        throw new Error("run_action_failed");
      }
      return;
    }

    setState((prev) => {
      if (prev.status !== "ready") return prev;
      const today = berlinDateKey();
      const todayRun = prev.dailyRuns.find((run) => run.dateKey === today);
      if (mode === "create" && todayRun) {
        return {
          ...prev,
          dailyRuns: prev.dailyRuns.map((run) =>
            run.runId === todayRun.runId
              ? { ...run, questionCount: run.questionCount + 1 }
              : run,
          ),
        };
      }

      return {
        ...prev,
        dailyRuns: [
          {
            runId: today,
            dateKey: today,
            runNumber: 1,
            runLabel: "Daily",
            status: "scheduled",
            questionCount: prev.config.draft.dailyQuestionCount,
            createdByDisplayName: "Admin",
          },
          ...prev.dailyRuns,
        ],
      };
    });
    setRunActionState({
      status: "success",
      message:
        mode === "replace"
          ? "Das heutige Daily wurde lokal gererollt."
          : "Eine Frage wurde lokal zum heutigen Daily hinzugefügt.",
      result: {
        mode:
          mode === "create" &&
          state.status === "ready" &&
          state.dailyRuns.some((run) => run.dateKey === berlinDateKey())
            ? "extend"
            : mode,
        dateKey: berlinDateKey(),
        questionCount: state.status === "ready" ? state.config.draft.dailyQuestionCount : 0,
        deletedPublicAnswers: 0,
        deletedPrivateAnswers: 0,
        deletedFirstAnswerLocks: 0,
      },
    });
  };

  const requestCreateRun = () => {
    void runCreate("create").catch(() => undefined);
  };

  const confirmReplace = async () => {
    setReplaceConfirm(null);
    try {
      await runCreate("replace");
    } catch {
      return;
    }
  };

  const confirmDeleteRun = async () => {
    const target = deleteRunConfirm;
    if (!target) return;

    setRunActionState((prev) => ({
      status: "running",
      message: undefined,
      result: prev.result,
      deletedRun: prev.deletedRun,
    }));

    try {
      const result =
        target.mode === "reset"
          ? onResetToday
            ? await onResetToday(target.dateKey)
            : { dateKey: target.dateKey, deletedPublicAnswers: 0, deletedPrivateAnswers: 0, deletedFirstAnswerLocks: 0 }
          : target.mode === "complete_delete"
            ? onDeleteRunComplete
              ? await onDeleteRunComplete(target.dateKey)
              : { dateKey: target.dateKey, deletedPublicAnswers: 0, deletedPrivateAnswers: 0, deletedFirstAnswerLocks: 0, unlockedQuestions: 0 }
            : onDeleteRun
              ? await onDeleteRun(target.dateKey)
              : { dateKey: target.dateKey, deletedPublicAnswers: 0, deletedPrivateAnswers: 0, deletedFirstAnswerLocks: 0 };
      setDeleteRunConfirm(null);
      setRunActionState({
        status: "success",
        message: buildDeleteRunMessage(target.mode, result),
        deletedRun: result,
        rerollResult: undefined,
      });
    } catch (error) {
      setRunActionState((prev) => ({
        status: "error",
        message: getErrorMessage(
          error,
          target.mode === "reset"
            ? "Das heutige Daily konnte nicht zurückgesetzt werden."
            : target.mode === "complete_delete"
              ? "Das Daily konnte nicht vollständig gelöscht werden."
              : "Das Daily konnte nicht gelöscht werden.",
        ),
        result: prev.result,
        deletedRun: prev.deletedRun,
        rerollResult: prev.rerollResult,
      }));
    }
  };

  const confirmRerollQuestion = async () => {
    const target = rerollConfirm;
    if (!target || !onRerollQuestion) {
      return;
    }

    setRunActionState((prev) => ({
      status: "running",
      message: undefined,
      result: prev.result,
      deletedRun: prev.deletedRun,
      rerollResult: prev.rerollResult,
    }));

    try {
      const result = await onRerollQuestion(target.dateKey, target.runId, target.questionId);
      setRerollConfirm(null);
      setRunActionState({
        status: "success",
        message: buildRerollQuestionMessage(result),
        rerollResult: result,
      });
    } catch (error) {
      setRunActionState((prev) => ({
        status: "error",
        message: getErrorMessage(error, "Die Frage konnte nicht neu gewürfelt werden."),
        result: prev.result,
        deletedRun: prev.deletedRun,
        rerollResult: prev.rerollResult,
      }));
    }
  };

  const confirmRemoveQuestion = async () => {
    const target = removeQuestionConfirm;
    if (!target || !onRemoveQuestion) {
      return;
    }

    setRunActionState((prev) => ({
      status: "running",
      message: undefined,
      result: prev.result,
      deletedRun: prev.deletedRun,
      rerollResult: prev.rerollResult,
      removeQuestionResult: prev.removeQuestionResult,
    }));

    try {
      const result = await onRemoveQuestion(target.dateKey, target.runId, target.questionId);
      setRemoveQuestionConfirm(null);
      setState((prev) =>
        prev.status === "ready"
          ? {
              ...prev,
              dailyRuns: prev.dailyRuns.map((run) =>
                run.runId === result.runId
                  ? {
                      ...run,
                      questionCount: result.questionCount,
                      items: run.items?.filter(
                        (item) => item.questionId !== result.removedQuestionId,
                      ),
                    }
                  : run,
              ),
            }
          : prev,
      );
      setRunActionState({
        status: "success",
        message: buildRemoveQuestionMessage(result),
        removeQuestionResult: result,
      });
    } catch (error) {
      setRunActionState((prev) => ({
        status: "error",
        message: getErrorMessage(error, "Die Frage konnte nicht entfernt werden."),
        result: prev.result,
        deletedRun: prev.deletedRun,
        rerollResult: prev.rerollResult,
        removeQuestionResult: prev.removeQuestionResult,
      }));
    }
  };

  const updateConfig = (draft: typeof state.config.draft) =>
    setState((prev) =>
      prev.status === "ready"
        ? {
            ...prev,
            config: {
              ...prev.config,
              draft,
              dirty: true,
              saveStatus: "idle",
              saveError: undefined,
            },
          }
        : prev,
    );

  const saveConfig = async () => {
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, config: { ...prev.config, saveStatus: "saving" } }
        : prev,
    );

    if (state.status === "ready" && onSaveConfig) {
      try {
        await onSaveConfig(state.config.draft);
        setState((prev) =>
          prev.status === "ready"
            ? {
                ...prev,
                config: { ...prev.config, saveStatus: "saved", dirty: false },
              }
            : prev,
        );
      } catch (error) {
        setState((prev) =>
          prev.status === "ready"
            ? {
                ...prev,
                config: {
                  ...prev.config,
                  saveStatus: "error",
                  saveError: getErrorMessage(
                    error,
                    "Config konnte nicht gespeichert werden.",
                  ),
                },
              }
            : prev,
        );
      }
      return;
    }

    window.setTimeout(() => {
      setState((prev) =>
        prev.status === "ready"
          ? {
              ...prev,
              config: { ...prev.config, saveStatus: "saved", dirty: false },
            }
          : prev,
      );
    }, 400);
  };

  const confirmRemoveMember = async () => {
    const target = memberToRemove;
    if (!target) {
      return;
    }

    setMemberActionState({
      status: "running",
      message: undefined,
    });

    try {
      if (onDeactivateUser) {
        await onDeactivateUser(target.userId);
      }
      setMemberActionState({
        status: "success",
        message: `${target.displayName} wurde entfernt.`,
      });
      setMemberToRemove(null);
    } catch (error) {
      setMemberActionState({
        status: "error",
        message: getErrorMessage(error, "Das Mitglied konnte nicht entfernt werden."),
      });
    }
  };

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow="Admin"
        title="Verwaltung"
        subtitle="Fragen, Dailys und App-Konfiguration."
        theme="admin"
      />
      <AdminDiagnostics daily={state.diagnostics.todayDaily} />
      <AdminSpyToggle />
      <AdminTabs value={state.activeTab} onChange={setTab} />

      {state.activeTab === "questions" ? (
        <div className="space-y-4">
          <AdminQuestionFilterBar
            filter={state.questions.filter}
            onChange={updateQuestionFilter}
          />
          <AdminQuestionList
            rows={filteredRows}
            onCreateQuestion={onCreateQuestion}
            onUpdateQuestion={onUpdateQuestion}
            onBulkSetActive={onBulkSetActive}
            onBulkDelete={onBulkDelete}
            onToggleActive={(questionId, next) => {
              toggleActive(questionId, next);
              if (onToggleActive) {
                void onToggleActive(questionId, next).catch(() => {
                  toggleActive(questionId, !next);
                });
              }
            }}
          />
        </div>
      ) : null}

      {state.activeTab === "daily" ? (
        <div className="space-y-4">
          <AdminDailyCategoryPanel
            plan={{
              includedCategories: state.config.draft.dailyIncludedCategories,
              forcedCategories: state.config.draft.dailyForcedCategories,
            }}
            questionCount={state.config.draft.dailyQuestionCount}
            dirty={state.config.dirty}
            saveStatus={state.config.saveStatus}
            saveError={state.config.saveError}
            onChange={(plan) =>
              updateConfig({
                ...state.config.draft,
                dailyIncludedCategories: plan.includedCategories,
                dailyForcedCategories: plan.forcedCategories,
              })
            }
            onSave={saveConfig}
          />
          <AdminDailyList
            runs={state.dailyRuns}
            questionPool={state.questions.rows}
            onCreate={requestCreateRun}
            onReplaceToday={() => setReplaceConfirm(berlinDateKey())}
            onRerollQuestion={(dateKey, runId, questionId, text) =>
              setRerollConfirm({ dateKey, runId, questionId, text })
            }
            onRemoveQuestion={(dateKey, runId, questionId, text) =>
              setRemoveQuestionConfirm({ dateKey, runId, questionId, text })
            }
            onUpdateQuestion={onUpdateQuestion}
            onAddSpecificQuestion={
              onAddSpecificQuestion
                ? async (dateKey, questionId) => {
                    const result = await onAddSpecificQuestion(dateKey, questionId);
                    setRunActionState({
                      status: "success",
                      message: `Hinzugefügt · ${result.questionCount} Fragen`,
                    });
                    return result;
                  }
                : undefined
            }
            onDeleteRun={(dateKey) =>
              setDeleteRunConfirm({
                dateKey,
                mode: dateKey === berlinDateKey() ? "reset" : "delete",
              })
            }
            onDeleteRunComplete={(dateKey) =>
              setDeleteRunConfirm({ dateKey, mode: "complete_delete" })
            }
            onResetToday={() =>
              setDeleteRunConfirm({
                dateKey: berlinDateKey(),
                mode: "reset",
              })
            }
            todayDateKey={berlinDateKey()}
            runActionStatus={runActionState.status}
            runActionMessage={runActionState.message}
          />
        </div>
      ) : null}

      {state.activeTab === "members" ? (
        <AdminMemberList
          members={state.members}
          currentUserId={currentUserId}
          removeStatus={memberActionState.status}
          removeMessage={memberActionState.message}
          onRemove={setMemberToRemove}
          onGrantTrophy={async (member) => {
            setMemberActionState({ status: "running", message: undefined });
            try {
              if (onGrantTrophy) {
                await onGrantTrophy(member.userId);
              }
              setMemberActionState({
                status: "success",
                message: `${member.displayName} hat jetzt eine Bonus-Trophy bekommen.`,
              });
            } catch (error) {
              setMemberActionState({
                status: "error",
                message: getErrorMessage(
                  error,
                  "Die Trophy konnte nicht vergeben werden.",
                ),
              });
            }
          }}
          onResetProfilePhoto={async (member) => {
            setMemberActionState({ status: "running", message: undefined });
            try {
              if (onResetProfilePhoto) {
                await onResetProfilePhoto(member.userId);
              }
              setMemberActionState({
                status: "success",
                message: `${member.displayName}s Profilbild wurde zurückgesetzt.`,
              });
            } catch (error) {
              setMemberActionState({
                status: "error",
                message: getErrorMessage(
                  error,
                  "Das Profilbild konnte nicht zurückgesetzt werden.",
                ),
              });
            }
          }}
        />
      ) : null}

      {state.activeTab === "config" ? (
        <AdminConfigForm
          draft={state.config.draft}
          saveStatus={state.config.saveStatus}
          saveError={state.config.saveError}
          dirty={state.config.dirty}
          onChange={updateConfig}
          onSave={saveConfig}
        />
      ) : null}

      <ConfirmDialog
        open={replaceConfirm !== null}
        title="Heutiges Daily rerollen?"
        description="Für heute existiert schon ein Daily. Beim Rerollen werden alle heutigen Fragen neu aus dem Pool gezogen. Bereits abgegebene Antworten, Locks und Herzen gehen dabei für heute verloren."
        confirmLabel="Rerollen"
        cancelLabel="Abbrechen"
        tone="destructive"
        onCancel={() => setReplaceConfirm(null)}
        onConfirm={() => void confirmReplace()}
        loading={runActionState.status === "running"}
      />
      <ConfirmDialog
        open={memberToRemove !== null}
        title="Mitglied entfernen?"
        description={
          memberToRemove
            ? `${memberToRemove.displayName} wird aus der App deaktiviert und verschwindet aus den aktiven Listen.`
            : ""
        }
        confirmLabel="Entfernen"
        cancelLabel="Abbrechen"
        tone="destructive"
        onCancel={() => setMemberToRemove(null)}
        onConfirm={() => void confirmRemoveMember()}
        loading={memberActionState.status === "running"}
      />
      <ConfirmDialog
        open={deleteRunConfirm !== null}
        title={
          deleteRunConfirm?.mode === "reset"
            ? "Heutiges Daily zurücksetzen?"
            : "Daily löschen?"
        }
        description={
          deleteRunConfirm?.mode === "reset"
            ? "Die heutigen Fragen bleiben bestehen. Es werden nur alle Antworten, First-Answer-Locks und Meme-Herzen entfernt, sodass das Daily wieder wie frisch erzeugt ist."
            : deleteRunConfirm
              ? `Das Daily vom ${deleteRunConfirm.dateKey} und alle dazugehörigen Antworten werden entfernt.`
              : ""
        }
        confirmLabel={deleteRunConfirm?.mode === "reset" ? "Zurücksetzen" : "Löschen"}
        cancelLabel="Abbrechen"
        tone="destructive"
        onCancel={() => setDeleteRunConfirm(null)}
        onConfirm={() => void confirmDeleteRun()}
        loading={runActionState.status === "running"}
      />
      <ConfirmDialog
        open={rerollConfirm !== null}
        title="Frage neu würfeln?"
        description={
          rerollConfirm
            ? `„${rerollConfirm.text}“ wird aus dem heutigen Daily entfernt. Alle Antworten und Meme-Herzen zu dieser Frage werden gelöscht, damit die neue Frage wieder offen für alle ist.`
            : ""
        }
        confirmLabel="Neu würfeln"
        cancelLabel="Abbrechen"
        tone="destructive"
        onCancel={() => setRerollConfirm(null)}
        onConfirm={() => void confirmRerollQuestion()}
        loading={runActionState.status === "running"}
      />
      <ConfirmDialog
        open={removeQuestionConfirm !== null}
        title="Frage entfernen?"
        description={
          removeQuestionConfirm
            ? `„${removeQuestionConfirm.text}“ wird aus dem heutigen Daily entfernt. Alle Antworten, First-Answer-Locks und Meme-Herzen zu dieser Frage werden gelöscht, als hätte es diese Frage heute nie gegeben.`
            : ""
        }
        confirmLabel="Entfernen"
        cancelLabel="Abbrechen"
        tone="destructive"
        onCancel={() => setRemoveQuestionConfirm(null)}
        onConfirm={() => void confirmRemoveQuestion()}
        loading={runActionState.status === "running"}
      />
    </div>
  );
}

function buildRunActionMessage(result: AdminRunActionResult) {
  if (result.mode === "create") {
    return `Erzeugt · ${result.questionCount} Fragen`;
  }

  if (result.mode === "extend") {
    return `Hinzugefügt · ${result.questionCount} Fragen`;
  }

  const clearedTotal =
    result.deletedPublicAnswers +
    result.deletedPrivateAnswers +
    result.deletedFirstAnswerLocks;

  if (clearedTotal === 0) {
    return "Gererollt";
  }

  return `Gererollt · ${clearedTotal} Antworten entfernt`;
}

function buildDeleteRunMessage(
  mode: "delete" | "reset" | "complete_delete",
  result: AdminDailyDeleteResult & { unlockedQuestions?: number },
) {
  const head =
    mode === "reset"
      ? "Zurückgesetzt"
      : mode === "complete_delete"
        ? "Vollständig gelöscht"
        : "Gelöscht";
  const parts: string[] = [head];

  const answersTotal =
    result.deletedPublicAnswers +
    result.deletedPrivateAnswers +
    result.deletedFirstAnswerLocks;
  if (answersTotal > 0) {
    parts.push(`${answersTotal} Antworten entfernt`);
  }
  if (result.unlockedQuestions && result.unlockedQuestions > 0) {
    parts.push(`${result.unlockedQuestions} Fragen freigegeben`);
  }

  return parts.join(" · ");
}

function buildRerollQuestionMessage(result: AdminDailyQuestionRerollResult) {
  const cleared =
    result.deletedPublicAnswers +
    result.deletedPrivateAnswers +
    result.deletedFirstAnswerLocks +
    result.deletedMemeVotes;
  const parts: string[] = ["Gewürfelt"];
  if (cleared > 0) {
    parts.push(`${cleared} Antworten entfernt`);
  }
  return parts.join(" · ");
}

function buildRemoveQuestionMessage(result: AdminDailyQuestionRemoveResult) {
  const cleared =
    result.deletedPublicAnswers +
    result.deletedPrivateAnswers +
    result.deletedFirstAnswerLocks +
    result.deletedMemeVotes;
  const parts: string[] = [`Entfernt · ${result.questionCount} Fragen`];
  if (cleared > 0) {
    parts.push(`${cleared} Antworten entfernt`);
  }

  return parts.join(" · ");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function filterRows(
  rows: AdminQuestionRow[],
  filter: AdminQuestionFilter,
): AdminQuestionRow[] {
  return rows.filter((row) => {
    if (filter.search) {
      const s = filter.search.toLowerCase();
      if (!row.text.toLowerCase().includes(s)) return false;
    }
    if (filter.category !== "all" && row.category !== filter.category) {
      return false;
    }
    if (filter.type !== "all" && row.type !== filter.type) return false;
    if (filter.active === "active" && !row.active) return false;
    if (filter.active === "inactive" && row.active) return false;
    if (filter.targetMode !== "all" && row.targetMode !== filter.targetMode) {
      return false;
    }
    return true;
  });
}
