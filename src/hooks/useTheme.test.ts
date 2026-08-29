// Unit tests for useTheme.
//
// These tests exercise the hook against an *injected* storage mock (vi.fn
// getItem/setItem) and a controllable `window.matchMedia` stub, so theme
// resolution and persistence are verified without a real localStorage. They
// cover the four core behaviors: OS-preference fallback, reading a persisted
// value, applying the `dark` class on the document root, and writing the
// preference through to storage on change.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { STORAGE_KEYS } from "@/constants/layout";
import { useTheme, type ThemeStorage } from "./useTheme";

/**
 * A `vi.fn`-backed mock of the injected `Storage` subset. `getItem` returns
 * `null` by default so the hook falls back to the OS preference unless a test
 * seeds a stored value.
 */
function createMockStorage(): ThemeStorage & {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
} {
  return {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
  };
}

/** Replace `window.matchMedia` so the OS `prefers-color-scheme` hint is controllable. */
function mockMatchMedia(prefersDark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: prefersDark && query.includes("dark"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("useTheme", () => {
  let storage: ReturnType<typeof createMockStorage>;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    storage = createMockStorage();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.documentElement.classList.remove("dark");
  });

  it("defaults to the OS preference when no value is persisted (prefers dark)", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useTheme(storage));

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("defaults to light when no value is persisted and the OS prefers light", () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useTheme(storage));

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("reads the persisted preference, overriding the OS preference", () => {
    // OS prefers light, but a persisted "dark" value should win.
    mockMatchMedia(false);
    storage.getItem.mockReturnValue("dark");

    const { result } = renderHook(() => useTheme(storage));

    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.theme);
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles the theme and updates the document root `dark` class", () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useTheme(storage));
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists the theme to the injected storage on change", () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useTheme(storage));

    // Mount persisted the resolved initial theme.
    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.theme, "light");

    act(() => {
      result.current.setTheme("dark");
    });

    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.theme, "dark");
  });
});
