"use client";

import { useRef } from "react";

export function AvatarUploader({
  displayName,
  previewUrl,
  onFileSelected,
  onClear,
}: {
  displayName: string;
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex size-28 items-center justify-center overflow-hidden rounded-full bg-[#161616] text-3xl font-semibold text-[#FAFAFA] ring-4 ring-[#2C2C2E]"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Profilbild"
            className="size-full object-cover"
          />
        ) : (
          initials
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/80 py-1 text-[10px] font-semibold uppercase tracking-wider">
          {previewUrl ? "Ändern" : "Hochladen"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
      {previewUrl ? (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-[#A8A8A8] underline underline-offset-2"
        >
          Bild entfernen
        </button>
      ) : null}
    </div>
  );
}
