"use client";

import type { ReactNode } from "react";

import { STORY_COLORS } from "@/components/story/constants";
import type { Category } from "@/lib/types/frontend";

/**
 * StoryShell — geteilte Layout-Hülle für Story-Format-Slides.
 *
 * Stages 1 (Antworten), 2 (Daily Reveal), 3 (Archiv-Detail) konsumieren das.
 * Stage 5 fügt InlineComments im footer-Slot ein.
 *
 * Aufbau (von oben nach unten):
 *   1. Eyebrow-Header: Kategorie-Pill links, Position-Counter "03 / 05" rechts
 *   2. Frage-Text als Geist-Sans 18-20px (kein Italic, kein Magazine)
 *   3. Body-Slot — Type-spezifischer Renderer (Antwort-UI ODER Reveal)
 *   4. Footer-Slot — Submit-Button (Antworten-Mode) ODER Comments (Reveal-Mode)
 *
 * Akzentfarbe: page-spezifisch via `accentColor`-Prop. User-Decision 2026-05-06
 * Round 3: alle Slides auf Daily-Page nutzen Daily-Orange, alle auf Antworten-
 * Page Antworten-Blau, etc. — nicht random pro Kategorie.
 *
 * NICHT enthalten: Swipe-Navigation. Pages koordinieren das selbst.
 */
export function StoryShell({
  position,
  category: _category,
  categoryLabel,
  questionText,
  accentColor,
  body,
  footer,
  className = "",
}: {
  position: { current: number; total: number };
  /** @deprecated noch akzeptiert für Aufruferskompatibilität, wird aber nicht
   *  mehr für Farb-Auswahl verwendet — das macht jetzt accentColor. */
  category?: Category;
  categoryLabel: string;
  questionText: string;
  /** Tab-Akzentfarbe (Daily/Antworten/Archiv/Profil). Default Daily-Orange. */
  accentColor?: string;
  body: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const accent = accentColor ?? STORY_COLORS.daily;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl px-4 py-4 ${className}`}
      style={{ backgroundColor: STORY_COLORS.bgElev }}
    >
      {/* eyebrow + position */}
      <header className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: accent, fontFamily: "var(--font-mono)" }}
        >
          <span
            aria-hidden
            className="block h-1 w-1 rounded-full"
            style={{ backgroundColor: accent }}
          />
          {categoryLabel}
        </span>
        <span
          className="text-[11px] tabular-nums"
          style={{
            color: STORY_COLORS.ink50,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.02em",
          }}
        >
          {String(position.current).padStart(2, "0")} / {String(position.total).padStart(2, "0")}
        </span>
      </header>

      {/* question text — sanfter Hintergrund-Block + linker Akzent-Stripe.
          User-Decision 2026-05-06 R8: Frage größer + mehr Padding damit sie
          sich klar als Frage abhebt, nicht als beiläufige Zeile. */}
      <div
        className="mt-4 rounded-xl border-l-[3px] px-4 py-4"
        style={{
          backgroundColor: STORY_COLORS.bgSubtle,
          borderLeftColor: accent,
        }}
      >
        <h2
          className="text-[17px] font-semibold leading-[1.3] tracking-tight"
          style={{
            color: STORY_COLORS.ink,
            textWrap: "balance",
          }}
        >
          {questionText}
        </h2>
      </div>

      {/* body slot — kein flex-1 mehr, Slide passt sich an Inhalt an */}
      <div className="mt-4">{body}</div>

      {/* footer slot */}
      {footer ? (
        <footer
          className="mt-4 pt-3"
          style={{ borderTop: `1px solid ${STORY_COLORS.hairSoft}` }}
        >
          {footer}
        </footer>
      ) : null}
    </article>
  );
}
