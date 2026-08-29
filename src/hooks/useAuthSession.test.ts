// Unit tests for useAuthSession persistence effect writes.
//
// These tests assert the hook's write-through behavior against an *injected*
// storage: logging in writes the role key, logging out removes it. Storage is
// mocked via `vi.fn` getItem/setItem/removeItem so the effect is exercised
// without a real `localStorage`.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { STORAGE_KEYS } from "@/constants/layout";
import { useAuthSession, type AuthSessionStorage } from "./useAuthSession";

/**
 * A `vi.fn`-backed mock of the injected `Storage` subset. `getItem` returns
 * `null` by default so the hook initializes logged out, isolating the
 * change-under-test from any pre-existing stored state.
 */
function createMockStorage(): AuthSessionStorage & {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
} {
  return {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
}

describe("useAuthSession persistence effect writes", () => {
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it("starts logged out when nothing is persisted", () => {
    const { result } = renderHook(() => useAuthSession(storage));
    expect(result.current.role).toBeNull();
  });

  it("does not write a role key while logged out on mount", () => {
    renderHook(() => useAuthSession(storage));
    expect(storage.setItem).not.toHaveBeenCalledWith(
      STORAGE_KEYS.role,
      expect.anything(),
    );
  });

  it("writes the chosen role to storage on login", () => {
    const { result } = renderHook(() => useAuthSession(storage));

    act(() => {
      result.current.login("portfolio");
    });

    expect(result.current.role).toBe("portfolio");
    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.role, "portfolio");
  });

  it("removes the persisted role on logout", () => {
    storage.getItem.mockReturnValue("leadership");
    const { result } = renderHook(() => useAuthSession(storage));
    expect(result.current.role).toBe("leadership");

    act(() => {
      result.current.logout();
    });

    expect(result.current.role).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.role);
  });

  it("restores a valid persisted session on mount", () => {
    storage.getItem.mockReturnValue("leadership");
    const { result } = renderHook(() => useAuthSession(storage));
    expect(result.current.role).toBe("leadership");
  });

  it("starts logged out when the persisted value is unknown", () => {
    storage.getItem.mockReturnValue("not-a-real-role");
    const { result } = renderHook(() => useAuthSession(storage));
    expect(result.current.role).toBeNull();
  });
});
