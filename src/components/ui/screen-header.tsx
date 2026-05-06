import type { ReactNode } from "react";

type HeaderTheme = "default" | "daily" | "recap" | "profile" | "archive";

const themeClasses: Record<
  HeaderTheme,
  { shell: string; eyebrow: string; title: string; subtitle: string }
> = {
  default: {
    shell: "",
    eyebrow: "text-sand-500",
    title: "text-sand-900",
    subtitle: "text-sand-700",
  },
  daily: {
    shell:
      "rounded-[30px] border border-white/55 bg-linear-to-br from-daily-primary to-daily-text px-5 py-5 shadow-[0_18px_44px_rgba(107,67,26,0.18)] text-center",
    eyebrow: "text-white/82",
    title: "text-white",
    subtitle: "text-white/82",
  },
  recap: {
    shell:
      "rounded-[30px] border border-white/50 bg-linear-to-br from-recap-primary to-recap-strong px-5 py-5 shadow-[0_20px_50px_rgba(126,91,174,0.26)] text-center",
    eyebrow: "text-white/82",
    title: "text-white",
    subtitle: "text-white/82",
  },
  profile: {
    shell:
      "rounded-[30px] border border-[#2C2C2E] bg-linear-to-br from-[#D860B5] via-[#9F3B83] to-[#161616] px-5 py-5 shadow-[0_20px_50px_rgba(216,96,181,0.22)] text-center",
    eyebrow: "text-white/82",
    title: "text-white",
    subtitle: "text-white/82",
  },
  archive: {
    shell:
      "rounded-[30px] border border-white/55 bg-linear-to-br from-archive-mid via-archive-primary to-archive-strong px-5 py-5 shadow-[0_20px_50px_rgba(110,26,40,0.25)] text-center",
    eyebrow: "text-white/82",
    title: "text-white",
    subtitle: "text-white/82",
  },
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
  const colors = themeClasses[theme];
  return (
    <header
      className={`space-y-2 px-1 pb-3 pt-4 ${
        colors.shell ? colors.shell : ""
      }`}
    >
      {eyebrow ? (
        <p
          className={`text-xs font-semibold uppercase tracking-[0.18em] ${colors.eyebrow}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1.5">
          <h1
            className={`text-[clamp(1.8rem,7vw,3rem)] font-semibold leading-[1.1] tracking-tight ${colors.title}`}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className={`text-[15px] leading-relaxed ${colors.subtitle}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="pt-0.5 sm:shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
