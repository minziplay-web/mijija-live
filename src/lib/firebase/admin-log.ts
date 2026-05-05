"use client";

import { addDoc, serverTimestamp, type FirestoreError } from "firebase/firestore";

import { adminErrorLogsCollection } from "@/lib/firebase/collections";
import { getFirebaseServices } from "@/lib/firebase/client";

function isFirestoreError(error: unknown): error is FirestoreError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

function safeJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "function") return "[function]";
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((entry) => safeJson(entry));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    let count = 0;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (count >= 50) break;
      out[k] = safeJson(v);
      count += 1;
    }
    return out;
  }
  if (typeof value === "string" && value.length > 500) {
    return `${value.slice(0, 500)}…`;
  }
  return value;
}

export async function logAdminError(params: {
  operation: string;
  error: unknown;
  context?: Record<string, unknown>;
}): Promise<void> {
  const { operation, error, context } = params;
  const message = error instanceof Error ? error.message : String(error);
  const code = isFirestoreError(error) ? error.code : null;
  const stack = error instanceof Error ? error.stack ?? null : null;
  const safeContext = context ? safeJson(context) : null;

  console.error(`[admin:${operation}]`, message, {
    code,
    context: safeContext,
    stack,
  });

  try {
    const ref = adminErrorLogsCollection();
    if (!ref) return;
    const { auth } = getFirebaseServices();
    const userId = auth?.currentUser?.uid ?? null;
    await addDoc(ref, {
      operation,
      message,
      code,
      stack,
      context: safeContext,
      userId,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent ?? null : null,
      pathname:
        typeof window !== "undefined" ? window.location?.pathname ?? null : null,
      createdAt: serverTimestamp(),
    });
  } catch (logError) {
    console.error(`[admin:${operation}] log persist failed`, logError);
  }
}

export async function withAdminLog<T>(
  operation: string,
  context: Record<string, unknown> | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    await logAdminError({ operation, error, context });
    throw error;
  }
}
