"use client";

import { useState } from "react";

import {
  CategoryChip,
  DAILY_ACCENT,
  DangerButton,
  DarkSelect,
  Eyebrow,
  MonoMetaLabel,
  PrimaryButton,
  StatusBanner,
  SubtleButton,
  SUCCESS,
} from "@/components/admin/admin-ui";
import {
  QuestionEditPanel,
  normalizeEitherOrOptions,
} from "@/components/admin/admin-question-list";
import { EmptyState } from "@/components/ui/empty-state";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/mapping/categories";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type {
  AdminDailyQuestionAddResult,
  AdminDailyRunRow,
  AdminQuestionEditInput,
  AdminQuestionRow,
  Category,
  DateKey,
  QuestionType,
} from "@/lib/types/frontend";

const STATUS_LABEL: Record<AdminDailyRunRow["status"], string> = {
  scheduled: "Geplant",
  active: "Aktiv",
  closed: "Abgeschlossen",
};

const STATUS_COLOR: Record<AdminDailyRunRow["status"], string> = {
  scheduled: "#A8A8A8",
  active: SUCCESS,
  closed: "#6E6E73",
};

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Mitglied wählen",
  multi_choice: "Mehrere Mitglieder",
  open_text: "Freitext",
  duel_1v1: "1v1 Voting",
  duel_2v2: "2v2 Voting",
  either_or: "2 Optionen",
  meme_caption: "Meme",
};

