"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { Card } from "@/components/ui/card";
import { EmailPasswordForm } from "@/components/auth/email-password-form";

export default function LoginPage() {
  const router = useRouter();
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.status === "authenticated") {
      router.replace(
        authState.user.onboardingCompleted ? "/" : "/onboarding",
      );
    }
  }, [authState, router]);

  return (
    <AppShell hideNav>
      <div className="-mx-4 -mt-4 flex min-h-dvh items-center bg-[#000000] px-5">
        <Card className="w-full space-y-6 border-[#2C2C2E] bg-[#161616] text-[#FAFAFA] shadow-[0_24px_80px_-42px_rgba(0,0,0,0.9)]">
          <div className="space-y-3 text-center">
            <h1
              aria-label="Mijija"
              className="text-5xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <span style={{ color: "#F39A2B" }}>M</span>
              <span style={{ color: "#4A5699" }}>i</span>
              <span style={{ color: "#E5594F" }}>j</span>
              <span style={{ color: "#F0D043" }}>i</span>
              <span style={{ color: "#6277BA" }}>j</span>
              <span style={{ color: "#FD9E22" }}>a</span>
            </h1>
            <p className="text-sm leading-6 text-[#A8A8A8]">
              Melde dich mit Google oder klassisch per E-Mail und Passwort an.
            </p>
          </div>
          <EmailPasswordForm />
        </Card>
      </div>
    </AppShell>
  );
}
