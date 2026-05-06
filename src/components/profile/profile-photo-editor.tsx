"use client";

import { useEffect, useState } from "react";

import { AvatarUploader } from "@/components/onboarding/avatar-uploader";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { useAuth } from "@/lib/auth/auth-context";
import type { AppUser } from "@/lib/types/frontend";

export function ProfilePhotoEditor({ user }: { user: AppUser }) {
  const { updateProfilePhoto } = useAuth();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.photoURL);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoFile && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [photoFile, previewUrl]);

  const handleFile = (file: File) => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleClear = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPhotoFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleCancel = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPhotoFile(null);
    setPreviewUrl(user.photoURL);
    setStatus("idle");
    setError(null);
  };

  const hasChanges = photoFile !== null || previewUrl !== user.photoURL;

  const handleSave = async () => {
    setStatus("saving");
    setError(null);
    try {
      await updateProfilePhoto({
        photoFile,
        removePhoto: !photoFile && previewUrl === null && Boolean(user.photoURL),
      });
      setStatus("idle");
      setPhotoFile(null);
    } catch (saveError) {
      setStatus("error");
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Profilbild konnte nicht gespeichert werden.",
      );
    }
  };

  return (
    <section className="space-y-3 rounded-3xl border border-[#2C2C2E] bg-[#161616] p-4 shadow-card-flat">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A8A8A8]">
          Profilbild
        </p>
        <p className="text-sm text-[#A8A8A8]">
          {user.photoURL
            ? "Du kannst dein Bild austauschen oder wieder entfernen."
            : "Wenn du magst, gib deinem Profil noch ein Gesicht."}
        </p>
      </div>
      <div className="space-y-4 rounded-2xl border border-dashed border-[#2C2C2E] bg-[#000000] p-4">
        <AvatarUploader
          displayName={user.displayName}
          previewUrl={previewUrl}
          onFileSelected={handleFile}
          onClear={handleClear}
        />
        {status === "error" && error ? <ErrorBanner message={error} /> : null}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            variant="profile"
            disabled={!hasChanges || status === "saving"}
            onClick={handleSave}
          >
            {status === "saving" ? "Speichert..." : "Speichern"}
          </Button>
          <Button
            variant="ghost"
            className="flex-1 text-[#D860B5] hover:bg-[#241320] hover:text-[#E277C3]"
            onClick={handleCancel}
          >
            Zurücksetzen
          </Button>
        </div>
      </div>
    </section>
  );
}