export function AdminDailyList({
  runs,
  onCreate,
  onReplaceToday,
  onDeleteRun,
  onDeleteRunComplete,
  onResetToday,
  onRerollQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onAddSpecificQuestion,
  questionPool,
  todayDateKey,
  runActionStatus = "idle",
  runActionMessage,
}: {
  runs: AdminDailyRunRow[];
  onCreate: () => void;
  onReplaceToday?: () => void;
  onDeleteRun?: (dateKey: DateKey) => void;
  onDeleteRunComplete?: (dateKey: DateKey) => void;
  onResetToday?: () => void;
  onRerollQuestion?: (dateKey: DateKey, runId: string, questionId: string, text: string) => void;
  onRemoveQuestion?: (dateKey: DateKey, runId: string, questionId: string, text: string) => void;
  onUpdateQuestion?: (questionId: string, input: AdminQuestionEditInput) => Promise<void>;
  onAddSpecificQuestion?: (
    dateKey: DateKey,
    questionId: string,
  ) => Promise<AdminDailyQuestionAddResult>;
  questionPool?: AdminQuestionRow[];
  todayDateKey?: DateKey;
  runActionStatus?: "idle" | "running" | "success" | "error";
  runActionMessage?: string;
}) {
  const [todayOpen, setTodayOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState<"choose" | "preview">("choose");
  const [addMode, setAddMode] = useState<"random" | "manual" | null>(null);
  const [addRandomScope, setAddRandomScope] = useState<"all" | "category">("all");
  const [addCategory, setAddCategory] = useState<Category | "all">("all");
  const [addSelected, setAddSelected] = useState<AdminQuestionRow | null>(null);
  const [addPickedVia, setAddPickedVia] = useState<"random" | "category" | null>(null);
  const [addStatus, setAddStatus] = useState<"idle" | "saving" | "error">("idle");
  const [addMessage, setAddMessage] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AdminQuestionEditInput | null>(null);
  const [editStatus, setEditStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [editMessage, setEditMessage] = useState<string | undefined>(undefined);

  const startEditing = (item: NonNullable<AdminDailyRunRow["items"]>[number]) => {
    setEditingId(item.questionId);
    setEditDraft({
      text: item.text,
      category: item.category,
      type: item.type,
      targetMode: "daily",
      options:
        item.type === "either_or" ? normalizeEitherOrOptions(item.options) : undefined,
      imagePath: item.type === "meme_caption" ? item.imagePath ?? "" : undefined,
    });
    setEditStatus("idle");
    setEditMessage(undefined);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft(null);
    setEditStatus("idle");
    setEditMessage(undefined);
  };

  const updateDraft = (patch: Partial<AdminQuestionEditInput>) => {
    setEditDraft((current) => (current ? { ...current, ...patch } : current));
    setEditStatus("idle");
    setEditMessage(undefined);
  };

  const changeDraftType = (type: QuestionType) => {
    setEditDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        type,
        options: type === "either_or" ? normalizeEitherOrOptions(current.options) : undefined,
        imagePath: type === "meme_caption" ? current.imagePath ?? "" : undefined,
      };
    });
    setEditStatus("idle");
    setEditMessage(undefined);
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft || !onUpdateQuestion) return;
    setEditStatus("saving");
    setEditMessage(undefined);
    try {
      await onUpdateQuestion(editingId, editDraft);
      setEditStatus("success");
      setEditMessage("Gespeichert");
      setEditingId(null);
      setEditDraft(null);
    } catch (error) {
      setEditStatus("error");
      setEditMessage(error instanceof Error ? error.message : "Speichern fehlgeschlagen.");
    }
  };

  const todayRuns = todayDateKey
    ? runs.filter((r) => r.dateKey === todayDateKey)
    : [];
  const todayRun =
    todayRuns.find((run) => run.runNumber === 1 || run.runId === todayDateKey) ??
    todayRuns[0];
  const visibleRuns = runs.filter(
    (run) => !(run.dateKey === todayDateKey && run.runNumber > 1),
  );

  const eligiblePool = (() => {
    if (!questionPool || !todayRun) return [];
    const used = new Set(todayRun.items?.map((item) => item.questionId) ?? []);
    return questionPool.filter(
      (row) =>
        row.active &&
        !row.dailyLocked &&
        row.source === "admin_pool" &&
        !used.has(row.questionId),
    );
  })();

  const filteredPool =
    addCategory === "all"
      ? eligiblePool
      : eligiblePool.filter((row) => row.category === addCategory);

  const openAddModal = () => {
    setAddModalOpen(true);
    setAddStep("choose");
    setAddMode(null);
    setAddRandomScope("all");
    setAddSelected(null);
    setAddPickedVia(null);
    setAddCategory("all");
    setAddStatus("idle");
    setAddMessage(undefined);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddStep("choose");
    setAddMode(null);
    setAddRandomScope("all");
    setAddSelected(null);
    setAddPickedVia(null);
    setAddStatus("idle");
    setAddMessage(undefined);
  };

  const pickRandom = (scope: "all" | "category" = addRandomScope) => {
    const basePool =
      scope === "category"
        ? eligiblePool.filter((row) => row.category === addCategory)
        : eligiblePool;
    if (basePool.length === 0) {
      setAddStatus("error");
      setAddMessage(
        scope === "category"
          ? "Keine eligible Fragen in dieser Kategorie."
          : "Keine eligible Fragen im Pool.",
      );
      return;
    }
    const candidates =
      addSelected && basePool.length > 1
        ? basePool.filter((row) => row.questionId !== addSelected.questionId)
        : basePool;
    const random = candidates[Math.floor(Math.random() * candidates.length)];
    setAddSelected(random);
    setAddPickedVia("random");
    setAddRandomScope(scope);
    setAddStep("preview");
    setAddStatus("idle");
    setAddMessage(undefined);
  };

  const pickFromCategory = (row: AdminQuestionRow) => {
    setAddSelected(row);
    setAddPickedVia("category");
    setAddStep("preview");
    setAddStatus("idle");
    setAddMessage(undefined);
  };

  const confirmAdd = async () => {
    if (!addSelected || !todayRun || !onAddSpecificQuestion) return;
    setAddStatus("saving");
    setAddMessage(undefined);
    try {
      await onAddSpecificQuestion(todayRun.dateKey, addSelected.questionId);
      closeAddModal();
    } catch (error) {
      setAddStatus("error");
      setAddMessage(
        error instanceof Error ? error.message : "Frage konnte nicht hinzugefügt werden.",
      );
    }
  };

  const actionRunning = runActionStatus === "running";

  return (
    <div className="space-y-3">
      {todayRun ? (
        <TodayCard
          run={todayRun}
          open={todayOpen}
          onToggle={() => setTodayOpen((v) => !v)}
          actionRunning={actionRunning}
          editingId={editingId}
          editDraft={editDraft}
          editStatus={editStatus}
          editMessage={editMessage}
          onStartEdit={startEditing}
          onCancelEdit={cancelEditing}
          onSaveEdit={saveEdit}
          onUpdateDraft={updateDraft}
          onChangeDraftType={changeDraftType}
          updateQuestionAvailable={Boolean(onUpdateQuestion)}
          onAddSpecificQuestion={
            onAddSpecificQuestion ? openAddModal : onCreate
          }
          onReplaceToday={onReplaceToday}
          onResetToday={onResetToday}
          onDeleteRunComplete={
            onDeleteRunComplete
              ? () => onDeleteRunComplete(todayRun.dateKey)
              : undefined
          }
          onRerollQuestion={onRerollQuestion}
          onRemoveQuestion={onRemoveQuestion}
        />
      ) : (
        <PrimaryButton onClick={onCreate} disabled={actionRunning} fullWidth accent={DAILY_ACCENT}>
          {actionRunning ? "Erzeugt..." : "Neuen Run erzeugen"}
        </PrimaryButton>
      )}

      {runActionMessage ? (
        <StatusBanner status={runActionStatus} message={runActionMessage} />
      ) : null}

      <section className="space-y-2">
        <Eyebrow>Vergangene Runs</Eyebrow>
        {visibleRuns.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Noch keine Runs"
            description="Erzeuge einen Run für heute oder morgen."
          />
        ) : (
          <ul className="overflow-hidden rounded-2xl bg-[#1A1A1A] ring-1 ring-[#1F1F1F]">
            {visibleRuns.map((run, idx) => (
              <RunRow
                key={run.runId}
                run={run}
                isLast={idx === visibleRuns.length - 1}
                isToday={run.dateKey === todayDateKey}
                onDelete={onDeleteRun}
                actionRunning={actionRunning}
              />
            ))}
          </ul>
        )}
      </section>

      {addModalOpen ? (
        <AddQuestionModal
          step={addStep}
          mode={addMode}
          randomScope={addRandomScope}
          category={addCategory}
          selected={addSelected}
          pickedVia={addPickedVia}
          status={addStatus}
          message={addMessage}
          eligiblePool={eligiblePool}
          filteredPool={filteredPool}
          onClose={closeAddModal}
          onSetMode={(mode) => {
            setAddMode(mode);
            setAddRandomScope("all");
            setAddCategory("all");
          }}
          onBackToChoose={() => {
            setAddMode(null);
            setAddRandomScope("all");
            setAddCategory("all");
            setAddStatus("idle");
            setAddMessage(undefined);
          }}
          onBackToList={() => {
            setAddStep("choose");
            setAddSelected(null);
            setAddPickedVia(null);
            setAddStatus("idle");
            setAddMessage(undefined);
          }}
          onSetRandomScope={setAddRandomScope}
          onSetCategory={setAddCategory}
          onPickRandom={pickRandom}
          onPickFromCategory={pickFromCategory}
          onConfirm={confirmAdd}
        />
      ) : null}
    </div>
  );
}

