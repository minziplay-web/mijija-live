import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/mapping/categories";
import { LIVE_MODE_ENABLED } from "@/lib/config/features";
import type { Category, ProfileStats } from "@/lib/types/frontend";

interface StatCard {
  label: string;
  value: string;
  helper: string;
  hasData: boolean;
  icon: string;
  accent?: "streak" | "duels" | "votes" | "trophy";
  compactValue?: boolean;
}

export function ProfileStatGrid({ stats }: { stats: ProfileStats }) {
  const items = buildStatCards(stats);

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[1.25rem] p-[1px]"
          style={{
            background: item.hasData
              ? accentShellGradients[item.accent ?? "default"]
              : "linear-gradient(135deg, #2C2C2E, #1F1F1F)",
          }}
        >
          <div
            className="flex min-h-[7.7rem] flex-col rounded-[1.18rem] border border-[#1F1F1F] bg-[#161616] p-3 transition sm:p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#A8A8A8] min-[380px]:text-[10px]">
                {item.label}
              </p>
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-base ring-1"
                style={{
                  backgroundColor: item.hasData ? "#241320" : "#1F1F1F",
                  color: item.hasData ? "#D860B5" : "#6E6E73",
                  borderColor: "#2C2C2E",
                }}
              >
                {item.icon}
              </span>
            </div>
            <p
              className={`mt-1.5 font-semibold tabular-nums slashed-zero ${
                item.compactValue
                  ? "line-clamp-2 break-words text-[clamp(0.98rem,4vw,1.16rem)] leading-tight"
                  : "text-[clamp(1.35rem,5.5vw,1.75rem)] leading-none"
              } ${
                item.hasData ? "text-[#FAFAFA]" : "text-[#6E6E73]"
              }`}
            >
              {item.value}
            </p>
            <p
              className={`mt-auto pt-2 text-[10.5px] leading-snug ${
                item.hasData ? "text-[#A8A8A8]" : "text-[#6E6E73]"
              }`}
            >
              {item.helper}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const accentShellGradients = {
  default: "linear-gradient(135deg, rgba(216,96,181,0.62), #2C2C2E)",
  streak: "linear-gradient(135deg, rgba(216,96,181,0.72), #2C2C2E)",
  votes: "linear-gradient(135deg, rgba(216,96,181,0.62), #1F1F1F)",
  trophy: "linear-gradient(135deg, rgba(240,208,67,0.7), rgba(216,96,181,0.35))",
  duels: "linear-gradient(135deg, rgba(216,96,181,0.5), #2C2C2E)",
} as const;

function buildStatCards(stats: ProfileStats): StatCard[] {
  const hasAnyDaily = stats.daily.answeredCount > 0;
  const hasAnyLive = stats.live.roundsPlayed > 0;
  const topCategory = pickTopCategory(stats.categoryActivity);
  const hasCategoryActivity = topCategory !== null;
  const hasPublicVotes = stats.publicVotesReceived.total > 0;
  const hasMemeTrophies = stats.daily.memeTrophyCount > 0;
  const topRelationship = stats.specialRelationships[0];

  return [
    {
      label: "Daily-Streak",
      value: hasAnyDaily ? `${stats.daily.streakCurrent}` : "—",
      helper: hasAnyDaily
        ? stats.daily.streakBest > 0
          ? `Best ${stats.daily.streakBest}`
          : "Streak läuft"
        : "Noch offen",
      hasData: hasAnyDaily,
      icon: "🔥",
      accent: "streak",
    },
    {
      label: "Dailys beantwortet",
      value: stats.daily.completedCount > 0 ? `${stats.daily.completedCount}` : "—",
      helper: hasAnyDaily
        ? stats.daily.firstAnswerCount > 0
          ? `${stats.daily.firstAnswerCount}× zuerst`
          : "Kein First"
        : "Noch offen",
      hasData: stats.daily.completedCount > 0,
      icon: "✓",
    },
    {
      label: "Meme-Trophäen",
      value: hasMemeTrophies ? `${stats.daily.memeTrophyCount}` : "—",
      helper: hasMemeTrophies
        ? `${stats.daily.availableTrophyCount} verfügbar`
        : "Noch keine",
      hasData: hasMemeTrophies,
      icon: "🏆",
      accent: "trophy",
    },
    ...(LIVE_MODE_ENABLED
      ? [
          {
            label: "Live-Runden",
            value: hasAnyLive ? `${stats.live.roundsPlayed}` : "—",
            helper: hasAnyLive
              ? stats.live.roundsHosted > 0
                ? `${stats.live.roundsHosted}× Host`
                : "Kein Host"
              : "Noch offen",
            hasData: hasAnyLive,
            icon: "●",
          } satisfies StatCard,
        ]
      : []),
    {
      label: "Votes erhalten",
      value: hasPublicVotes ? `${stats.publicVotesReceived.total}` : "—",
      helper: hasPublicVotes
        ? "Gewählt"
        : "Noch keine Votes",
      hasData: hasPublicVotes,
      icon: "❤",
      accent: "votes",
    },
    {
      label: "Besondere Beziehung",
      value: topRelationship ? topRelationship.member.displayName : "—",
      helper: topRelationship
        ? `${topRelationship.votes}× gewählt`
        : "Noch keine",
      hasData: Boolean(topRelationship),
      icon: "↔",
      accent: "duels",
      compactValue: true,
    },
    {
      label: "Top-Kategorie",
      value:
        hasCategoryActivity && topCategory
          ? `${CATEGORY_EMOJI[topCategory]} ${CATEGORY_LABELS[topCategory]}`
          : "—",
      helper:
        hasCategoryActivity && topCategory
          ? `${stats.categoryActivity[topCategory] ?? 0} Aktionen`
          : "Noch keine",
      hasData: hasCategoryActivity,
      icon: hasCategoryActivity && topCategory ? CATEGORY_EMOJI[topCategory] : "◇",
      compactValue: true,
    },
  ];
}

function pickTopCategory(
  activity: Partial<Record<Category, number>>,
): Category | null {
  let winner: Category | null = null;
  let winnerCount = 0;
  for (const [cat, count] of Object.entries(activity) as Array<
    [Category, number]
  >) {
    if (count > winnerCount) {
      winner = cat;
      winnerCount = count;
    }
  }
  return winner;
}

