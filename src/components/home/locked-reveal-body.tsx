"use client";

import Link from "next/link";

import { STORY_COLORS } from "@/components/story";

/**
 * LockedRevealBody — Body-Slot für Story-Slides, die der User noch nicht
 * beantwortet hat. Reveal wird verschleiert (blur), damit Spoiler nicht
 * leakt. CTA verlinkt auf /daily, wo die Frage beantwortet wird.
 *
 * Visuell: Blured-Placeholder-Bars (mimicking BarChart) plus Lock-Hint.
 */
export function LockedRevealBody({
  hint = "Beantworte zuerst, dann siehst du wie alle anderen abgestimmt haben.",
}: {
  hint?: string;
}) {
  return (
    <div className="relative">
      {/* Verschwommener Fake-Chart als Hintergrund */}
      <div
        aria-hidden
        className="flex flex-col gap-5 select-none"
        style={{ filter: "blur(10px)", opacity: 0.5 }}
      >
        {[78, 54, 31, 18].map((pct, idx) => (
          <div key={idx}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span
                className="block h-3 w-24 rounded-full"
                style={{ backgroundColor: STORY_COLORS.hair }}
              />
              <span
                className="block h-3 w-8 rounded-full"
                style={{ backgroundColor: STORY_COLORS.hair }}
              />
            </div>
            <div
              className="relative h-1.5 overflow-hidden rounded-full"
              style={{ backgroundColor: STORY_COLORS.hairSoft }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: STORY_COLORS.ink50,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 py-8 text-center">
        <span
          className="inline-flex size-12 items-center justify-center rounded-full text-lg"
          style={{
            backgroundColor: STORY_COLORS.hairSoft,
            color: STORY_COLORS.daily,
          }}
          aria-hidden
        >
          🔒
        </span>
        <p
          className="text-[15px] leading-snug"
          style={{ color: STORY_COLORS.ink, fontWeight: 600 }}
        >
          Noch nicht beantwortet
        </p>
        <p
          className="max-w-[28ch] text-[13px] leading-relaxed"
          style={{ color: STORY_COLORS.ink50 }}
        >
          {hint}
        </p>
        <Link
          href="/daily"
          className="mt-1 inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-[12px] tabular-nums transition hover:bg-[#1F1F1F]"
          style={{
            backgroundColor: "transparent",
            borderColor: STORY_COLORS.daily,
            color: STORY_COLORS.daily,
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            letterSpacing: "0.08em",
          }}
        >
          JETZT ANTWORTEN
        </Link>
      </div>
    </div>
  );
}
