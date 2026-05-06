import { EmptyState } from "@/components/ui/empty-state";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type { DailyHistoryEntry } from "@/lib/types/frontend";

export function DailyHistoryList({ entries }: { entries: DailyHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon="📅"
        tone="profile"
        title="Noch keine Dailys beantwortet"
        description="Los gehts morgen, dann startet dein Verlauf."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const complete =
          entry.totalInRun > 0 && entry.answeredByMe === entry.totalInRun;
        const none = entry.answeredByMe === 0;
        return (
          <li
            key={entry.runId ?? entry.dateKey}
            className="flex flex-col gap-2 rounded-2xl border border-[#1F1F1F] bg-[#161616] px-4 py-3 shadow-card-flat sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-0.5">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#FAFAFA]">
                <span>{formatBerlinDateLabel(entry.dateKey)}</span>
                {entry.runLabel ? (
                  <span className="rounded-full bg-[#241320] px-2 py-0.5 text-[11px] font-bold text-[#D860B5]">
                    {entry.runLabel}
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-[#A8A8A8]">
                {entry.status === "active"
                  ? "Läuft noch"
                  : entry.status === "closed"
                    ? "Abgeschlossen"
                    : "Geplant"}
              </p>
            </div>
            <div
              className={`self-start rounded-full px-3 py-1 text-xs font-semibold tabular-nums sm:self-auto ${
                complete
                  ? "bg-[#16351F] text-[#8BE59A]"
                  : none
                    ? "bg-[#241320] text-[#D860B5]"
                    : "bg-[#211A10] text-[#F39A2B]"
              }`}
            >
              {entry.answeredByMe}/{entry.totalInRun}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

