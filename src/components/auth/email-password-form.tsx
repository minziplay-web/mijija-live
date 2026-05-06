"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export function EmailPasswordForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {
    authState,
    loginWithGoogle,
    loginWithPassword,
    registerWithPassword,
    isMockMode,
  } = useAuth();

  const isBusy =
    authState.status === "requesting_link" ||
    authState.status === "verifying_link" ||
    authState.status === "initializing";

  const passwordHint =
    password.length > 0 && password.length < 6
      ? "Passwort muss mindestens 6 Zeichen haben."
      : null;

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (mode === "login") {
          await loginWithPassword(email, password);
        } else {
          await registerWithPassword(email, password);
        }
      }}
    >
      <Button
        type="button"
        variant="secondary"
        className="w-full border border-[#2C2C2E] bg-[#000000] text-[#FAFAFA] hover:bg-[#1F1F1F] disabled:bg-[#000000] disabled:text-[#6E6E73]"
        disabled={isBusy}
        onClick={() => void loginWithGoogle()}
      >
        <span aria-hidden>G</span>
        Mit Google weiter
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#1F1F1F]" />
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#6E6E73]">
          oder
        </span>
        <div className="h-px flex-1 bg-[#1F1F1F]" />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#000000] p-1 ring-1 ring-[#1F1F1F]">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`min-h-11 rounded-xl text-sm font-semibold transition ${
            mode === "login"
              ? "bg-[#F39A2B] text-black"
              : "text-[#A8A8A8] hover:bg-[#1F1F1F]"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`min-h-11 rounded-xl text-sm font-semibold transition ${
            mode === "register"
              ? "bg-[#F39A2B] text-black"
              : "text-[#A8A8A8] hover:bg-[#1F1F1F]"
          }`}
        >
          Registrieren
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A8A8A8]" htmlFor="email">
          E-Mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="freund@beispiel.de"
          className="min-h-12 w-full rounded-2xl border border-[#2C2C2E] bg-[#000000] px-4 text-base text-[#FAFAFA] outline-none placeholder:text-[#6E6E73] focus:border-[#F39A2B]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A8A8A8]" htmlFor="password">
          Passwort
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="mindestens 6 Zeichen"
          className="min-h-12 w-full rounded-2xl border border-[#2C2C2E] bg-[#000000] px-4 text-base text-[#FAFAFA] outline-none placeholder:text-[#6E6E73] focus:border-[#F39A2B]"
        />
        {passwordHint ? (
          <p className="text-xs text-[#F39A2B]">{passwordHint}</p>
        ) : null}
      </div>

      <Button
        className="w-full bg-[#F39A2B] text-black hover:bg-[#FFB14F] disabled:bg-[#2C2C2E] disabled:text-[#6E6E73]"
        disabled={!email || password.length < 6 || isBusy}
      >
        {isBusy
          ? "Läuft..."
          : mode === "login"
            ? "Einloggen"
            : "Account erstellen"}
      </Button>

      <p className="text-sm text-[#A8A8A8]">
        {isMockMode
          ? "Mock-Modus aktiv: ohne Firebase springt die App mit Demo-Daten weiter."
          : "Du kannst dich mit Google oder klassisch per E-Mail und Passwort anmelden."}
      </p>

      {authState.status === "error" ? (
        <p className="rounded-2xl bg-[#3A1414] px-4 py-3 text-sm text-red-200">
          {authState.message}
        </p>
      ) : null}
    </form>
  );
}
