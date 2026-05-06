"use client";

import {
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { activityEventsCollection } from "@/lib/firebase/collections";
import type { ActivityEventDoc } from "@/lib/types/firestore";

export type ActivityEvent = ActivityEventDoc & {
  eventId: string;
};

export function subscribeDailyActivityEvents(
  params: {
    dateKey: string;
    limit?: number;
  },
  onNext: (events: ActivityEvent[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const eventsRef = activityEventsCollection();

  if (!eventsRef) {
    queueMicrotask(() => onError?.(new Error("Firestore ist nicht verfügbar.")));
    return () => undefined;
  }

  return onSnapshot(
    query(
      eventsRef,
      where("dateKey", "==", params.dateKey),
      orderBy("createdAt", "desc"),
      limitQuery(params.limit ?? 50),
    ),
    (snapshot) => {
      onNext(
        snapshot.docs.map((eventDoc) => ({
          eventId: eventDoc.id,
          ...(eventDoc.data() as ActivityEventDoc),
        })),
      );
    },
    (error) => onError?.(error),
  );
}
