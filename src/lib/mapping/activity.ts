import type { ActivityEvent } from "@/lib/firebase/daily-activity";
import type { ActivityFeedItem } from "@/lib/types/frontend";
import type { UserDoc } from "@/lib/types/firestore";

export function mapActivityEventsToFeedItems(params: {
  events: ActivityEvent[];
  users: Map<string, Pick<UserDoc, "displayName">>;
  now?: Date;
}): ActivityFeedItem[] {
  const { events, users, now = new Date() } = params;

  return events
    .map<ActivityFeedItem | null>((event) => {
      const createdAtMs = readTimestampMs(event.createdAt);
      if (!createdAtMs) {
        return null;
      }

      const actorDisplayName = users.get(event.userId)?.displayName ?? "Jemand";
      const memeWinnerDisplayName = event.payload?.memeWinnerUserId
        ? users.get(event.payload.memeWinnerUserId)?.displayName
        : undefined;

      return {
        id: event.eventId,
        kind: event.type,
        actorUserId: event.userId,
        actorDisplayName,
        questionId: event.questionId,
        runId: event.runId,
        text: formatActivityText({
          type: event.type,
          actorDisplayName,
          commentPreview: event.payload?.commentPreview,
          memeWinnerDisplayName,
        }),
        timeLabel: formatRelativeTimeLabel(createdAtMs, now),
        createdAtMs,
        payload: {
          commentPreview: event.payload?.commentPreview,
          memeWinnerUserId: event.payload?.memeWinnerUserId,
          memeWinnerDisplayName,
        },
      } satisfies ActivityFeedItem;
    })
    .filter((item): item is ActivityFeedItem => Boolean(item))
    .sort((left, right) => right.createdAtMs - left.createdAtMs);
}

function formatActivityText(params: {
  type: ActivityEvent["type"];
  actorDisplayName: string;
  commentPreview?: string;
  memeWinnerDisplayName?: string;
}) {
  switch (params.type) {
    case "answer_submitted":
      return `${params.actorDisplayName} hat geantwortet`;
    case "comment_created":
      return params.commentPreview
        ? `${params.actorDisplayName} hat kommentiert: "${params.commentPreview}"`
        : `${params.actorDisplayName} hat kommentiert`;
    case "meme_winner":
      return params.memeWinnerDisplayName
        ? `Meme-Winner heute: ${params.memeWinnerDisplayName}`
        : "Meme-Winner steht fest";
  }
}

function readTimestampMs(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value === "object"
    && value !== null
    && "toDate" in value
    && typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  if (
    typeof value === "object"
    && value !== null
    && "seconds" in value
    && typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }

  return null;
}

function formatRelativeTimeLabel(ms: number, now: Date) {
  const diffMs = now.getTime() - ms;
  const absDiffMs = Math.abs(diffMs);
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (absDiffMs < minuteMs) {
    return "gerade eben";
  }

  if (absDiffMs < hourMs) {
    return formatRelativeUnit(-Math.round(diffMs / minuteMs), "minute");
  }

  if (absDiffMs < dayMs) {
    return formatRelativeUnit(-Math.round(diffMs / hourMs), "hour");
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(new Date(ms));
}

function formatRelativeUnit(value: number, unit: Intl.RelativeTimeFormatUnit) {
  return new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" }).format(value, unit);
}
