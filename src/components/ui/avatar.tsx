import type { MemberLite } from "@/lib/types/frontend";
import { DEFAULT_PROFILE_PHOTO_URL } from "@/lib/constants/avatar";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<Size, string> = {
  xs: "size-4 text-[9px]",
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

const INITIAL_PALETTE = [
  "#F39A2B", // daily orange
  "#C45FA0", // antworten magenta
  "#E5594F", // archiv coral
  "#4A5699", // profil blue
  "#F0D043", // accent yellow
  "#6277BA", // brand light
] as const;

function pickInitialColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return INITIAL_PALETTE[h % INITIAL_PALETTE.length];
}

function hasRealPhoto(photoURL: string | null | undefined): photoURL is string {
  if (!photoURL) return false;
  if (photoURL === DEFAULT_PROFILE_PHOTO_URL) return false;
  return photoURL.trim().length > 0;
}

export function AvatarCircle({
  member,
  size = "md",
  tone = "dark",
  className = "",
}: {
  member: MemberLite;
  size?: Size;
  tone?: "dark" | "light";
  className?: string;
}) {
  const realPhoto = hasRealPhoto(member.photoURL);

  if (realPhoto) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden rounded-full ${sizeClasses[size]} ${className}`}
        aria-label={member.displayName || "Friend"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.photoURL ?? DEFAULT_PROFILE_PHOTO_URL}
          alt={member.displayName || "Friend"}
          className="size-full object-cover"
        />
      </div>
    );
  }

  const initial = (member.displayName || "?").trim().slice(0, 1).toUpperCase();
  const seed = member.userId || member.displayName || "?";
  const bg = pickInitialColor(seed);
  const ringClass =
    tone === "light" ? "ring-2 ring-white/40" : "";

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold leading-none text-white ${sizeClasses[size]} ${ringClass} ${className}`}
      style={{ backgroundColor: bg }}
      aria-label={member.displayName || "Friend"}
    >
      {initial}
    </div>
  );
}

export function AvatarBubble({
  member,
  size = "md",
}: {
  member: MemberLite;
  size?: Size;
}) {
  return (
    <div className="flex items-center gap-3">
      <AvatarCircle member={member} size={size} />
      <span className="text-sm font-medium text-sand-800">
        {member.displayName || "Friend"}
      </span>
    </div>
  );
}

export function AvatarStack({
  members,
  max = 4,
  size = "sm",
}: {
  members: MemberLite[];
  max?: number;
  size?: Size;
}) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((m, idx) => (
        <div key={m.userId} className={idx === 0 ? "" : "-ml-2"}>
          <AvatarCircle member={m} size={size} className="ring-2 ring-white" />
        </div>
      ))}
      {overflow > 0 ? (
        <div className="-ml-2 flex size-8 items-center justify-center rounded-full bg-sand-200 text-xs font-semibold text-sand-700 ring-2 ring-white">
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
