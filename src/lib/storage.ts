"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "orvelle:";

export function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeLS<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — state still works for this session */
  }
}

/**
 * useState that persists to LocalStorage. Server render and first client render
 * use `initial` (no hydration mismatch); the stored value loads right after mount.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    setValue(readLS(key, initialRef.current));
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFIX + key) setValue(readLS(key, initialRef.current));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  useEffect(() => {
    if (hydrated) writeLS(key, value);
  }, [key, value, hydrated]);

  const reset = useCallback(() => setValue(initialRef.current), []);
  return [value, setValue, hydrated, reset] as const;
}
