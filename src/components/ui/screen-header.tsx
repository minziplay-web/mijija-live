import type { ReactNode } from "react";

type HeaderTheme = "default" | "daily" | "recap" | "profile" | "archive" | "admin";

// Akzent-Farbe pro Theme. Dark-Insta-Look: kein Gradient-Shell mehr, nur
// kleine Eyebrow in Tab-Akzent + weißer Title auf Page-BG.
const themeAccent: Record<HeaderTheme, string> = {
  default: "#A8A8A8",
  daily: "#F39A2B",
  recap: "#F39A2B",
  profile: "#D860B5",
  archive: "#E5594F",
  admin: "#4A5699",
};

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  action,
  theme = "default",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  theme?: HeaderTheme;
}) {
  const accent = themeAccent[theme];
  return (
    <header className="space-y-1 px-1 pb-3 pt-4">
      {eyebrow ? (
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{
            color: accent,
            fontFamily: "var(--font-mono)",
          }}
        >
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1.5">
          <h1
            className="text-[26px] font-semibold leading-[1.1] tracking-tight"
            style={{ color: "#FAFAFA", textWrap: "balance" }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: "#A8A8A8" }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="pt-0.5 sm:shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
