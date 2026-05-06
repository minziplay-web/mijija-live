"use client";

import Link from "next/link";
import { useState } from "react";

import { DailyHistoryList } from "@/components/profile/daily-history-list";
import { MemberRail } from "@/components/profile/member-rail";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileNameEditor } from "@/components/profile/profile-name-editor";
import { ProfilePhotoEditor } from "@/components/profile/profile-photo-editor";
import { ProfileStatGrid } from "@/components/profile/profile-stat-grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import type { ProfileViewState } from "@/lib/types/frontend";

const PROFILE_ACCENT = "#D860B5";

export function ProfileScreen({ state }: { state: ProfileViewState }) {
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditor, setActiveEditor] = useState<"name" | "photo" | null>(null);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Profil" title="Profil" theme="profile" />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  if (state.status === "not_found") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Profil" title="Profil" theme="profile" />
        <EmptyState
          title="Profil nicht gefunden"
          description="Dieses Mitglied existiert nicht mehr."
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh space-y-5 bg-[#000000] text-[#FAFAFA]">
      <ScreenHeader
        eyebrow={state.isSelf ? "Mein Bereich" : "Mitglied"}
        title={state.isSelf ? "Profil" : state.user.displayName}
        subtitle={
          state.isSelf
            ? "Deine Auszeichnungen, Beziehungen und letzten Dailys auf einen Blick."
            : "Hier siehst du Stats, Beziehungen und den Profilüberblick."
        }
        theme="profile"
      />
      {state.isSelf ? (
        <ProfileHeader
          user={state.user}
          isSelf={state.isSelf}
          isEditing={isEditing}
          onToggleEditing={() => {
            setIsEditing((prev) => {
              const next = !prev;
              if (!next) {
                setActiveEditor(null);
              } else {
                setActiveEditor("name");
              }
              return next;
            });
          }}
          onEditName={() => setActiveEditor("name")}
          onEditPhoto={() => setActiveEditor("photo")}
        />
      ) : (
        <ProfileHeader user={state.user} isSelf={state.isSelf} />
      )}
      {state.isSelf && isEditing ? (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#2C2C2E] bg-[#161616] p-1">
          <button
            type="button"
            className="min-h-10 rounded-xl text-sm font-semibold transition"
            style={{
              backgroundColor: activeEditor === "name" ? PROFILE_ACCENT : "transparent",
              color: activeEditor === "name" ? "#FFFFFF" : "#A8A8A8",
            }}
            onClick={() => setActiveEditor("name")}
          >
            Name
          </button>
          <button
            type="button"
            className="min-h-10 rounded-xl text-sm font-semibold transition"
            style={{
              backgroundColor: activeEditor === "photo" ? PROFILE_ACCENT : "transparent",
              color: activeEditor === "photo" ? "#FFFFFF" : "#A8A8A8",
            }}
            onClick={() => setActiveEditor("photo")}
          >
            Bild
          </button>
        </div>
      ) : null}
      {state.isSelf && isEditing && activeEditor === "name" ? (
        <ProfileNameEditor key={`${state.user.userId}:${state.user.displayName}`} user={state.user} />
      ) : null}
      {state.isSelf && isEditing && activeEditor === "photo" ? (
        <ProfilePhotoEditor
          key={`${state.user.userId}:${state.user.photoURL ?? "none"}`}
          user={state.user}
        />
      ) : null}
      <ProfileStatGrid stats={state.stats} />

      {state.isSelf ? (
        <section className="space-y-3">
          <h2
            className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: PROFILE_ACCENT }}
          >
            Meine letzten Dailys
          </h2>
          <DailyHistoryList entries={state.dailyHistory} />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2
          className="px-1 text-sm font-semibold uppercase tracking-[0.14em]"
          style={{ color: PROFILE_ACCENT }}
        >
          Mitglieder
        </h2>
        <MemberRail members={state.members} activeUserId={state.user.userId} />
      </section>

      {state.isSelf ? (
        <div className="space-y-3 pt-2">
          {state.user.role === "admin" ? (
            <Link href="/admin" className="block">
              <Button
                variant="profile"
                className="w-full"
              >
                Admin öffnen
              </Button>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => logout()}
            className="mx-auto block min-h-10 text-sm font-medium underline underline-offset-2 transition hover:opacity-80"
            style={{ color: PROFILE_ACCENT }}
          >
            Abmelden
          </button>
        </div>
      ) : null}
    </div>
  );
}