function TodayCard({
  run,
  open,
  onToggle,
  actionRunning,
  editingId,
  editDraft,
  editStatus,
  editMessage,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onUpdateDraft,
  onChangeDraftType,
  updateQuestionAvailable,
  onAddSpecificQuestion,
  onReplaceToday,
  onResetToday,
  onDeleteRunComplete,
  onRerollQuestion,
  onRemoveQuestion,
}: {
  run: AdminDailyRunRow;
  open: boolean;
  onToggle: () => void;
  actionRunning: boolean;
  editingId: string | null;
  editDraft: AdminQuestionEditInput | null;
  editStatus: "idle" | "saving" | "error" | "success";
  editMessage?: string;
  onStartEdit: (item: NonNullable<AdminDailyRunRow["items"]>[number]) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => Promise<void>;
  onUpdateDraft: (patch: Partial<AdminQuestionEditInput>) => void;
  onChangeDraftType: (type: QuestionType) => void;
  updateQuestionAvailable: boolean;
  onAddSpecificQuestion: () => void;
  onReplaceToday?: () => void;
  onResetToday?: () => void;
  onDeleteRunComplete?: () => void;
  onRerollQuestion?: (dateKey: DateKey, runId: string, questionId: string, text: string) => void;
  onRemoveQuestion?: (dateKey: DateKey, runId: string, questionId: string, text: string) => void;
}) {
  return (
    <section
      className="overflow-hidden rounded-2xl bg-[#1A1A1A]"
      style={{ boxShadow: `inset 0 0 0 1px ${DAILY_ACCENT}40` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-[#0E0E0E]"
      >
        <div className="min-w-0 space-y-0.5">
          <Eyebrow accent={DAILY_ACCENT}>Heutige Daily</Eyebrow>
          <p
            className="text-[15px] font-semibold tabular-nums text-[#FAFAFA]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {run.questionCount}{" "}
            <span className="text-[#A8A8A8]">
              {run.questionCount === 1 ? "Frage" : "Fragen"}
            </span>
          </p>
        </div>
        <span
          className="shrink-0 text-[14px] text-[#6E6E73] transition-transform"
          style={{
            transform: open ? "rotate(90deg)" : "rotate(0)",
            fontFamily: "var(--font-mono)",
          }}
          aria-hidden
        >
          ▸
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-[#1F1F1F] p-4">
          {run.items && run.items.length > 0 ? (
            <ul className="space-y-2">
              {run.items.map((item, index) => (
                <DailyItemRow
                  key={`${run.runId}_${item.questionId}`}
                  item={item}
                  index={index}
                  actionRunning={actionRunning}
                  isEditing={editingId === item.questionId}
                  editDraft={editDraft}
                  editStatus={editStatus}
                  editMessage={editMessage}
                  onEdit={() => onStartEdit(item)}
                  onCancelEdit={onCancelEdit}
                  onSaveEdit={onSaveEdit}
                  onUpdateDraft={onUpdateDraft}
                  onChangeDraftType={onChangeDraftType}
                  editAvailable={updateQuestionAvailable}
                  onReroll={
                    onRerollQuestion
                      ? () =>
                          onRerollQuestion(run.dateKey, run.runId, item.questionId, item.text)
                      : undefined
                  }
                  onRemove={
                    onRemoveQuestion
                      ? () =>
                          onRemoveQuestion(run.dateKey, run.runId, item.questionId, item.text)
                      : undefined
                  }
                />
              ))}
            </ul>
          ) : null}

          <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-3">
            <SubtleButton
              onClick={onAddSpecificQuestion}
              disabled={actionRunning}
              fullWidth
              accent={DAILY_ACCENT}
            >
              + Frage
            </SubtleButton>
            <SubtleButton
              onClick={onReplaceToday}
              disabled={actionRunning || !onReplaceToday}
              fullWidth
            >
              {actionRunning ? "..." : "Rerollen"}
            </SubtleButton>
            <SubtleButton
              onClick={onResetToday}
              disabled={actionRunning || !onResetToday}
              fullWidth
            >
              {actionRunning ? "..." : "Reset Antworten"}
            </SubtleButton>
          </div>
          <DangerButton
            onClick={onDeleteRunComplete}
            disabled={actionRunning || !onDeleteRunComplete}
            fullWidth
          >
            Daily löschen
          </DangerButton>
        </div>
      ) : null}
    </section>
  );
}

function DailyItemRow({
  item,
  index,
  actionRunning,
  isEditing,
  editDraft,
  editStatus,
  editMessage,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onUpdateDraft,
  onChangeDraftType,
  editAvailable,
  onReroll,
  onRemove,
}: {
  item: NonNullable<AdminDailyRunRow["items"]>[number];
  index: number;
  actionRunning: boolean;
  isEditing: boolean;
  editDraft: AdminQuestionEditInput | null;
  editStatus: "idle" | "saving" | "error" | "success";
  editMessage?: string;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => Promise<void>;
  onUpdateDraft: (patch: Partial<AdminQuestionEditInput>) => void;
  onChangeDraftType: (type: QuestionType) => void;
  editAvailable: boolean;
  onReroll?: () => void;
  onRemove?: () => void;
}) {
  return (
    <li className="space-y-3 rounded-xl bg-[#0E0E0E] p-3 ring-1 ring-[#1F1F1F]">
      <div className="flex gap-3">
        <span
          className="shrink-0 text-[18px] font-semibold tabular-nums text-[#6E6E73]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          {item.type === "meme_caption" && item.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imagePath}
              alt=""
              className="h-28 w-full rounded-xl object-cover ring-1 ring-[#1F1F1F]"
            />
          ) : null}
          <p className="text-[14px] leading-snug text-[#FAFAFA]">{item.text}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <CategoryChip
              emoji={CATEGORY_EMOJI[item.category]}
              label={CATEGORY_LABELS[item.category]}
            />
            <MonoMetaLabel>{TYPE_LABELS[item.type]}</MonoMetaLabel>
          </div>
        </div>
      </div>

      {isEditing && editDraft ? (
        <QuestionEditPanel
          draft={editDraft}
          status={editStatus}
          message={editMessage}
          onChange={onUpdateDraft}
          onTypeChange={onChangeDraftType}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          <SubtleButton onClick={onEdit} disabled={actionRunning || !editAvailable}>
            Bearbeiten
          </SubtleButton>
          <SubtleButton onClick={onReroll} disabled={actionRunning || !onReroll}>
            Neu würfeln
          </SubtleButton>
          <DangerButton onClick={onRemove} disabled={actionRunning || !onRemove}>
            Entfernen
          </DangerButton>
        </div>
      )}
    </li>
  );
}

