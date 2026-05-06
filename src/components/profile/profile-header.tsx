import { AvatarCircle } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AppUser } from "@/lib/types/frontend";

const PROFILE_ACCENT = "#D860B5";

export function ProfileHeader({
  user,
  isSelf,
  isEditing = false,
  onToggleEditing,
  onEditName,
  onEditPhoto,
}: {
  user: AppUser;
  isSelf: boolean;
  isEditing?: boolean;
  onToggleEditing?: () => void;
  onEditName?: () => void;
  onEditPhoto?: () => void;
}) {
  const member = {
    userId: user.userId,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };

  return (
    <section className="relative overflow-hidden radius-card border border-[#2C2C2E] bg-[#161616] p-6 text-center shadow-[0_18px_42px_-28px_rgba(0,0,0,0.75)]">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 bg-linear-to-br from-[#D860B5] via-[#9F3B83] to-[#161616]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-14 h-20 rounded-[100%] bg-[#161616]"
      />
      {isSelf ? (
        <button
          type="button"
          onClick={onToggleEditing}
          className="absolute right-3 top-3 z-10 inline-flex size-12 items-center justify-center rounded-full border-2 border-[#161616] text-lg font-bold text-white shadow-card-raised transition hover:scale-105 active:scale-95"
          style={{ backgroundColor: PROFILE_ACCENT }}
          aria-label={isEditing ? "Bearbeiten beenden" : "Profil bearbeiten"}
        >
          ✎
        </button>
      ) : null}

      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="relative rounded-full bg-[#000000] p-1 shadow-card-raised ring-2 ring-[#2C2C2E]">
          <AvatarCircle member={member} size="xl" />
          {isSelf && isEditing ? (
            <button
              type="button"
              onClick={onEditPhoto}
              className="absolute -bottom-2 -right-2 inline-flex size-12 items-center justify-center rounded-full border-4 border-[#161616] text-lg font-bold text-white shadow-card-raised transition hover:scale-105 active:scale-95"
              style={{ backgroundColor: PROFILE_ACCENT }}
              aria-label="Profilbild bearbeiten"
            >
              ✎
            </button>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[#FAFAFA]">
              {user.displayName}
            </h1>
            {isSelf && isEditing ? (
              <button
                type="button"
                onClick={onEditName}
                className="inline-flex size-11 items-center justify-center rounded-full text-base font-bold text-white shadow-card-flat transition hover:scale-105 active:scale-95"
                style={{ backgroundColor: PROFILE_ACCENT }}
                aria-label="Anzeigenamen bearbeiten"
              >
                ✎
              </button>
            ) : null}
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Badge tone={user.role === "admin" ? "dark" : "neutral"} size="sm">
              {user.role === "admin" ? "Admin" : "Mitglied"}
            </Badge>
            {isSelf ? (
              <Badge tone="profile" size="sm">
                Du
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

