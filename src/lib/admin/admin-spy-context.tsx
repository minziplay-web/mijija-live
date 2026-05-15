"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "mijija:adminSpy";

interface AdminSpyContextValue {
  spyEnabled: boolean;
  setSpyEnabled: (next: boolean) => void;
}

const AdminSpyContext = createContext<AdminSpyContextValue | null>(null);

function readInitialSpyFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AdminSpyProvider({ children }: { children: ReactNode }) {
  const [spyEnabled, setSpyEnabledState] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setSpyEnabledState(readInitialSpyFlag()));

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setSpyEnabledState(event.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSpyEnabled = useCallback((next: boolean) => {
    setSpyEnabledState(next);
    try {
      if (next) {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage may be unavailable (private mode); state still updates in memory.
    }
  }, []);

  const value = useMemo<AdminSpyContextValue>(
    () => ({ spyEnabled, setSpyEnabled }),
    [spyEnabled, setSpyEnabled],
  );

  return <AdminSpyContext.Provider value={value}>{children}</AdminSpyContext.Provider>;
}

export function useAdminSpy(): AdminSpyContextValue {
  const ctx = useContext(AdminSpyContext);
  if (!ctx) {
    return { spyEnabled: false, setSpyEnabled: () => undefined };
  }
  return ctx;
}