function RunRow({
  run,
  isLast,
  isToday,
  onDelete,
  actionRunning,
}: {
  run: AdminDailyRunRow;
  isLast: boolean;
  isToday: boolean;
  onDelete?: (dateKey: DateKey) => void;
  actionRunning: boolean;
}) {
  const statusColor = STATUS_COLOR[run.status];
  const dayNumber = run.dateKey.slice(8, 10);
  return (
    <li className={isLast ? "" : "border-b border-[#1F1F1F]"}>
      <div className="flex items-center gap-4 px-4 py-3">
        <span
          className="shrink-0 leading-none tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 22,
            color: "#6E6E73",
            fontWeight: 500,
            width: 28,
          }}
          aria-hidden
        >
          {dayNumber}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "#6E6E73", fontFamily: "var(--font-mono)" }}
          >
            {run.dateKey}
            {run.runNumber > 1 ? ` · ${run.runLabel}` : ""}
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[#FAFAFA]">
            {formatBerlinDateLabel(run.dateKey)}
          </p>
          <p
            className="mt-1 text-[11px] tabular-nums text-[#A8A8A8]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {run.questionCount} Fragen · von {run.createdByDisplayName}
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold tabular-nums"
          style={{ color: statusColor, fontFamily: "var(--font-mono)" }}
        >
          <span
            aria-hidden
            className="block size-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          {STATUS_LABEL[run.status]}
        </span>
        {!isToday && onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(run.dateKey)}
            disabled={actionRunning}
            className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition disabled:opacity-40"
            style={{
              color: "#E5594F",
              fontFamily: "var(--font-mono)",
            }}
            aria-label={`Run vom ${run.dateKey} löschen`}
          >
            Löschen
          </button>
        ) : null}
      </div>
    </li>
  );
}

