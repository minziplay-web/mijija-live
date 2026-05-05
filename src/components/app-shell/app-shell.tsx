import type { ReactNode } from "react";

import { BottomNav } from "@/components/app-shell/bottom-nav";
import { TopBar } from "@/components/app-shell/top-bar";
import { isTestFirebaseProject } from "@/lib/firebase/config";

export function AppShell({
  children,
  hideNav = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-page text-sand-900">
      {!hideNav ? <TopBar /> : null}
      {isTestFirebaseProject() ? (
        <div className="mx-auto w-full max-w-screen-sm px-4 pt-2">
          <div
            className="rounded-full border border-brand-primary/45 bg-white/95 px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-primary"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Testsystem · mijija-test
          </div>
        </div>
      ) : null}
      <main
        className={`mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col px-4 pt-4 ${
          hideNav ? "pb-8" : "pb-nav"
        }`}
      >
        {children}
      </main>
      {!hideNav ? <BottomNav /> : null}
    </div>
  );
}
