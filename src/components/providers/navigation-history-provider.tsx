"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type NavigationHistoryContextValue = {
  previousPath: string | null;
  currentPath: string;
};

const NavigationHistoryContext = createContext<NavigationHistoryContextValue | undefined>(undefined);

export function NavigationHistoryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initialPath = pathname || "/";

  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const currentPathRef = useRef<string>(initialPath);

  useEffect(() => {
    if (!pathname || pathname === currentPathRef.current) {
      return;
    }

    setPreviousPath(currentPathRef.current);
    currentPathRef.current = pathname;
    setCurrentPath(pathname);
  }, [pathname]);

  const value = useMemo(
    () => ({
      previousPath,
      currentPath,
    }),
    [previousPath, currentPath]
  );

  return <NavigationHistoryContext.Provider value={value}>{children}</NavigationHistoryContext.Provider>;
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);

  if (!context) {
    throw new Error("useNavigationHistory must be used within NavigationHistoryProvider");
  }

  return context;
}
