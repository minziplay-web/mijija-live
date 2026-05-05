"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CATEGORY_LABELS } from "@/lib/mapping/categories";
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

import {
  QuestionEditPanel,
  normalizeEitherOrOptions,
} from "@/components/admin/admin-question-list";

type BadgeTone = "neutral" | "dark" | "accent" | "success" | "warning" | "danger";

const STATUS_TONE: Record<
  AdminDailyRunRow["status"],
  { label: string; tone: BadgeTone }
> = {
  scheduled: { label: "Geplant", tone: "neutral" },
  active: { label: "Aktiv", tone: "success" },
  closed: { label: "Abgeschlossen", tone: "neutral" },
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

  return (
    <div className="space-y-3">
      {todayRun ? (
        <div className="overflow-hidden rounded-2xl border border-daily-primary/30 bg-white shadow-card-flat">
          <button
            type="button"
            onClick={() => setTodayOpen((v) => !v)}
            aria-expanded={todayOpen}
            className="flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-daily-soft/40"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9A4C13]">
                Heute
              </p>
              <p className="truncate text-sm font-bold text-sand-900">
                {todayRun.questionCount} Fragen
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone="warning" size="sm">Heute</Badge>
              <span
                aria-hidden
                className={`text-sm text-sand-400 transition-transform duration-200 ${todayOpen ? "rotate-90" : ""}`}
              >
                ›
              </span>
            </div>
          </button>

          {todayOpen ? (
            <div className="space-y-3 border-t border-daily-primary/15 p-3">
              {todayRun.items && todayRun.items.length > 0 ? (
                <div className="space-y-2">
                  <p className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-sand-500">
                    Heutige Fragen
                  </p>
                  <ul className="space-y-2">
                    {(todayRun.items ?? []).map((item, index) => (
                      <li
                        key={`${todayRun.runId}_${item.questionId}`}
                        className="space-y-3 rounded-2xl border border-sand-200 bg-sand-50/70 px-3 py-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          {item.type === "meme_caption" && item.imagePath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imagePath}
                              alt=""
                              className="h-24 w-full rounded-2xl object-cover sm:h-20 sm:w-28"
                            />
                          ) : null}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sand-500">
                                Frage {index + 1}
                              </p>
                              <CategoryBadge category={item.category} size="sm" />
                              <Badge tone="neutral" size="sm">
                                {TYPE_LABELS[item.type]}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium leading-6 text-sand-900">
                              {item.text}
                            </p>
                          </div>
                          <div className="grid w-full shrink-0 grid-cols-3 gap-2 sm:w-auto sm:grid-cols-1">
                            <Button
                              variant="ghost"
                              className="rounded-xl px-3 text-[12px] text-admin-primary"
                              onClick={() => startEditing(item)}
                              disabled={runActionStatus === "running" || !onUpdateQuestion}
                            >
                              Bearbeiten
                            </Button>
                            <Button
                              variant="ghost"
                              className="rounded-xl px-3 text-[12px] text-brand-primary"
                              onClick={() =>
                                onRerollQuestion?.(
                                  todayRun.dateKey,
                                  todayRun.runId,
                                  item.questionId,
                                  item.text,
                                )
                              }
                              disabled={runActionStatus === "running" || !onRerollQuestion}
                            >
                              Neu würfeln
                            </Button>
                            <Button
                              variant="ghost"
                              className="rounded-xl px-3 text-[12px] text-danger-text"
                              onClick={() =>
                                onRemoveQuestion?.(
                                  todayRun.dateKey,
                                  todayRun.runId,
                                  item.questionId,
                                  item.text,
                                )
                              }
                              disabled={runActionStatus === "running" || !onRemoveQuestion}
                            >
                              Entfernen
                            </Button>
                          </div>
                        </div>
                        {editingId === item.questionId && editDraft ? (
                          <QuestionEditPanel
                            draft={editDraft}
                            status={editStatus}
                            message={editMessage}
                            onChange={updateDraft}
                            onTypeChange={changeDraftType}
                            onSave={saveEdit}
                            onCancel={cancelEditing}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-3">
                <Button
                  className="w-full rounded-xl text-[12px]"
                  variant="secondary"
                  onClick={onAddSpecificQuestion ? openAddModal : onCreate}
                  disabled={runActionStatus === "running" || addStatus === "saving"}
                >
                  Frage hinzufügen
                </Button>
                <Button
                  className="w-full rounded-xl text-[12px]"
                  variant="ghost"
                  onClick={onReplaceToday}
                  disabled={runActionStatus === "running" || !onReplaceToday}
                >
                  {runActionStatus === "running" ? "Rerollt..." : "Daily rerollen"}
                </Button>
                <Button
                  className="w-full rounded-xl text-[12px]"
                  variant="ghost"
                  onClick={onResetToday}
                  disabled={runActionStatus === "running" || !onResetToday}
                >
                  {runActionStatus === "running" ? "Setzt zurück..." : "Antworten resetten"}
                </Button>
              </div>
              <Button
                className="w-full rounded-xl text-[12px]"
                variant="destructive"
                onClick={() => onDeleteRunComplete?.(todayRun.dateKey)}
                disabled={runActionStatus === "running" || !onDeleteRunComplete}
              >
                Daily löschen
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <Button className="w-full" onClick={onCreate} disabled={runActionStatus === "running"}>
          {runActionStatus === "running" ? "Erzeugt..." : "Neuen Run erzeugen"}
        </Button>
      )}

      {runActionMessage ? (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            runActionStatus === "error"
              ? "bg-danger-soft text-danger-text"
              : runActionStatus === "success"
                ? "bg-success-soft text-success-text"
                : "bg-sand-50 text-sand-700"
          }`}
        >
          {runActionMessage}
        </p>
      ) : null}

      {visibleRuns.length === 0 ? (
        <EmptyState
          title="Noch keine Runs"
          description="Erzeuge einen Run für heute oder morgen."
        />
      ) : (
        <ul className="space-y-2">
          {visibleRuns.map((run) => {
            const tone = STATUS_TONE[run.status];
            const isToday = run.dateKey === todayDateKey;
            return (
              <li
                key={run.runId}
                className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  isToday
                    ? "border-daily-primary/35 bg-white"
                    : "border-sand-200/80 bg-white"
                }`}
              >
                <div className="w-full min-w-0 space-y-1 sm:w-auto">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sand-900">
                    {formatBerlinDateLabel(run.dateKey)}
                    {run.runNumber > 1 ? (
                      <Badge tone="warning" size="sm">
                        {run.runLabel}
                      </Badge>
                    ) : null}
                    {isToday ? (
                      <Badge tone="warning" size="sm">
                        heute
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-sand-500">
                    {run.questionCount} Fragen · {run.createdByDisplayName}
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
                  {!isToday ? (
                    <Button
                      variant="ghost"
                      className="px-3 text-danger-text"
                      onClick={() => onDeleteRun?.(run.dateKey)}
                      disabled={runActionStatus === "running" || !onDeleteRun}
                    >
                      Löschen
                    </Button>
                  ) : null}
                  <Badge tone={tone.tone} size="sm">
                    {tone.label}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {addModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-card-raised">
            <div className="flex items-center justify-between gap-3 border-b border-sand-100 px-4 py-3">
              <p className="text-sm font-bold text-sand-900">
                {addStep === "choose" ? "Frage zum Daily hinzufügen" : "Vorschau"}
              </p>
              <button
                type="button"
                onClick={closeAddModal}
                className="text-sand-400 hover:text-sand-700"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {addStep === "choose" ? (
                addMode === null ? (
                  <div className="space-y-2">
                    <Button
                      className="w-full rounded-xl"
                      variant="secondary"
                      onClick={() => {
                        setAddMode("random");
                        setAddRandomScope("all");
                        setAddCategory("all");
                      }}
                      disabled={eligiblePool.length === 0}
                    >
                      🎲 Würfeln
                    </Button>
                    <Button
                      className="w-full rounded-xl"
                      variant="secondary"
                      onClick={() => {
                        setAddMode("manual");
                        setAddCategory("all");
                      }}
                      disabled={eligiblePool.length === 0}
                    >
                      📋 Aus Liste wählen
                    </Button>
                  </div>
                ) : addMode === "random" ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-sand-500">
                        Pool für den Wurf
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={addRandomScope === "all" ? "primary" : "ghost"}
                          onClick={() => {
                            setAddRandomScope("all");
                            setAddCategory("all");
                          }}
                        >
                          Alle Kategorien
                        </Button>
                        <Button
                          variant={addRandomScope === "category" ? "primary" : "ghost"}
                          onClick={() => setAddRandomScope("category")}
                        >
                          Einzelne Kategorie
                        </Button>
                      </div>
                    </div>

                    {addRandomScope === "category" ? (
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-sand-500">
                          Kategorie
                        </span>
                        <select
                          value={addCategory === "all" ? "" : addCategory}
                          onChange={(event) =>
                            setAddCategory(event.target.value as Category)
                          }
                          className="w-full rounded-2xl border border-sand-200 bg-white px-3 py-2 text-sm font-semibold text-sand-900 outline-none transition focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
                        >
                          <option value="" disabled>
                            Bitte wählen…
                          </option>
                          {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => (
                            <option key={category} value={category}>
                              {CATEGORY_LABELS[category]}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    <Button
                      className="w-full rounded-xl"
                      variant="primary"
                      onClick={() => pickRandom(addRandomScope)}
                      disabled={
                        eligiblePool.length === 0 ||
                        (addRandomScope === "category" &&
                          (addCategory === "all" || filteredPool.length === 0))
                      }
                    >
                      🎲 Würfeln
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-sand-500">
                        Aus Kategorie wählen
                      </span>
                      <select
                        value={addCategory}
                        onChange={(event) =>
                          setAddCategory(event.target.value as Category | "all")
                        }
                        className="w-full rounded-2xl border border-sand-200 bg-white px-3 py-2 text-sm font-semibold text-sand-900 outline-none transition focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
                      >
                        <option value="all">Alle Kategorien</option>
                        {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => (
                          <option key={category} value={category}>
                            {CATEGORY_LABELS[category]}
                          </option>
                        ))}
                      </select>
                    </label>

                    {filteredPool.length === 0 ? (
                      <p className="rounded-xl bg-sand-50 px-3 py-2 text-xs text-sand-600">
                        Keine eligible Fragen in dieser Kategorie.
                      </p>
                    ) : (
                      <ul className="max-h-[40vh] space-y-1 overflow-y-auto rounded-xl border border-sand-100 bg-sand-50/50 p-2">
                        {filteredPool.map((row) => (
                          <li key={row.questionId}>
                            <button
                              type="button"
                              onClick={() => pickFromCategory(row)}
                              className="flex w-full flex-col gap-1 rounded-lg bg-white px-3 py-2 text-left text-xs transition hover:bg-admin-primary/5"
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                <CategoryBadge category={row.category} size="sm" />
                                <Badge tone="neutral" size="sm">
                                  {TYPE_LABELS[row.type]}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-sand-900">{row.text}</p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              ) : addSelected ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-500">
                    Diese Frage ins Daily pushen?
                  </p>
                  <div className="space-y-2 rounded-2xl border border-sand-200 bg-sand-50/70 p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <CategoryBadge category={addSelected.category} size="sm" />
                      <Badge tone="neutral" size="sm">
                        {TYPE_LABELS[addSelected.type]}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium leading-6 text-sand-900">
                      {addSelected.text}
                    </p>
                    {addSelected.type === "either_or" && addSelected.options ? (
                      <ul className="list-disc space-y-0.5 pl-5 text-xs text-sand-700">
                        {addSelected.options.map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    ) : null}
                    {addSelected.type === "meme_caption" && addSelected.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={addSelected.imagePath}
                        alt=""
                        className="h-32 w-full rounded-xl object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}

              {addMessage ? (
                <p
                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                    addStatus === "error"
                      ? "bg-danger-soft text-danger-text"
                      : "bg-sand-50 text-sand-700"
                  }`}
                >
                  {addMessage}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-sand-100 px-4 py-3">
              {addStep === "preview" ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAddStep("choose");
                      setAddSelected(null);
                      setAddPickedVia(null);
                      setAddStatus("idle");
                      setAddMessage(undefined);
                    }}
                    disabled={addStatus === "saving"}
                  >
                    Zurück
                  </Button>
                  {addPickedVia === "random" ? (
                    <Button
                      variant="ghost"
                      onClick={() => pickRandom(addRandomScope)}
                      disabled={
                        addStatus === "saving" ||
                        (addRandomScope === "category"
                          ? eligiblePool.filter((row) => row.category === addCategory)
                              .length <= 1
                          : eligiblePool.length <= 1)
                      }
                    >
                      {addRandomScope === "category"
                        ? `🎲 Erneut würfeln (${
                            addCategory !== "all" ? CATEGORY_LABELS[addCategory] : ""
                          })`
                        : "🎲 Erneut würfeln"}
                    </Button>
                  ) : null}
                  <Button
                    variant="primary"
                    onClick={confirmAdd}
                    disabled={addStatus === "saving"}
                  >
                    {addStatus === "saving" ? "Pushe..." : "Ins Daily pushen"}
                  </Button>
                </>
              ) : addMode !== null ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAddMode(null);
                      setAddRandomScope("all");
                      setAddCategory("all");
                      setAddStatus("idle");
                      setAddMessage(undefined);
                    }}
                  >
                    Zurück
                  </Button>
                  <Button variant="ghost" onClick={closeAddModal}>
                    Abbrechen
                  </Button>
                </>
              ) : (
                <Button variant="ghost" onClick={closeAddModal}>
                  Abbrechen
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