function AddQuestionModal({
  step,
  mode,
  randomScope,
  category,
  selected,
  pickedVia,
  status,
  message,
  eligiblePool,
  filteredPool,
  onClose,
  onSetMode,
  onBackToChoose,
  onBackToList,
  onSetRandomScope,
  onSetCategory,
  onPickRandom,
  onPickFromCategory,
  onConfirm,
}: {
  step: "choose" | "preview";
  mode: "random" | "manual" | null;
  randomScope: "all" | "category";
  category: Category | "all";
  selected: AdminQuestionRow | null;
  pickedVia: "random" | "category" | null;
  status: "idle" | "saving" | "error";
  message?: string;
  eligiblePool: AdminQuestionRow[];
  filteredPool: AdminQuestionRow[];
  onClose: () => void;
  onSetMode: (mode: "random" | "manual") => void;
  onBackToChoose: () => void;
  onBackToList: () => void;
  onSetRandomScope: (scope: "all" | "category") => void;
  onSetCategory: (category: Category | "all") => void;
  onPickRandom: (scope?: "all" | "category") => void;
  onPickFromCategory: (row: AdminQuestionRow) => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[#1A1A1A] ring-1 ring-[#1F1F1F]">
        <header className="flex items-center justify-between gap-3 border-b border-[#1F1F1F] px-4 py-3">
          <div>
            <Eyebrow accent={DAILY_ACCENT}>Daily</Eyebrow>
            <p className="text-[14px] font-semibold text-[#FAFAFA]">
              {step === "choose" ? "Frage hinzufügen" : "Vorschau"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[18px] leading-none text-[#A8A8A8] transition hover:text-[#FAFAFA]"
            aria-label="Schließen"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {step === "choose" ? (
            mode === null ? (
              <div className="grid grid-cols-2 gap-2">
                <SubtleButton
                  onClick={() => onSetMode("random")}
                  disabled={eligiblePool.length === 0}
                  fullWidth
                  accent={DAILY_ACCENT}
                >
                  🎲 Würfeln
                </SubtleButton>
                <SubtleButton
                  onClick={() => onSetMode("manual")}
                  disabled={eligiblePool.length === 0}
                  fullWidth
                >
                  📋 Liste
                </SubtleButton>
              </div>
            ) : mode === "random" ? (
              <RandomMode
                scope={randomScope}
                category={category}
                eligiblePool={eligiblePool}
                filteredPool={filteredPool}
                onSetScope={onSetRandomScope}
                onSetCategory={onSetCategory}
                onPick={onPickRandom}
              />
            ) : (
              <ManualMode
                category={category}
                filteredPool={filteredPool}
                onSetCategory={onSetCategory}
                onPick={onPickFromCategory}
              />
            )
          ) : selected ? (
            <PreviewBlock selected={selected} />
          ) : null}

          {message ? <StatusBanner status={status} message={message} /> : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-[#1F1F1F] px-4 py-3">
          {step === "preview" ? (
            <>
              <SubtleButton onClick={onBackToList} disabled={status === "saving"}>
                Zurück
              </SubtleButton>
              {pickedVia === "random" ? (
                <SubtleButton
                  onClick={() => onPickRandom(randomScope)}
                  disabled={
                    status === "saving" ||
                    (randomScope === "category"
                      ? filteredPool.length <= 1
                      : eligiblePool.length <= 1)
                  }
                >
                  🎲 Erneut
                </SubtleButton>
              ) : null}
              <PrimaryButton
                onClick={onConfirm}
                disabled={status === "saving"}
                accent={DAILY_ACCENT}
              >
                {status === "saving" ? "Pushe..." : "Ins Daily"}
              </PrimaryButton>
            </>
          ) : mode !== null ? (
            <>
              <SubtleButton onClick={onBackToChoose}>Zurück</SubtleButton>
              <SubtleButton onClick={onClose}>Abbrechen</SubtleButton>
            </>
          ) : (
            <SubtleButton onClick={onClose}>Abbrechen</SubtleButton>
          )}
        </footer>
      </div>
    </div>
  );
}

function RandomMode({
  scope,
  category,
  eligiblePool,
  filteredPool,
  onSetScope,
  onSetCategory,
  onPick,
}: {
  scope: "all" | "category";
  category: Category | "all";
  eligiblePool: AdminQuestionRow[];
  filteredPool: AdminQuestionRow[];
  onSetScope: (scope: "all" | "category") => void;
  onSetCategory: (category: Category | "all") => void;
  onPick: (scope: "all" | "category") => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Eyebrow>Pool für den Wurf</Eyebrow>
        <div className="grid grid-cols-2 gap-2">
          <SubtleButton
            onClick={() => {
              onSetScope("all");
              onSetCategory("all");
            }}
            selected={scope === "all"}
            accent={DAILY_ACCENT}
            fullWidth
          >
            Alle Kategorien
          </SubtleButton>
          <SubtleButton
            onClick={() => onSetScope("category")}
            selected={scope === "category"}
            accent={DAILY_ACCENT}
            fullWidth
          >
            Kategorie
          </SubtleButton>
        </div>
      </div>

      {scope === "category" ? (
        <label className="block space-y-1.5">
          <Eyebrow>Kategorie</Eyebrow>
          <DarkSelect
            value={category === "all" ? "" : category}
            onChange={(value) => onSetCategory(value as Category)}
            options={[
              { value: "", label: "Bitte wählen…", disabled: true },
              ...(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => ({
                value: cat,
                label: `${CATEGORY_EMOJI[cat]} ${CATEGORY_LABELS[cat]}`,
              })),
            ]}
          />
        </label>
      ) : null}

      <PrimaryButton
        onClick={() => onPick(scope)}
        disabled={
          eligiblePool.length === 0 ||
          (scope === "category" && (category === "all" || filteredPool.length === 0))
        }
        accent={DAILY_ACCENT}
        fullWidth
      >
        🎲 Würfeln
      </PrimaryButton>
    </div>
  );
}

function ManualMode({
  category,
  filteredPool,
  onSetCategory,
  onPick,
}: {
  category: Category | "all";
  filteredPool: AdminQuestionRow[];
  onSetCategory: (category: Category | "all") => void;
  onPick: (row: AdminQuestionRow) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block space-y-1.5">
        <Eyebrow>Kategorie</Eyebrow>
        <DarkSelect
          value={category}
          onChange={(value) => onSetCategory(value as Category | "all")}
          options={[
            { value: "all", label: "Alle Kategorien" },
            ...(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => ({
              value: cat,
              label: `${CATEGORY_EMOJI[cat]} ${CATEGORY_LABELS[cat]}`,
            })),
          ]}
        />
      </label>

      {filteredPool.length === 0 ? (
        <p
          className="rounded-xl bg-[#0E0E0E] px-3 py-2 text-[12px] leading-relaxed text-[#A8A8A8] ring-1 ring-[#1F1F1F]"
        >
          Keine eligible Fragen in dieser Kategorie.
        </p>
      ) : (
        <ul className="max-h-[40vh] overflow-y-auto rounded-xl bg-[#0E0E0E] ring-1 ring-[#1F1F1F]">
          {filteredPool.map((row, idx) => (
            <li
              key={row.questionId}
              className={idx === filteredPool.length - 1 ? "" : "border-b border-[#1F1F1F]"}
            >
              <button
                type="button"
                onClick={() => onPick(row)}
                className="flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition hover:bg-[#1A1A1A]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryChip
                    emoji={CATEGORY_EMOJI[row.category]}
                    label={CATEGORY_LABELS[row.category]}
                  />
                  <MonoMetaLabel>{TYPE_LABELS[row.type]}</MonoMetaLabel>
                </div>
                <p className="text-[13px] font-medium text-[#FAFAFA]">{row.text}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PreviewBlock({ selected }: { selected: AdminQuestionRow }) {
  return (
    <div className="space-y-3">
      <Eyebrow accent={DAILY_ACCENT}>Vorschau</Eyebrow>
      <div className="space-y-2 rounded-xl bg-[#0E0E0E] p-3 ring-1 ring-[#1F1F1F]">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip
            emoji={CATEGORY_EMOJI[selected.category]}
            label={CATEGORY_LABELS[selected.category]}
          />
          <MonoMetaLabel>{TYPE_LABELS[selected.type]}</MonoMetaLabel>
        </div>
        <p className="text-[14px] leading-snug text-[#FAFAFA]">{selected.text}</p>
        {selected.type === "either_or" && selected.options ? (
          <ul className="space-y-0.5 pl-4 text-[12px] text-[#A8A8A8]">
            {selected.options.map((opt, i) => (
              <li key={i} className="list-disc">
                {opt}
              </li>
            ))}
          </ul>
        ) : null}
        {selected.type === "meme_caption" && selected.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.imagePath}
            alt=""
            className="h-32 w-full rounded-xl object-cover ring-1 ring-[#1F1F1F]"
          />
        ) : null}
      </div>
    </div>
  );
}
