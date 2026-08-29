// useTheme — manages the light/dark color theme and applies it to the document.
//
// Dark mode is driven by toggling the `dark` class on `document.documentElement`;
// the CSS in `src/styles/theme.css` maps that class (via the `dark` custom
// variant) to the dark color-token set. This hook owns the theme state, keeps
// the DOM class in sync, and persists the user's preference so it survives
// reloads.
//
// Behavior:
//   - On init, reads the persisted preference from the injected storage
//     (STORAGE_KEYS.theme). If none exists, it falls back to the OS preference
//     via `window.matchMedia("(prefers-color-scheme: dark)")`, defaulting to
//     "light" when matchMedia is unavailable (e.g. non-DOM test environments).
//   - An effect applies the theme by toggling the `dark` class on the document
//     root whenever `theme` changes, and writes the preference back to storage.
//     Storage failures (private mode, quota) are swallowed so they never break
//     the UI — mirroring `usePersistentLayout`.
//
// `Storage` is injected via `Pick<Storage, ...>` and defaults to
// `window.localStorage`, so tests can supply a mock without a real browser store
// (Dependency Inversion, matching usePersistentLayout.ts).

import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/constants/layout";

/** The two supported color themes. */
export type Theme = "light" | "dark";

/** The subset of the `Storage` API this hook needs (read on init, write on change). */
export type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

/** Public contract consumed by the composition root. */
export interface ThemeControls {
  /** The active theme. */
  theme: Theme;
  /** Set the theme explicitly. */
  setTheme: (theme: Theme) => void;
  /** Flip between light and dark. */
  toggleTheme: () => void;
}

/**
 * Resolve the initial theme: a valid persisted preference wins; otherwise fall
 * back to the OS `prefers-color-scheme` hint, defaulting to "light" when
 * `matchMedia` is unavailable or nothing indicates dark.
 */
function resolveInitialTheme(storage: ThemeStorage): Theme {
  try {
    const stored = storage.getItem(STORAGE_KEYS.theme);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // Ignore storage read failures (private mode, quota); fall through to OS.
  }

  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

/**
 * React hook that manages the color theme, syncs it to the document root's
 * `dark` class, and persists the preference.
 *
 * @param storage - anything exposing `getItem`/`setItem`; defaults to
 *   `window.localStorage`. Injected for testability.
 */
export function useTheme(
  storage: ThemeStorage = window.localStorage,
): ThemeControls {
  // Resolve once on mount from storage → OS preference → "light".
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme(storage));

  // Apply the theme to the document root and persist it on every change. The
  // `dark` class toggle is what the CSS `dark` variant keys off of.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");

    try {
      storage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // Ignore storage write failures (private mode, quota); the applied class
      // above still reflects the current theme for this session.
    }
  }, [storage, theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return { theme, setTheme, toggleTheme };
}
